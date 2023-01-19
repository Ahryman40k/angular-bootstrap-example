import {
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionAnnualDistribution,
  IInterventionAnnualPeriod,
  InterventionBudgetCalculationService,
  InterventionExternalReferenceType,
  InterventionStatus,
  ModificationType,
  NexoFileType,
  NexoImportStatus,
  ProjectExpand,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { chunk, isEmpty, isNil, sortBy, sum, uniq } from 'lodash';

import { configs } from '../../../../../config/configs';
import { ISaveBulkResult, ISaveOptions } from '../../../../repositories/core/baseRepository';
import { ByUuidCommand, IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { AlreadyExistsError } from '../../../../shared/domainErrors/alreadyExistsError';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { enumValues } from '../../../../utils/enumUtils';
import { fireAndForget } from '../../../../utils/fireAndForget';
import { createLogger } from '../../../../utils/logger';
import { ISheet2JSONOpts } from '../../../../utils/spreadsheets/spreadsheetsUtils';
import { appUtils, IKeyAndValue } from '../../../../utils/utils';
import { Audit } from '../../../audit/audit';
import { auditMapperDTO } from '../../../audit/mappers/auditMapperDTO';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { NexoErrorTarget } from '../../mappers/nexoErrorsLabels';
import { NexoFileError } from '../../models/nexoFileError';
import { NexoImportFile } from '../../models/nexoImportFile';
import { NexoImportLog } from '../../models/nexoImportLog';
import { NexoIntervention } from '../../models/nexoIntervention';
import { NexoLogIntervention } from '../../models/nexoLogIntervention';
import { NexoProject } from '../../models/nexoProject';
import {
  getInterventionBudgetSESheetToJSONOptions,
  IInterventionBudgetSEHeaders,
  InterventionBudgetSERow
} from '../../models/rows/interventionsBudgetSERow';
import {
  getInterventionSESheetToJSONOptions,
  IInterventionSEHeaders,
  InterventionSERow
} from '../../models/rows/interventionsSERow';
import { INexoHeaders, NexoRow } from '../../models/rows/nexoRow';
import {
  getRehabAqConceptionToJSONOptions,
  IRehabAqConceptionHeaders,
  RehabAqConceptionRow
} from '../../models/rows/rehabAqConceptionRow';
import {
  getRehabEgConceptionToJSONOptions,
  IRehabEgConceptionHeaders,
  RehabEgConceptionRow
} from '../../models/rows/rehabEgConceptionRow';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { nexoImportService } from '../../nexoImportService';
import { NexoImportFileParser } from '../../parsers/nexoImportFileParser';
import {
  IGroupedInterventionsAndBudgetRows,
  NEXO_CODE_PHASE_CANCELED,
  NexoImportFileValidator
} from '../../validators/nexoImportFileValidator';
import { NexoImportLogValidator } from '../../validators/nexoImportLogValidator';
import {
  IGroupedInterventionsAndRehabEgConceptionRows,
  NexoImportRehabEgConceptionFileValidator
} from '../../validators/nexoImportRehabEgConceptionFileValidator';

const logger = createLogger('StartNexoImportUseCase');

const interventionBudgetCalculationService = new InterventionBudgetCalculationService();

interface IDownloadResult {
  storageId: string;
  result: Result<IDownloadFileResult>;
}

interface IFailuresWithFileType {
  fileType: NexoFileType;
  failure: NexoFileError;
}

// tslint:disable:max-func-body-length
export class StartNexoImportUseCase extends UseCase<IByUuidCommandProps, void> {
  // NOSONAR
  public async execute(req: IByUuidCommandProps): Promise<Response<void>> {
    const byIdCommandResult: Result<ByUuidCommand> = ByUuidCommand.create(req);
    if (byIdCommandResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(byIdCommandResult)));
    }
    const byIdCommand = byIdCommandResult.getValue();

    const nexoImportLog: NexoImportLog = await nexoImportLogRepository.findById(byIdCommand.id);
    if (!nexoImportLog) {
      return left(new NotFoundError(`nexoImportLog ${byIdCommand.id} was not found`));
    }

    if ([NexoImportStatus.FAILURE, NexoImportStatus.SUCCESS].includes(nexoImportLog.status)) {
      return left(new UnprocessableEntityError(`NexoImport ${nexoImportLog.id} is already ${nexoImportLog.status}`));
    }
    // Check processing import
    const alreadyImporting: NexoImportLog = await NexoImportLogValidator.importAlreadyRunning(byIdCommand.id);
    if (alreadyImporting) {
      const errMessage = `Only 1 import can be processed at a time, current import ${alreadyImporting.id} started at ${alreadyImporting.audit.createdAt} by ${alreadyImporting.audit.createdBy.userName}`;
      return left(new AlreadyExistsError(errMessage, errMessage));
    }

    // tslint:disable:return-undefined
    fireAndForget(async () => {
      logger.info(`Start import`);
      try {
        await this.save(nexoImportLog, NexoImportStatus.IN_PROGRESS);

        const firstNexoFile: NexoImportFile = nexoImportLog.files.find(f => f);
        if (firstNexoFile.type !== NexoFileType.INTERVENTIONS_SE) {
          firstNexoFile.addErrors([
            NexoFileError.create({
              code: ErrorCode.INVALID,
              target: NexoErrorTarget.TYPE,
              values: {
                value1: nexoImportLog.files[0].type
              }
            }).getValue()
          ]);
        }

        if (await this.abort(nexoImportLog)) {
          return;
        }

        // DownloadFilesFromStorage
        const downloadResults: IDownloadResult[] = await Promise.all(
          nexoImportLog.files.map(async nexoImportFile => {
            return {
              storageId: nexoImportFile.storageId,
              result: await storageApiService.get(nexoImportFile.storageId)
            };
          })
        );

        for (const nexoImportFile of nexoImportLog.files) {
          const storageFileResult: IDownloadResult = downloadResults.find(
            r => r.storageId === nexoImportFile.storageId
          );
          if (storageFileResult.result.isFailure) {
            nexoImportFile.addErrors([
              NexoFileError.create({
                code: ErrorCode.MISSING,
                target: NexoErrorTarget.FILE,
                values: {
                  value1: storageFileResult.result.errorValue()
                }
              }).getValue()
            ]);
          } else {
            nexoImportFile.addErrors(
              NexoImportFileValidator.validateContent(nexoImportFile, storageFileResult.result.getValue())
            );
          }
        }

        if (await this.abort(nexoImportLog)) {
          return;
        }

        // TODO add parsing for other files
        const [
          interventionsSEResults,
          interventionsBudgetSEResults,
          rehabAqConceptionResults,
          rehabEgConceptionResults
        ] = await Promise.all([
          this.parseAndCreate<IInterventionSEHeaders, InterventionSERow>(
            this.getNexoFileByType(nexoImportLog, NexoFileType.INTERVENTIONS_SE),
            downloadResults,
            InterventionSERow.create,
            getInterventionSESheetToJSONOptions()
          ),
          this.parseAndCreate<IInterventionBudgetSEHeaders, InterventionBudgetSERow>(
            this.getNexoFileByType(nexoImportLog, NexoFileType.INTERVENTIONS_BUDGET_SE),
            downloadResults,
            InterventionBudgetSERow.create,
            getInterventionBudgetSESheetToJSONOptions()
          ),
          this.parseAndCreate<IRehabAqConceptionHeaders, RehabAqConceptionRow>(
            this.getNexoFileByType(nexoImportLog, NexoFileType.REHAB_AQ_CONCEPTION),
            downloadResults,
            RehabAqConceptionRow.create,
            getRehabAqConceptionToJSONOptions()
          ),
          this.parseAndCreate<IRehabEgConceptionHeaders, RehabEgConceptionRow>(
            this.getNexoFileByType(nexoImportLog, NexoFileType.REHAB_EG_CONCEPTION),
            downloadResults,
            RehabEgConceptionRow.create,
            getRehabEgConceptionToJSONOptions()
          )
        ]);

        // save state after parse
        await this.save(nexoImportLog, NexoImportStatus.IN_PROGRESS);

        // any guard errors found on rows ?
        const failuresWithFileType = [
          ...this.getFailuresByFileType(NexoFileType.INTERVENTIONS_SE, interventionsSEResults),
          ...this.getFailuresByFileType(NexoFileType.INTERVENTIONS_BUDGET_SE, interventionsBudgetSEResults),
          ...this.getFailuresByFileType(NexoFileType.REHAB_AQ_CONCEPTION, rehabAqConceptionResults),
          ...this.getFailuresByFileType(NexoFileType.REHAB_EG_CONCEPTION, rehabEgConceptionResults)
        ];
        for (const failuresChunk of chunk(failuresWithFileType, configs.nexoImport.dbChunkSize)) {
          this.addGuardErrorsInterventionsToImportLog(nexoImportLog, failuresChunk);
          await this.save(nexoImportLog, NexoImportStatus.IN_PROGRESS);
        }

        // Filter only the ones still valid after guard
        let interventionsSERows = interventionsSEResults.filter(result => result.isSuccess).map(r => r.getValue());
        // validate taxonomies values
        const insterventionsSERowsLists = chunk(interventionsSERows, configs.nexoImport.dbChunkSize);
        for (const list of insterventionsSERowsLists) {
          await NexoImportFileValidator.validateTaxonomies(list);
        }
        // validate business rules
        await NexoImportFileValidator.validateInterventionsSEBusinessRules(
          this.filterFailedRows<InterventionSERow>(interventionsSERows)
        );

        // Must enrich rows to set ids and modificationType
        interventionsSERows = (await nexoImportService.enrichExistingInterventionsRows(interventionsSERows)).getValue();
        const successfullInterventions = await nexoImportService.interventionsSERowsToInterventions(
          interventionsSERows
        );

        // We need to check for invalid updates. In some cases, changes cannot be supported by NEXO import.
        // Users must make these changes with the web application.
        await NexoImportFileValidator.checkForInvalidUpdates(successfullInterventions, interventionsSERows);

        // Then proceed by chunks
        const interventionsLists = chunk(successfullInterventions, configs.nexoImport.dbChunkSize);
        for (const list of interventionsLists) {
          await this.handleInterventionsSave(nexoImportLog, list);
        }
        const interventionsSERowsLists = chunk(interventionsSERows, configs.nexoImport.dbChunkSize);
        for (const list of interventionsSERowsLists) {
          await this.addInterventionRowsToNexoImportLog(nexoImportLog, NexoFileType.INTERVENTIONS_SE, list);
        }

        // When interventions from interventionsSE file (first file) are created/updated, handle other files
        // Validate interventionsSEBudget rules on still successful rows
        await this.handleInterventionsBudgetSERows(
          nexoImportLog,
          interventionsBudgetSEResults.filter(result => result.isSuccess).map(r => r.getValue())
        );

        await this.handleRehabAqConceptionRows(
          nexoImportLog,
          rehabAqConceptionResults.filter(result => result.isSuccess).map(r => r.getValue())
        );

        await this.handleRehabEgConceptionRows(
          nexoImportLog,
          rehabEgConceptionResults.filter(result => result.isSuccess).map(r => r.getValue())
        );

        // Import complete
        let finalStatus = NexoImportStatus.SUCCESS;
        if (!isEmpty(nexoImportLog.files.find(file => file.status === NexoImportStatus.FAILURE))) {
          finalStatus = NexoImportStatus.FAILURE;
        }
        await this.save(nexoImportLog, finalStatus);
        logger.info(`Import complete`);
        return;
      } catch (error) {
        logger.error(error, `Error while importing Nexo File`);
        nexoImportLog.files
          .find(f => f)
          .addErrors([
            NexoFileError.create({
              code: ErrorCode.UNEXPECTED,
              target: NexoErrorTarget.FILE,
              values: {
                value1: `Unexpected error in startNexoImportUseCase ${error.message}`
              }
            }).getValue()
          ]);
        await this.save(nexoImportLog, NexoImportStatus.FAILURE);
      }
    });
    return right(Result.ok<void>());
  }

  private async save(
    nexoImportLog: NexoImportLog,
    status: NexoImportStatus = NexoImportStatus.IN_PROGRESS
  ): Promise<Result<NexoImportLog>> {
    const nexoImportLogInitedResult = NexoImportLog.create(
      {
        status,
        files: nexoImportLog.files,
        audit: Audit.fromUpdateContext(nexoImportLog.audit)
      },
      nexoImportLog.id
    );
    if (nexoImportLogInitedResult.isFailure) {
      logger.error(nexoImportLogInitedResult.errorValue(), `saveNexoImportLog create NexoImportLog`);
      return nexoImportLogInitedResult;
    }
    return nexoImportLogRepository.save(nexoImportLogInitedResult.getValue());
  }

  private async abort(nexoImportLog: NexoImportLog) {
    let status = nexoImportLog.status;
    if (!isEmpty(nexoImportLog.files.find(file => file.status === NexoImportStatus.FAILURE))) {
      status = NexoImportStatus.FAILURE;
    }
    const savedImportLogResult = await this.save(nexoImportLog, status);
    if (savedImportLogResult.isFailure) {
      logger.error(savedImportLogResult.errorValue(), `saveNexoImportLog save NexoImportLog`);
      return true;
    }
    if (savedImportLogResult.getValue().status === NexoImportStatus.FAILURE) {
      return true;
    }
    return false;
  }

  private getNexoFileByType(nexoImportLog: NexoImportLog, type: NexoFileType): NexoImportFile {
    return nexoImportLog.files.find(f => f.type === type);
  }

  private getFileData(storageId: string, downloadResults: IDownloadResult[]): IDownloadFileResult {
    return downloadResults.find(f => f.storageId === storageId).result.getValue();
  }

  private parseAndCreate<H extends INexoHeaders, R extends NexoRow<H>>(
    nexoFile: NexoImportFile,
    downloadResults: IDownloadResult[],
    creator: (props: H) => Result<R>,
    opts?: ISheet2JSONOpts
  ): Result<R>[] {
    if (!nexoFile) {
      return [];
    }

    nexoFile.setStatus(NexoImportStatus.IN_PROGRESS);
    const parsedRowsResult = NexoImportFileParser.parse<H>(this.getFileData(nexoFile.storageId, downloadResults), opts);
    if (parsedRowsResult.isFailure) {
      nexoFile.addErrors([
        NexoFileError.create({
          code: ErrorCode.INVALID,
          target: NexoErrorTarget.FILE
        }).getValue()
      ]);
      return [];
    }
    const parsedRows = parsedRowsResult.getValue().map((jsonRow, index) =>
      creator({
        ...NexoRow.cleanRowValues(jsonRow),
        lineNumber: index + 1 // lineNumber is index + 1
      } as H)
    );
    nexoFile.setNumberOfItems(parsedRows.length);
    // On NexoRows, guardErrors are transformed to NexoFileError
    // So just get failed result and errorValue is already an array of NexoFileErrors
    const failedRows = parsedRows.filter(rowResult => rowResult.isFailure);
    if (!isEmpty(failedRows)) {
      // TODO: remove definitively the comment addErrors as errors are added by interventions ? To be checked after all file types import arendone
      // nexoFile.addErrors(appUtils.concatArrayOfArrays(failedRows.map(failedRow => failedRow.errorValue())));
    }
    return parsedRows;
  }

  // associate given file type with failure
  private getFailuresByFileType(
    fileType: NexoFileType,
    results: Result<InterventionSERow | InterventionBudgetSERow | RehabAqConceptionRow | RehabEgConceptionRow>[]
  ): IFailuresWithFileType[] {
    return appUtils
      .concatArrayOfArrays(results.filter(result => result.isFailure).map(fail => fail.errorValue()))
      .map(failure => {
        return {
          fileType,
          failure
        };
      });
  }

  private async addInterventionRowsToNexoImportLog(
    nexoImportLog: NexoImportLog,
    nexoFileType: NexoFileType,
    rows: InterventionSERow[] | InterventionBudgetSERow[] | RehabAqConceptionRow[] | RehabEgConceptionRow[]
  ) {
    const nexoFile: NexoImportFile = nexoImportLog.files.find(file => file.type === nexoFileType);
    if (nexoFile) {
      for (const row of rows) {
        nexoFile.interventions.push(row.toNexoLogIntervention());
      }
      // save nexoImport for progress bar
      await this.save(nexoImportLog, NexoImportStatus.IN_PROGRESS);
    }
  }

  private addGuardErrorsInterventionsToImportLog(nexoImportLog: NexoImportLog, failures: IFailuresWithFileType[]) {
    // Group errors by fileType
    const errorsByFileType: IKeyAndValue<IFailuresWithFileType[]> = appUtils.groupArrayToObject<IFailuresWithFileType>(
      'fileType',
      failures
    );
    Object.keys(errorsByFileType).forEach(fileType => {
      const nexoImportFile = nexoImportLog.files.find(file => file.type === fileType);
      if (nexoImportFile) {
        // Group errors by line
        const errorsByInterventionSELine: IKeyAndValue<NexoFileError[]> = appUtils.groupArrayToObject<NexoFileError>(
          'line',
          errorsByFileType[fileType].map(failureAndType => failureAndType.failure)
        );

        // map to interventions
        for (const line of Object.keys(errorsByInterventionSELine)) {
          // Each error on same line as the same id (interventionSE.comparaison)
          const interventionId = errorsByInterventionSELine[line].find(e => e).id;
          const nexoLogIntervention = NexoLogIntervention.create(
            {
              importStatus: NexoImportStatus.FAILURE,
              modificationType: undefined,
              errors: errorsByInterventionSELine[line],
              lineNumber: Number(line)
            },
            interventionId
          ).getValue();

          nexoImportFile.interventions.push(nexoLogIntervention);
        }
      }
    });
  }

  private filterFailedRows<T extends NexoRow<any>>(rows: T[]): T[] {
    return rows.filter(row => row.status !== NexoImportStatus.FAILURE);
  }

  private async handleInterventionsSave(
    nexoImportLog: NexoImportLog,
    interventions: NexoIntervention[]
  ): Promise<IEnrichedIntervention[]> {
    const interventionsToUpdate: NexoIntervention[] = [];
    const interventionsToCreate: NexoIntervention[] = [];
    const interventionsToDelete: NexoIntervention[] = [];
    // Sort between modification types previously calculated
    for (const intervention of interventions) {
      switch (intervention.modificationType) {
        case ModificationType.MODIFICATION:
          interventionsToUpdate.push(intervention);
          break;
        case ModificationType.DELETION:
          interventionsToDelete.push(intervention);
          break;
        default:
          interventionsToCreate.push(intervention);
      }
    }

    const interventionsToInsert = await this.getInterventionsToInsert(interventionsToCreate);

    // MUST handle projects before interventions as it sets the project id on them
    await this.handleProjectsFromNexoInterventions(nexoImportLog, [
      ...interventionsToInsert,
      ...interventionsToUpdate,
      ...interventionsToDelete
    ]);
    const savedInterventions = [
      ...(await this.saveInterventions(interventionsToInsert, { upsert: false })),
      ...(await this.saveInterventions(interventionsToUpdate, { upsert: true }))
    ];
    // Deletion and projects update is done through intervention repository onDelete()
    await this.deleteInterventions(interventionsToDelete);
    return savedInterventions;
  }

  private async getInterventionsToInsert(interventions: NexoIntervention[]): Promise<NexoIntervention[]> {
    if (isEmpty(interventions)) {
      return [];
    }
    // Do not insert a new intervention that is "Nexo Cancelled" => codePhase = 4
    const filteredInterventions = interventions.filter(
      intervention => intervention.codePhase !== NEXO_CODE_PHASE_CANCELED
    );
    // set new interventions ids
    const newInterventionsIds = await nexoImportService.getNextInterventionsIds(filteredInterventions.length);
    for (const [index, intervention] of filteredInterventions.entries()) {
      intervention.setId(newInterventionsIds[index]);
    }
    return filteredInterventions;
  }

  private async saveInterventions(interventions: NexoIntervention[], options: ISaveOptions) {
    if (isEmpty(interventions)) {
      return [];
    }
    const saveBulkResult: Result<ISaveBulkResult<IEnrichedIntervention>> = await interventionRepository.saveBulk(
      interventions,
      options
    );
    if (saveBulkResult.isFailure) {
      logger.error(saveBulkResult.errorValue(), `Error while saving interventions`);
      return [];
    }
    return saveBulkResult.getValue().savedObjects;
  }

  // specs https://jira.montreal.ca/browse/APOC-6233
  // https://confluence.montreal.ca/pages/viewpage.action?pageId=129598401
  private async deleteInterventions(interventions: NexoIntervention[]): Promise<void> {
    if (isEmpty(interventions)) {
      return;
    }
    const deleteFindOptionsResult = InterventionFindOptions.create({
      criterias: {
        id: interventions.map(i => i.id),
        status: enumValues<InterventionStatus>(InterventionStatus)
      }
    });
    if (deleteFindOptionsResult.isFailure) {
      logger.error(deleteFindOptionsResult.errorValue(), `There was an creating delete find options`);
      return;
    }

    const deleteResult = await interventionRepository.delete(deleteFindOptionsResult.getValue());
    if (deleteFindOptionsResult.isFailure) {
      logger.error(deleteResult.errorValue(), `There was an error deleting nexo interventions`);
      return;
    }
    logger.info(`Deleted ${deleteResult.getValue()} nexo interventions`);
  }

  private async handleProjectsFromNexoInterventions(nexoImportLog: NexoImportLog, interventions: NexoIntervention[]) {
    const interventionsNotWished = interventions.filter(i => i.status !== InterventionStatus.wished);

    const sortByProjectsExistOrNot = await nexoImportService.sortByProjectExisting(interventionsNotWished);
    const projectNotExistingByExecutor = nexoImportService.sortByExecutor(sortByProjectsExistOrNot.projectDoNotExist);
    const projectExistingByExecutor = nexoImportService.sortByExecutor(
      sortByProjectsExistOrNot.projectExist.interventions
    );
    const existingProjectsNonPniInterventions = sortByProjectsExistOrNot.projectExist.projects.filter(project =>
      projectExistingByExecutor.others
        .map(
          i =>
            i.externalReferenceIds.find(extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber)
              .value
        )
        .includes(
          project.externalReferenceIds?.find(
            projectExtId => projectExtId.type === InterventionExternalReferenceType.nexoReferenceNumber
          )?.value
        )
    );
    const existingProjectsDiExecutorInterventions = projectExistingByExecutor.diAndPniExecutor.filter(
      intervention =>
        isNil(intervention.programId) || (!isNil(intervention.programId) && !intervention.decisionRequired)
    );
    const existingProjectsDiInterventions = sortByProjectsExistOrNot.projectExist.projects.filter(project =>
      project.interventionIds.find(interventionId =>
        existingProjectsDiExecutorInterventions.map(i => i.id).includes(interventionId)
      )
    );
    const existingProjectsPniInterventionsToRemove = projectExistingByExecutor.diAndPniExecutor.filter(
      intervention => !isNil(intervention.programId) && intervention.decisionRequired
    );

    const [projectsToCreate, projectsToUpdate, diProjectsToUpdate, projectsToDelete] = await Promise.all([
      await this.getProjectsToInsert(projectNotExistingByExecutor.others),
      await this.getProjectsToUpdate(existingProjectsNonPniInterventions, projectExistingByExecutor.others),
      await this.getAgirProjectsToUpdate(existingProjectsDiInterventions, existingProjectsDiExecutorInterventions),
      await this.getProjectsToDelete(existingProjectsPniInterventionsToRemove)
    ]);

    projectsToUpdate.filter(p => p.getValue().interventionIds.length === 0).forEach(p => projectsToDelete.push(p));

    await Promise.all(
      [
        {
          action: ModificationType.CREATION,
          projects: projectsToCreate
        },
        {
          action: ModificationType.MODIFICATION,
          projects: [...projectsToUpdate, ...diProjectsToUpdate].filter(p => p.getValue().interventionIds.length !== 0)
        },
        {
          action: ModificationType.DELETION,
          projects: projectsToDelete
        }
      ].map(projectAction => this.saveProjects(nexoImportLog, projectAction.projects, projectAction.action))
    );
  }

  private async getProjectsToInsert(
    interventions: NexoIntervention[]
  ): Promise<Result<NexoProject | IEnrichedProject>[]> {
    if (isEmpty(interventions)) {
      return [];
    }
    // filter interventions with deletion
    const groupByProjectNotExistNexoReference = nexoImportService.groupByNexoReferenceNumber(
      interventions.filter(intervention => intervention.modificationType !== ModificationType.DELETION)
    );
    const nexoIds = Object.keys(groupByProjectNotExistNexoReference);
    const newProjectsIds = await nexoImportService.getNextProjectsIds(nexoIds.length);

    const newProjectsToSaveResults = await Promise.all(
      nexoIds.map((nexoId, index) =>
        nexoImportService.createProjectFromNexoInterventions(
          nexoId,
          newProjectsIds[index],
          groupByProjectNotExistNexoReference[nexoId]
        )
      )
    );
    if (Result.combine(newProjectsToSaveResults).isFailure) {
      logger.error(
        Result.combine(newProjectsToSaveResults).errorValue(),
        `Error while creating projects from interventions on nexo imports`
      );
      // TODO if there is an error in project generation
      // should set all interventions with projects that could not be created as import errors
    }

    return newProjectsToSaveResults;
  }

  private async getAgirProjectsToUpdate(
    projects: IEnrichedProject[],
    interventions: NexoIntervention[]
  ): Promise<Result<IEnrichedProject>[]> {
    return Promise.all(
      projects.map(async project => {
        const interventionsToAddOrUpdate = interventions.filter(intervention =>
          project.interventionIds.includes(intervention.id)
        );
        return Result.ok(
          await nexoImportService.updateProjectWithNexoInterventions(project, interventionsToAddOrUpdate)
        );
      })
    );
  }

  private async getProjectsToUpdate(
    projects: IEnrichedProject[],
    interventions: NexoIntervention[]
  ): Promise<Result<IEnrichedProject>[]> {
    const projectsToUpdateResults: Result<IEnrichedProject>[] = [];
    const interventionsByNexoReferenceNumber = nexoImportService.groupByNexoReferenceNumber(interventions);

    for (const project of projects) {
      const nexoReferenceNumber = project.externalReferenceIds.find(
        extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
      );
      const interventionsToAddOrUpdate = interventionsByNexoReferenceNumber[nexoReferenceNumber.value];
      const updatedProject = await nexoImportService.updateProjectWithNexoInterventions(
        project,
        interventionsToAddOrUpdate
      );
      projectsToUpdateResults.push(Result.ok(updatedProject));
    }

    return projectsToUpdateResults;
  }

  private async getProjectsToDelete(interventions: NexoIntervention[]): Promise<Result<IEnrichedProject>[]> {
    const interventionsGroupedByExternalReferenceId: IKeyAndValue<NexoIntervention[]> = nexoImportService.groupByNexoReferenceNumber(
      interventions
    );

    // find existing projects
    const projectFindOptions = ProjectFindOptions.create({
      criterias: {
        nexoReferenceNumber: uniq(Object.keys(interventionsGroupedByExternalReferenceId)),
        // any status
        status: enumValues(ProjectStatus)
      }
    }).getValue();
    let projectsToDelete = await projectRepository.findAll(projectFindOptions);

    // In case of a PNI intervention that has a projet manually created and no external reference link
    const projectsPNIIds: string[] = interventions
      .map(i => i.project?.id)
      .filter(id => id)
      // Do not try to delete projects already ready for deletion
      .filter(id => !projectsToDelete.map(p => p.id).includes(id));
    if (!isEmpty(projectsPNIIds)) {
      const projectPNIFindOptions = ProjectFindOptions.create({
        criterias: {
          id: projectsPNIIds,
          // any status
          status: enumValues(ProjectStatus)
        }
      }).getValue();
      projectsToDelete = [...projectsToDelete, ...(await projectRepository.findAll(projectPNIFindOptions))];
    }

    // Due to importing operation order, cannot count on project onDelete to update intervention
    const projectsToDeleteIds = projectsToDelete.map(p => p.id);
    for (const intervention of interventions) {
      if (projectsToDeleteIds.includes(intervention.project?.id)) {
        intervention.setProject(null);
      }
    }
    return projectsToDelete.map(p => Result.ok(p));
  }

  private async saveProjects(
    nexoImportLog: NexoImportLog,
    projectsResults: Result<IEnrichedProject>[],
    modificationType: ModificationType
  ): Promise<void> {
    if (isEmpty(projectsResults)) {
      return;
    }
    if ([ModificationType.CREATION, ModificationType.MODIFICATION].includes(modificationType)) {
      const saveBulkResult = await projectRepository.saveBulk(
        projectsResults.filter(result => result.isSuccess).map(r => r.getValue()),
        {
          upsert: ModificationType.CREATION === modificationType ? false : true
        }
      );
      if (saveBulkResult.isFailure) {
        logger.error(saveBulkResult.errorValue(), `Error on projects ${modificationType} on nexo imports`);
        // TODO if there is an error in project creation
        // should set all interventions with projects that could not be created as import errors
        // sortByProjectsExistOrNot.projectDoNotExist = sortByProjectsExistOrNot.projectDoNotExist.map(intervention => {
        //   intervention.error
        // })
      }
    } else if (modificationType === ModificationType.DELETION) {
      const projectsToDeleteIds = projectsResults.filter(result => result.isSuccess).map(r => r.getValue().id);

      const projectFindOptions = ProjectFindOptions.create({
        criterias: {
          id: projectsToDeleteIds,
          // any status
          status: enumValues(ProjectStatus)
        }
      }).getValue();
      await projectRepository.delete(projectFindOptions);
    }
    nexoImportService.addProjectsToNexoImportLog(nexoImportLog, projectsResults, modificationType);
  }
  // NOSONAR
  private async handleInterventionsBudgetSERows(
    nexoImportLog: NexoImportLog,
    interventionsSEBudgetRows: InterventionBudgetSERow[]
  ) {
    // Group rows by noDossierSE
    const groupedRows = appUtils.groupArrayToObject('noDossierSE', interventionsSEBudgetRows);
    const nexoFile: NexoImportFile = nexoImportLog.files.find(
      file => file.type === NexoFileType.INTERVENTIONS_BUDGET_SE
    );

    const noDossiersSE = Object.keys(groupedRows);
    for (const noDossierSE of noDossiersSE) {
      const errors: NexoFileError[] = [];
      nexoFile.interventions
        .filter(item => item.id === noDossierSE && item.importStatus === NexoImportStatus.FAILURE)
        .forEach(item => errors.push(...item.errors));

      if (!isEmpty(errors)) {
        groupedRows[noDossierSE]
          .filter(row => row.status !== NexoImportStatus.FAILURE)
          .forEach(row => {
            row.addErrors(errors);
          });
      }
    }

    // group all rows by noDossierSE
    const filteredSuccessRows = interventionsSEBudgetRows.filter(row => row.status !== NexoImportStatus.FAILURE);
    // Group interventions rows by noDossierSE
    const groupedInterventionsBudgetSERows = appUtils.groupArrayToObject('noDossierSE', filteredSuccessRows);
    const noDossiersSEChunks = chunk(Object.keys(groupedInterventionsBudgetSERows), configs.nexoImport.dbChunkSize);
    // process by chunks
    for (const noDossierSEChunk of noDossiersSEChunks) {
      const interventionsFindOptionsResult = InterventionFindOptions.create({
        criterias: {
          nexoReferenceNumber: noDossierSEChunk,
          status: enumValues(InterventionStatus)
        }
      });
      const interventions = await interventionRepository.findAll(interventionsFindOptionsResult.getValue());
      // each noDossierSE in budgetRows must have a matching intervention in AGIR
      // group intervention by noDOssierSE
      const groupedInterventionsByNoDossier: IKeyAndValue<IEnrichedIntervention[]> = {};
      interventions.forEach(intervention => {
        const noDossierKey = intervention.externalReferenceIds.find(
          extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
        );
        if (noDossierKey) {
          if (Object.keys(groupedInterventionsByNoDossier).includes(noDossierKey.value)) {
            groupedInterventionsByNoDossier[noDossierKey.value].push(intervention);
          } else {
            groupedInterventionsByNoDossier[noDossierKey.value] = [intervention];
          }
        }
      });

      // The goal is to create an object with noDossier as key, interventionsBudgetSE and matching agir intervention As Attributes
      let groupedInterventionsAndRows: IGroupedInterventionsAndBudgetRows = {};
      noDossierSEChunk.forEach(noDossierSE => {
        groupedInterventionsAndRows[noDossierSE] = {
          rows: groupedInterventionsBudgetSERows[noDossierSE],
          interventions: groupedInterventionsByNoDossier[noDossierSE]
        };
      });

      // Run business validations
      await NexoImportFileValidator.validateInterventionsBudgetSEBusinessRules(groupedInterventionsAndRows);
      // do the job by updating interventions with budgets
      groupedInterventionsAndRows = this.updateInterventionsWithBudget(groupedInterventionsAndRows);
      // save interventions
      const interventionsToUpdate = appUtils
        .concatArrayOfArrays(
          Object.keys(groupedInterventionsAndRows).map(noDossierKey => {
            if (groupedInterventionsAndRows[noDossierKey].rows.find(row => row.status === NexoImportStatus.FAILURE)) {
              return [undefined];
            }
            return groupedInterventionsAndRows[noDossierKey].interventions;
          })
        )
        .filter(r => !isNil(r));
      if (!isEmpty(interventionsToUpdate)) {
        await interventionRepository.saveBulk(interventionsToUpdate);
        // update projects with budget from updated interventions
        await this.updateProjectsWithBudget(interventionsToUpdate);
      }
    }

    // Save in nexoImportLog
    const interventionsBudgetSERowsPromises = chunk(
      interventionsSEBudgetRows,
      configs.nexoImport.dbChunkSize
    ).map(chunkInterventionsBudgetSERows =>
      this.addInterventionRowsToNexoImportLog(
        nexoImportLog,
        NexoFileType.INTERVENTIONS_BUDGET_SE,
        chunkInterventionsBudgetSERows
      )
    );
    // Those are arrays of arrays of Promises that must be "resolved" in another Promise.all to dispatch it
    await Promise.all([Promise.all(interventionsBudgetSERowsPromises)]);
  }
  // NOSONAR
  private async handleRehabAqConceptionRows(
    nexoImportLog: NexoImportLog,
    rehabAqConceptionRows: RehabAqConceptionRow[]
  ) {
    // Validate correspondence between assetType and taxonomy group NEXO asset types
    await NexoImportFileValidator.validateAndMapAssetTypeTaxonomies(rehabAqConceptionRows);

    await this.addInterventionRowsToNexoImportLog(
      nexoImportLog,
      NexoFileType.REHAB_AQ_CONCEPTION,
      rehabAqConceptionRows.filter(row => row.status === NexoImportStatus.FAILURE)
    );

    // Process still valid rows by chunks
    const successRowsChunks = chunk(
      rehabAqConceptionRows.filter(row => row.status !== NexoImportStatus.FAILURE),
      configs.nexoImport.dbChunkSize
    );

    for (const rowsChunk of successRowsChunks) {
      const interventionsToUpdate: IEnrichedIntervention[] = [];
      for (const row of rowsChunk) {
        const interventionsFindOptionsResult = InterventionFindOptions.create({
          criterias: {
            nexoReferenceNumber: [row.noProjet],
            status: enumValues(InterventionStatus)
          }
        });
        const interventions = await interventionRepository.findAll(interventionsFindOptionsResult.getValue());

        // Run business validations
        NexoImportFileValidator.validateRehabAqConceptionBusinessRules(row, interventions);

        // Set design data in intervention and add it to pending updates if there's no failure for the corresponding row
        if (row.status !== NexoImportStatus.FAILURE) {
          interventionsToUpdate.push(
            await this.updateInterventionWithDesignData(
              row,
              interventions.find(x => x),
              nexoImportLog
            )
          );
        }
      }

      // Save interventions
      if (!isEmpty(interventionsToUpdate)) {
        /* reverse() is called so saveBulk() uses the last (should be most recent) entry when multiple entries have the same id */
        await interventionRepository.saveBulk(interventionsToUpdate.reverse());
      }

      await this.addInterventionRowsToNexoImportLog(nexoImportLog, NexoFileType.REHAB_AQ_CONCEPTION, rowsChunk);
      await this.save(nexoImportLog, NexoImportStatus.IN_PROGRESS);
    }
  }

  // NOSONAR
  private async handleRehabEgConceptionRows(
    nexoImportLog: NexoImportLog,
    rehabEgConceptionRows: RehabEgConceptionRow[]
  ) {
    // Group rows by noProjet
    const groupedRows = appUtils.groupArrayToObject('noProjet', rehabEgConceptionRows);
    const nexoFile: NexoImportFile = nexoImportLog.files.find(file => file.type === NexoFileType.REHAB_EG_CONCEPTION);

    // Spread errors to all rows in the same group
    for (const noProjet of Object.keys(groupedRows)) {
      const errors: NexoFileError[] = [];
      nexoFile.interventions
        .filter(item => item.id === noProjet && item.importStatus === NexoImportStatus.FAILURE)
        .forEach(item => errors.push(...item.errors));

      if (!isEmpty(errors)) {
        groupedRows[noProjet]
          .filter(row => row.status !== NexoImportStatus.FAILURE)
          .forEach(row => {
            row.addErrors(errors);
          });
      }
    }

    await this.addInterventionRowsToNexoImportLog(
      nexoImportLog,
      NexoFileType.REHAB_EG_CONCEPTION,
      rehabEgConceptionRows.filter(row => row.status === NexoImportStatus.FAILURE)
    );

    let groupedSuccessRows = this.getGroupedSuccessRowsByNoProjet(rehabEgConceptionRows);

    // Validate correspondence between assetType and taxonomy group NEXO asset types
    for (const noProjet of Object.keys(groupedSuccessRows)) {
      await NexoImportFileValidator.validateAndMapAssetTypeTaxonomies(groupedSuccessRows[noProjet], true);
    }

    // Validate coherence between rows of the same group
    NexoImportRehabEgConceptionFileValidator.validateSameContractRange(groupedSuccessRows);
    NexoImportRehabEgConceptionFileValidator.validateSameUpdateDate(groupedSuccessRows);

    for (const noProjet of Object.keys(groupedSuccessRows)) {
      await this.addInterventionRowsToNexoImportLog(
        nexoImportLog,
        NexoFileType.REHAB_EG_CONCEPTION,
        groupedSuccessRows[noProjet].filter(row => row.status === NexoImportStatus.FAILURE)
      );
    }
    groupedSuccessRows = this.getGroupedSuccessRowsByNoProjet(rehabEgConceptionRows);

    // process by chunks
    const noProjetsChunks = chunk(Object.keys(groupedSuccessRows), configs.nexoImport.dbChunkSize);
    for (const noProjetsChunk of noProjetsChunks) {
      // Get interventions for all noProjets of chunk
      const interventionsFindOptionsResult = InterventionFindOptions.create({
        criterias: {
          nexoReferenceNumber: noProjetsChunk,
          status: enumValues(InterventionStatus)
        }
      });
      const interventions = await interventionRepository.findAll(interventionsFindOptionsResult.getValue());

      // Group interventions by noProjet
      const groupedInterventionsByNoProjet: IKeyAndValue<IEnrichedIntervention[]> = {};
      interventions.forEach(intervention => {
        const noProjet = intervention.externalReferenceIds.find(
          extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
        );
        if (noProjet) {
          if (Object.keys(groupedInterventionsByNoProjet).includes(noProjet.value)) {
            groupedInterventionsByNoProjet[noProjet.value].push(intervention);
          } else {
            groupedInterventionsByNoProjet[noProjet.value] = [intervention];
          }
        }
      });

      // Group interventions and rows under their noProject
      const groupedInterventionsAndRows: IGroupedInterventionsAndRehabEgConceptionRows = {};
      noProjetsChunk.forEach(noProjet => {
        groupedInterventionsAndRows[noProjet] = {
          rows: groupedSuccessRows[noProjet],
          interventions: groupedInterventionsByNoProjet[noProjet]
        };
      });

      // Run business validations
      NexoImportRehabEgConceptionFileValidator.validateBusinessRules(groupedInterventionsAndRows);

      // Save failure rows to DB
      let foundFailureRowsToSave = false;
      for (const noProjet of Object.keys(groupedInterventionsAndRows)) {
        const failureRows = groupedInterventionsAndRows[noProjet].rows.filter(
          row => row.status === NexoImportStatus.FAILURE
        );
        if (failureRows.length) {
          await this.addInterventionRowsToNexoImportLog(nexoImportLog, NexoFileType.REHAB_EG_CONCEPTION, failureRows);
          foundFailureRowsToSave = true;
          delete groupedInterventionsAndRows[noProjet];
        }
      }
      if (foundFailureRowsToSave) {
        await this.save(nexoImportLog, NexoImportStatus.IN_PROGRESS);
      }

      // Update assets of remaining interventions from data of still valid rows
      const interventionsToUpdate: IEnrichedIntervention[] = [];
      for (const noProjet of Object.keys(groupedInterventionsAndRows)) {
        const group = groupedInterventionsAndRows[noProjet];
        interventionsToUpdate.push(
          await this.updateInterventionWithAssetDesignData(
            group.rows,
            group.interventions.find(x => x),
            nexoImportLog
          )
        );
        await this.addInterventionRowsToNexoImportLog(nexoImportLog, NexoFileType.REHAB_EG_CONCEPTION, group.rows);
      }

      // Save interventions
      if (!isEmpty(interventionsToUpdate)) {
        /* reverse() is called so saveBulk() uses the last (should be most recent) entry when multiple entries have the same id */
        await interventionRepository.saveBulk(interventionsToUpdate.reverse());
      }

      await this.save(nexoImportLog, NexoImportStatus.IN_PROGRESS);
    }
  }

  private getGroupedSuccessRowsByNoProjet(rows: RehabEgConceptionRow[]): IKeyAndValue<RehabEgConceptionRow[]> {
    const filteredSuccessRows = rows.filter(row => row.status !== NexoImportStatus.FAILURE);
    return appUtils.groupArrayToObject('noProjet', filteredSuccessRows);
  }

  // NOSONAR
  private updateInterventionsWithBudget(
    groupedInterventionsAndRows: IGroupedInterventionsAndBudgetRows
  ): IGroupedInterventionsAndBudgetRows {
    for (const noDossierKey of Object.keys(groupedInterventionsAndRows)) {
      // valid cases only
      if (groupedInterventionsAndRows[noDossierKey].rows.find(row => row.status === NexoImportStatus.FAILURE)) {
        continue;
      }
      const intervention = groupedInterventionsAndRows[noDossierKey].interventions.find(i => i);
      const rows = groupedInterventionsAndRows[noDossierKey].rows;
      const interventionAnnualDistribution = intervention.annualDistribution;
      const interventionYears: number[] = [];
      interventionAnnualDistribution?.annualPeriods?.forEach(period => interventionYears.push(period.year));

      const allYears = sortBy(uniq([...rows.map(row => row.annee), ...interventionYears]));
      const updatedAnnualDistribution: IInterventionAnnualDistribution = {
        annualPeriods: []
      };
      for (const [rank, year] of allYears.entries()) {
        const inputRowByYear = rows.find(row => row.annee === year);
        const interventionAnnualPeriodByYear = interventionAnnualDistribution?.annualPeriods?.find(
          ap => ap.year === year
        );
        let annualAllowance = interventionAnnualPeriodByYear?.annualAllowance
          ? interventionAnnualPeriodByYear.annualAllowance
          : 0;
        if (inputRowByYear) {
          annualAllowance = inputRowByYear.prevTravaux / 1000; // convert to k$
        }
        // Rank is zero for creation but isn't supposed to be the year order ?
        const annualPeriod: IInterventionAnnualPeriod = {
          rank,
          year,
          annualAllowance,
          annualLength: interventionAnnualPeriodByYear?.annualLength ? interventionAnnualPeriodByYear.annualLength : 0,
          accountId: interventionAnnualPeriodByYear?.accountId ? interventionAnnualPeriodByYear.accountId : 0
        };
        updatedAnnualDistribution.annualPeriods.push(annualPeriod);
      }
      // TODO should be done by DTO mapper some day. Why store a computable value ?
      updatedAnnualDistribution.distributionSummary = {
        id: intervention.id,
        totalAllowance: sum(updatedAnnualDistribution.annualPeriods.map(ap => ap.annualAllowance)),
        totalLength: sum(updatedAnnualDistribution.annualPeriods.map(ap => ap.annualLength))
      };

      intervention.annualDistribution = updatedAnnualDistribution;

      interventionBudgetCalculationService.calculate(intervention);
    }
    return groupedInterventionsAndRows;
  }

  private async updateInterventionWithDesignData(
    row: RehabAqConceptionRow,
    intervention: IEnrichedIntervention,
    nexoImportLog: NexoImportLog
  ): Promise<IEnrichedIntervention> {
    const auditDTO = await auditMapperDTO.getFromModel(nexoImportLog.audit);
    intervention.designData = {
      upstreamAssetType: row.typeActifAmont,
      upstreamAssetId: row.idActifAmont,
      downstreamAssetType: row.typeActifAval,
      downstreamAssetId: row.idActifAval,
      comment: row.commentaire,
      contractRange: row.plageContrat,
      audit: auditDTO
    };
    return intervention;
  }

  // tslint:disable-next-line: cyclomatic-complexity
  private async updateInterventionWithAssetDesignData(
    rows: RehabEgConceptionRow[],
    intervention: IEnrichedIntervention,
    nexoImportLog: NexoImportLog
  ): Promise<IEnrichedIntervention> {
    const auditDTO = await auditMapperDTO.getFromModel(nexoImportLog.audit);

    for (const row of rows) {
      const asset = NexoImportRehabEgConceptionFileValidator.findAssetForRow(row, intervention);
      if (asset) {
        asset.assetDesignData = {
          upstreamAssetType: row.typeActifAmont,
          upstreamAssetId: row.idActifAmont,
          upstreamDepth: row.profondeurAmont,
          downstreamAssetType: row.typeActifAval,
          downstreamAssetId: row.idActifAval,
          downstreamDepth: row.profondeurAval,
          numberOfConnections: row.nbrRacc,
          deformation: row.deformation,
          hasInfiltration: row.infiltration,
          infiltrationChaining: row.infiltrationChainage,
          infiltrationAssetId: row.infiltrationIDDepart,
          hasObstruction: row.obstruction,
          obstructionChaining: row.obstructionChainage,
          obstructionAssetId: row.obstructionIDDepart,
          comment: row.commentaire,
          audit: auditDTO
        };
      }
    }
    return intervention;
  }

  private async updateProjectsWithBudget(interventions: IEnrichedIntervention[]) {
    const interventionsWithProject = interventions.filter(intervention => !isNil(intervention.project));
    if (isEmpty(interventionsWithProject)) {
      return;
    }
    const projectsFindOptions = ProjectFindOptions.create({
      criterias: {
        id: interventionsWithProject.map(intervention => intervention.project.id),
        status: enumValues(ProjectStatus)
      },
      expand: ProjectExpand.interventions
    }).getValue();
    const matchingProjects = await projectRepository.findAll(projectsFindOptions);
    const projectsToUpdate: IEnrichedProject[] = [];
    for (const intervention of interventionsWithProject) {
      let project = matchingProjects.find(p => p.id === intervention.project.id);

      project.interventions.splice(
        project.interventions.findIndex(i => i.id === intervention.id),
        1,
        intervention
      );
      project = await nexoImportService.computeProjectAnnualDistribution(project, project.startYear, project.endYear);
      projectsToUpdate.push(project);
    }
    await projectRepository.saveBulk(projectsToUpdate);
  }
}

export const startNexoImportUseCase = new StartNexoImportUseCase();

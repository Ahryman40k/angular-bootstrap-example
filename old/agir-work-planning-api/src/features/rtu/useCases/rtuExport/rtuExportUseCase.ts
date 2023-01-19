import {
  IEnrichedProject,
  ProjectExpand,
  ProjectExternalReferenceType,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { configs } from '../../../../../config/configs';
import { ExternalReferenceId } from '../../../../shared/domain/externalReferenceId/externalReferenceId';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { AlreadyExistsError } from '../../../../shared/domainErrors/alreadyExistsError';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IInfoRtuProject } from '../../../../shared/rtuImport/infoRtuProject';
import { infoRtuService, STATUS_OK } from '../../../../shared/rtuImport/infoRtuService';
import { IRtuContactResponse } from '../../../../shared/rtuImport/IRtuContactResponse';
import { enumValues } from '../../../../utils/enumUtils';
import { fireAndForget } from '../../../../utils/fireAndForget';
import { createLogger } from '../../../../utils/logger';
import { Audit } from '../../../audit/audit';
import { IProjectCriterias, ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { IRtuExportErrorProps, RtuExportError, RtuExportTarget } from '../../models/rtuExportError';
import { RtuExportLog, RtuExportStatus } from '../../models/rtuExportLog';
import { RtuImportError } from '../../models/rtuImportError';
import { RtuProjectExport, RtuProjectExportStatus } from '../../models/rtuProjectExport/rtuProjectExport';
import { RtuProjectExportSummary } from '../../models/rtuProjectExport/rtuProjectExportSummary';
import { rtuExportLogRepository } from '../../mongo/rtuExportLogRepository';
import { EXPORT_IN_PROGRESS, IRtuSession, rtuExportService } from '../../rtuExportService';

const logger = createLogger('rtuExportUseCase');

export class RtuExportUseCase extends UseCase<void, void> {
  public async execute(): Promise<Response<void>> {
    logger.debug('Start RtuExportUseCase()');
    const alreadyRunning = await rtuExportService.validateExportInProgress();
    if (alreadyRunning) {
      return left(new AlreadyExistsError(EXPORT_IN_PROGRESS));
    }
    const exportLogResult = await this.createExportLog();
    if (exportLogResult.isFailure) {
      return left(new UnexpectedError(exportLogResult.errorValue()));
    }
    const exportLog = exportLogResult.getValue();
    // try to get info rtu session
    const openRtuExportSessionResult = await this.openRtuExportSession();
    if (openRtuExportSessionResult.isFailure) {
      await this.saveErrorToRtuExportLog(exportLog, {
        code: ErrorCode.FORBIDDEN,
        target: RtuExportTarget.SESSION
      });
      return left(openRtuExportSessionResult.errorValue() as any);
    }
    const contactResult = await infoRtuService.getContactById(
      openRtuExportSessionResult.getValue(),
      configs.rtuExport.exportValues.contactId
    );
    if (contactResult.isFailure) {
      await this.saveErrorToRtuExportLog(exportLog, {
        code: ErrorCode.UNEXPECTED,
        target: RtuExportTarget.CONTACT
      });
      return left(contactResult.errorValue() as any);
    }

    fireAndForget(async () => {
      await rtuExportService.initTaxonomies();
      exportLog.status = RtuExportStatus.SUCCESSFUL;
      const rtuSession: IRtuSession = {
        sessionId: openRtuExportSessionResult.getValue()
      };
      await this.createOrUpdateInfoRtuProjects(exportLog, rtuSession, contactResult.getValue());
      exportLog.setEndDateTime();
      await this.saveExportLog(exportLog);
    });
    logger.debug('End RtuExportUseCase()');
    return right(Result.ok<void>());
  }

  private async saveErrorToRtuExportLog(exportLog: RtuExportLog, errorProps: IRtuExportErrorProps) {
    const rtuExportErrorResult = RtuExportError.create(errorProps);
    exportLog.status = RtuExportStatus.FAILURE;
    exportLog.setEndDateTime();
    exportLog.errorDetail = rtuExportErrorResult.getValue();
    await this.saveExportLog(exportLog);
  }

  private async createOrUpdateInfoRtuProjects(
    exportLog: RtuExportLog,
    rtuSession: IRtuSession,
    contact: IRtuContactResponse
  ): Promise<void> {
    let projectsNumber = 0;
    // find projects to create or update
    do {
      const projectsResult = await this.getRtuProjects(exportLog, contact, false);
      if (projectsResult.length) {
        await this.processProjectsToInfoRtu(exportLog, projectsResult, rtuSession);
      }

      projectsNumber = projectsResult.length;
    } while (projectsNumber === configs.rtuExport.paging.size);
    // find projects to cancel
    projectsNumber = 0;
    do {
      const projectsResult = await this.getRtuProjects(exportLog, contact, true);
      if (projectsResult.length) {
        await this.processProjectsToInfoRtu(exportLog, projectsResult, rtuSession);
      }

      projectsNumber = projectsResult.length;
    } while (projectsNumber === configs.rtuExport.paging.size);
  }

  private async processProjectsToInfoRtu(
    exportLog: RtuExportLog,
    projectsResult: Result<RtuProjectExport>[],
    rtuSession: IRtuSession
  ): Promise<void> {
    // add failed projects during mapping
    projectsResult.filter(value => value.isFailure).forEach(result => exportLog.addProjectResultInfoRtu(result));
    // send correctly mapped project to info rtu
    const infoRtuProjectsResult = await this.sendProjectsToInfoRtu(
      projectsResult.filter(value => value.isSuccess).map(value => value.getValue()),
      rtuSession
    );
    // add success and failed projects from info rtu sent process
    infoRtuProjectsResult.forEach(result => exportLog.addProjectResultSummary(result));
    // save bulk projects in our system with its status
    await this.updateAgirProjects(exportLog);
  }

  private async createExportLog(): Promise<Result<RtuExportLog>> {
    const rtuImportLog = RtuExportLog.create({
      startDateTime: new Date(),
      status: RtuExportStatus.IN_PROGRESS,
      audit: Audit.fromCreateContext(),
      projects: []
    }).getValue();
    const savedRtuExportLogResult = await rtuExportLogRepository.save(rtuImportLog);
    // End set audit and save in BD
    if (savedRtuExportLogResult.isFailure) {
      logger.error(savedRtuExportLogResult.errorValue(), 'Error in rtuExportLogRepository.save()');
      return Result.fail(savedRtuExportLogResult.errorValue());
    }
    logger.debug('RtuExportLog created correctly');
    return Result.ok<RtuExportLog>(savedRtuExportLogResult.getValue());
  }

  // save bulk all projects
  private async updateAgirProjects(rtuExportLog: RtuExportLog): Promise<void> {
    const listProjects: IEnrichedProject[] = [];
    for (const projectSummary of rtuExportLog.projects) {
      if (projectSummary.status === RtuProjectExportStatus.SUCCESSFUL) {
        const externalReferenceIds = projectSummary.externalReferenceIds;
        // find if there is an existant infortuid
        const externalReferenceFound = externalReferenceIds.find(
          reference => reference.type === ProjectExternalReferenceType.infoRtuId
        );
        // update this value because maybe during process project was deleted we must create a new one
        if (externalReferenceFound) {
          externalReferenceFound.value = projectSummary.infoRtuId;
        } else {
          // add a new infoRtuId
          externalReferenceIds.push(
            ExternalReferenceId.create({
              type: ProjectExternalReferenceType.infoRtuId,
              value: projectSummary.infoRtuId
            }).getValue()
          );
        }
        listProjects.push({
          id: projectSummary.id,
          rtuExport: {
            status: projectSummary.status,
            exportAt: new Date().toISOString()
          },
          externalReferenceIds: externalReferenceIds.map(extId => ExternalReferenceId.toPersistance(extId))
        });
        // using any because there is not compatibility between IEnrichedProject and IProjectProps
        // we need to send a date value to BD for exportAt, IEnrichedProject only accept string
      } else {
        listProjects.push({
          id: projectSummary.id,
          rtuExport: {
            status: projectSummary.status,
            exportAt: new Date().toISOString()
          }
        });
      }
    }
    // save all projects in one batch
    const insertManyResult = await projectRepository.saveBulk(listProjects, {
      ordered: false,
      upsert: true
    });
    if (insertManyResult.isSuccess) {
      logger.debug('updateAgirProjects correctly');
    } else {
      logger.debug({ error: insertManyResult.errorValue() }, 'updateAgirProjects error');
    }
  }

  private async saveExportLog(rtuExportLog: RtuExportLog): Promise<Result<RtuExportLog>> {
    const savedRtuExportLogResult = await rtuExportLogRepository.save(rtuExportLog);
    // End set audit and save in BD
    if (savedRtuExportLogResult.isFailure) {
      logger.error(savedRtuExportLogResult.errorValue(), 'Error in rtuExportLogRepository.save()');
      return Result.fail(savedRtuExportLogResult.errorValue());
    }
    logger.debug('RtuExportLog save correctly');
    return Result.ok<RtuExportLog>(savedRtuExportLogResult.getValue());
  }

  private async getRtuProjects(
    exportLog: RtuExportLog,
    contact: IRtuContactResponse,
    toCancel: boolean
  ): Promise<Result<RtuProjectExport>[]> {
    logger.debug('getRtuProjects()');
    const exportableProjectStatuses = [ProjectStatus.preliminaryOrdered, ProjectStatus.finalOrdered];
    let criterias: IProjectCriterias;
    if (toCancel) {
      criterias = {
        status: enumValues<ProjectStatus>(ProjectStatus).filter(status => !exportableProjectStatuses.includes(status)),
        excludeImportBic: true,
        cancelAtInfoRtu: true
      };
    } else {
      criterias = {
        status: exportableProjectStatuses,
        excludeImportBic: true,
        exportRtu: exportLog
      };
    }
    // get projects
    const projects = await projectRepository.findPaginated(
      ProjectFindOptions.create({
        criterias,
        limit: configs.rtuExport.paging.size,
        offset: 0,
        expand: ProjectExpand.interventions
      }).getValue()
    );
    if (toCancel) {
      return Promise.all(
        projects.items.map(async project => rtuExportService.mapToRtuProjectExport(project, contact, true))
      );
    }
    return Promise.all(projects.items.map(async project => rtuExportService.mapToRtuProjectExport(project, contact)));
  }

  private async sendProjectsToInfoRtu(
    projects: RtuProjectExport[],
    rtuSession: IRtuSession
  ): Promise<Result<RtuProjectExportSummary>[]> {
    let resultProject: Result<IInfoRtuProject>;
    const resultList = [];
    for (const project of projects) {
      resultProject = await this.saveOrUpateProjectToInfoRtu(project.mapToInfoRtuApi(), rtuSession);
      if (resultProject.isFailure) {
        logger.error({ result: resultProject.errorValue() }, 'fail after creating or updating RTU project');
        resultList.push(
          Result.fail<any>(
            RtuProjectExport.summaryFromResultError(
              Result.fail([
                RtuImportError.create({
                  code: ErrorCode.UNEXPECTED,
                  target: RtuExportTarget.INFO_RTU_API
                }).getValue()
              ]),
              project.noReference,
              {
                projectName: project.name,
                streetName: project.rueSur,
                streetFrom: project.rueDe,
                streetTo: project.rueA
              }
            )
          )
        );
      } else {
        logger.debug({ result: resultProject.getValue()?.id }, 'succes after create or update');
        resultList.push(
          Result.ok(
            RtuProjectExport.toProjectExportSummary(project.noReference, {
              projectName: project.name,
              streetName: project.rueSur,
              streetFrom: project.rueDe,
              streetTo: project.rueA,
              externalReferenceIds: project.externalReferenceIds,
              infoRtuId: resultProject.getValue().id
            })
          )
        );
      }
    }
    return resultList;
  }

  private async saveOrUpateProjectToInfoRtu(
    mappedProject: IInfoRtuProject,
    rtuSession: IRtuSession,
    retryCount = 0
  ): Promise<Result<IInfoRtuProject>> {
    let resultProject: Result<IInfoRtuProject>;
    if (mappedProject.id) {
      resultProject = await infoRtuService.updateRtuProject(rtuSession.sessionId, mappedProject);
      if (resultProject.isSuccess) {
        resultProject = Result.ok(mappedProject);
      }
      // Special case - An AGIR project that has already been exported no longer exists in Info-RTU
      if (resultProject.isFailure) {
        resultProject = await infoRtuService.createRtuProject(rtuSession.sessionId, mappedProject);
      }
    }
    // project without id, it's a new project PUT
    else {
      resultProject = await infoRtuService.createRtuProject(rtuSession.sessionId, mappedProject);
    }
    // maybe session is lost, so try configmax times
    if (
      resultProject.isFailure &&
      rtuExportService.isForbiddenError(resultProject.errorValue()) &&
      retryCount < configs.rtuExport.exportValues.sessionRetryMax
    ) {
      rtuSession.sessionId = await infoRtuService.refreshSessionId();
      return this.saveOrUpateProjectToInfoRtu(mappedProject, rtuSession, retryCount + 1);
    }
    return resultProject;
  }

  private async openRtuExportSession(): Promise<Result<string>> {
    logger.debug('start openRtuImportSession()');
    const openSessionResult = await infoRtuService.openInfoRtuSession();
    if (openSessionResult.isFailure) {
      return openSessionResult as Result<any>;
    }
    const openSessionResponse = openSessionResult.getValue();
    // we received a succesfull http response but we need to validate inside body if status is ok
    if (openSessionResponse.status !== STATUS_OK) {
      return Result.fail(
        new UnexpectedError(openSessionResponse, 'Server response was ok but result body status is not ok')
      );
    }
    const idSession = openSessionResponse.result?.sessionId?.toString();
    logger.debug({ idSession }, 'idSession received');
    if (!idSession) {
      return Result.fail(new UnexpectedError(idSession, 'Not valid session id'));
    }
    logger.debug('end openRtuImportSession()');
    return Result.ok<string>(idSession);
  }
}

export const rtuExportUseCase = new RtuExportUseCase();

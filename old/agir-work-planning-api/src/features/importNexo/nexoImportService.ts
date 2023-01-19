import {
  DocumentStatus,
  DocumentType,
  ExternalReferenceType,
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionExternalReferenceType,
  InterventionStatus,
  IPlainProject,
  ITaxonomy,
  ModificationType,
  NexoImportStatus,
  ProjectExpand,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { Feature, Polygon } from 'geojson';
import { cloneDeep, isEqual, isNil, max, min, sum, uniq, uniqBy } from 'lodash';

import { constants } from '../../../config/constants';
import { annualDistributionServiceFactory } from '../../factories/annualDistributionServiceFactory';
import { interventionAnnualDistributionService } from '../../services/annualDistribution/interventionAnnualDistributionService';
import { workAreaService } from '../../services/workAreaService';
import { ExternalReferenceId } from '../../shared/domain/externalReferenceId/externalReferenceId';
import { ErrorCode } from '../../shared/domainErrors/errorCode';
import { Result } from '../../shared/logic/result';
import { EXECUTOR_DI } from '../../shared/taxonomies/constants';
import { enumValues } from '../../utils/enumUtils';
import { createLogger } from '../../utils/logger';
import { appUtils, IKeyAndValue, isEmpty } from '../../utils/utils';
import { Asset, IAssetProps } from '../asset/models/asset';
import { Audit } from '../audit/audit';
import { Comment } from '../comments/models/comment';
import { counterRepository } from '../counters/mongo/counterRepository';
import { Document } from '../documents/models/document';
import { ImportFlag } from '../imports/enums/importFlag';
import { InterventionFindOptions } from '../interventions/models/interventionFindOptions';
import { interventionRepository } from '../interventions/mongo/interventionRepository';
import { Length, LengthUnit } from '../length/models/length';
import { IPlainProjectProps } from '../projects/models/plainProject';
import { Project } from '../projects/models/project';
import { ProjectFindOptions } from '../projects/models/projectFindOptions';
import { projectRepository } from '../projects/mongo/projectRepository';
import { projectService } from '../projects/projectService';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { NexoErrorTarget } from './mappers/nexoErrorsLabels';
import { NexoFileError } from './models/nexoFileError';
import { NexoImportLog } from './models/nexoImportLog';
import { NexoIntervention } from './models/nexoIntervention';
import { NexoLogProject } from './models/nexoLogProject';
import { isNexoProject, NexoProject } from './models/nexoProject';
import { IInterventionSEComment, InterventionSERow } from './models/rows/interventionsSERow';
import {
  NEXO_CODE_PHASE_CANCELED,
  NEXO_CODE_STATUS_CARNET_RECEIVED,
  NexoImportFileValidator
} from './validators/nexoImportFileValidator';

const logger = createLogger('NexoImportService');

interface IExecutorGroups {
  diAndPniExecutor: NexoIntervention[];
  others: NexoIntervention[];
}
interface IProjectExistOrNotGroups {
  projectExist: {
    projects: IEnrichedProject[];
    interventions: NexoIntervention[];
  };
  projectDoNotExist: NexoIntervention[];
}

class NexoImportService {
  public async createProjectFromNexoInterventions(
    nexoId: string,
    projectId: string,
    interventions: NexoIntervention[]
  ): Promise<Result<NexoProject>> {
    const startYear = min(interventions.map(intervention => intervention.interventionYear));
    const endYear = max(interventions.map(intervention => intervention.endYear));

    const projectTypeId = this.getProjectTypeId(interventions);
    // Get first intervention to use its values as references
    const referenceIntervention = interventions.find(i => i);
    const projectName = await this.generateProjectNameFromReferenceIntervention(projectTypeId, referenceIntervention);
    const externalReferenceIds = [
      ExternalReferenceId.create({
        type: InterventionExternalReferenceType.nexoReferenceNumber,
        value: nexoId
      }).getValue()
    ];
    const projectWorkArea = (await workAreaService.getPolygonFromGeometries(
      interventions.map(intervention => intervention.interventionArea.geometry)
    )) as Feature<Polygon>;

    const plainProjectProps: IPlainProjectProps = {
      projectName,
      boroughId: appUtils.getMostOccurenceValue<string>(interventions.map(i => i.boroughId)),
      status: ProjectStatus.planned,
      projectTypeId,
      riskId: undefined,
      servicePriorities: undefined,
      executorId: referenceIntervention.executorId,
      subCategoryIds: undefined,
      inChargeId: referenceIntervention.requestorId,
      startYear,
      endYear,
      interventionIds: interventions.map(i => i.id),
      // TODO should keep externalRferenceIds instances and not interfaces
      // Remove when Project is refactorised
      externalReferenceIds: externalReferenceIds.map(extId => ExternalReferenceId.toPersistance(extId)),
      importFlag: ImportFlag.importNexo,
      geometry: projectWorkArea.geometry
    };
    const medals = await taxonomyService.getGroup(TaxonomyGroup.medalType);
    const enrichedProject = await projectService.createProject(plainProjectProps, interventions, medals, false);

    projectService.setSpatialElementsFromReferenceIntervention(enrichedProject, referenceIntervention);

    let length: Length;
    if (!isNil(enrichedProject.length)) {
      const lengthResult = Length.create(enrichedProject.length);
      if (lengthResult.isFailure) {
        return Result.fail(lengthResult.errorValue());
      }
      length = lengthResult.getValue();
    }
    const lineNumber = interventions.find(i => i).lineNumber;
    let comments: Comment[];
    if (!isEmpty(enrichedProject.comments)) {
      comments = await Promise.all(
        enrichedProject.comments.map(comment => {
          const commentAudit = Audit.generateAuditFromIAudit(comment.audit);
          return Comment.create(
            {
              ...comment,
              audit: commentAudit
            },
            comment.id
          ).getValue();
        })
      );
    }
    let documents: Document[];
    if (!isEmpty(enrichedProject.documents)) {
      documents = await Promise.all(
        enrichedProject.documents.map(document => {
          const documentAudit = Audit.generateAuditFromIAudit(document.audit);
          return Document.create(
            {
              ...document,
              notes: document.notes,
              objectId: (document as any).objectId,
              type: document.type as DocumentType,
              validationStatus: document.validationStatus as DocumentStatus,
              audit: documentAudit
            },
            document.id
          ).getValue();
        })
      );
    }

    const projectResult = NexoProject.create(
      {
        ...enrichedProject,
        projectName,
        rtuExport: undefined,
        audit: await Audit.toDomainModel(enrichedProject.audit),
        moreInformationAudit: await Audit.toDomainModel(enrichedProject.moreInformationAudit),
        interventions,
        length,
        boroughId: enrichedProject.boroughId,
        startYear: enrichedProject.startYear,
        endYear: enrichedProject.endYear,
        executorId: enrichedProject.executorId,
        nexoId,
        lineNumber,
        modificationType: ModificationType.CREATION,
        comments,
        documents
      },
      projectId
    );
    if (projectResult.isFailure) {
      return Result.fail(projectResult.errorValue());
    }

    const project = projectResult.getValue();
    // Set project on interventions
    for (const intervention of interventions) {
      intervention.setProject({
        id: project.id,
        typeId: project.projectTypeId
      });
    }
    return projectResult;
  }

  public async updateProjectWithNexoInterventions(
    project: IEnrichedProject,
    interventions: NexoIntervention[]
  ): Promise<IEnrichedProject> {
    // use nexointervention props to create faked IEnrichedIntervention as Project do not take instances as interventions
    const inputInterventions = interventions.map(i => {
      return {
        ...i.props,
        id: i.id
      };
    });
    const interventionsToAddOrUpdate = inputInterventions.filter(i => i.modificationType !== ModificationType.DELETION);

    const interventionsToUpdateIds = inputInterventions.map(i => i.id);

    const interventionsToRemoveIds = inputInterventions
      .filter(i => i.modificationType === ModificationType.DELETION)
      .map(i => i.id);

    const existingInterventions = !isEmpty(project.interventions)
      ? project.interventions.filter(i => !interventionsToUpdateIds.includes(i.id))
      : [];

    const projectInterventions = [...existingInterventions, ...interventionsToAddOrUpdate].filter(
      i => !interventionsToRemoveIds.includes(i.id)
    );

    let updatedProject = cloneDeep(project);
    updatedProject.interventionIds = uniq(projectInterventions.map(intervention => intervention.id));

    // if there are no projectInterventions, no need to update as the project will be deleted
    if (!isEmpty(projectInterventions)) {
      const referenceIntervention = projectInterventions.find(i => i);

      const projectName = await this.generateProjectNameFromReferenceIntervention(
        updatedProject.projectTypeId,
        referenceIntervention
      );

      updatedProject = await projectService.updateProject(
        updatedProject as IPlainProject,
        project,
        projectInterventions,
        await taxonomyService.getGroup(TaxonomyGroup.medalType),
        false,
        projectName,
        true
      );

      // regenerate geometry/work-area
      updatedProject = await projectService.updateProjectSpatialElements(updatedProject, projectInterventions);
      const annualDistributionService = annualDistributionServiceFactory.getService(updatedProject);
      annualDistributionService.updateAnnualDistribution(updatedProject);
      updatedProject.annualDistribution.annualPeriods.forEach(period => (period.interventionIds = []));
      projectService.distributeInterventionsOnCreate(updatedProject, [
        ...existingInterventions,
        ...interventions.filter(i => i.modificationType !== ModificationType.DELETION)
      ]);
    }
    return updatedProject;
  }

  private async getExistingInterventions(
    interventionsSERows: InterventionSERow[]
  ): Promise<Result<IEnrichedIntervention[]>> {
    const nexoInterventionIds = interventionsSERows.map(row => row.noDossierSE);
    const interventionsFindOptionsResult = InterventionFindOptions.create({
      criterias: {
        nexoReferenceNumber: nexoInterventionIds,
        status: enumValues<InterventionStatus>(InterventionStatus)
      }
    });
    if (interventionsFindOptionsResult.isFailure) {
      logger.error(interventionsFindOptionsResult.errorValue(), `Could not create InterventionFindOptions`);
      return Result.fail(interventionsFindOptionsResult.errorValue());
    }
    const foundInterventions = await interventionRepository.findAll(interventionsFindOptionsResult.getValue());
    return Result.ok(foundInterventions);
  }

  public sortByExecutor(interventions: NexoIntervention[]): IExecutorGroups {
    const executorGroups: IExecutorGroups = {
      diAndPniExecutor: [],
      others: []
    };
    for (const intervention of interventions) {
      if (
        (!isNil(intervention.programId) &&
          (isNil(intervention.project) || intervention.project?.typeId === ProjectType.nonIntegrated)) ||
        (!isNil(intervention.programId) && intervention.modificationType === ModificationType.MODIFICATION) ||
        (intervention.executorId === EXECUTOR_DI && isNil(intervention.programId))
      ) {
        executorGroups.diAndPniExecutor.push(intervention);
      } else {
        executorGroups.others.push(intervention);
      }
    }
    return executorGroups;
  }

  public async sortByProjectExisting(interventions: NexoIntervention[]): Promise<IProjectExistOrNotGroups> {
    const interventionsGroupedByExternalReferenceId: IKeyAndValue<NexoIntervention[]> = this.groupByNexoReferenceNumber(
      interventions
    );
    // find existing projects linked by NexoReference
    const projectByNexoReferenceFindOptions = ProjectFindOptions.create({
      criterias: {
        nexoReferenceNumber: uniq(Object.keys(interventionsGroupedByExternalReferenceId))
      },
      expand: ProjectExpand.interventions
    }).getValue();

    // find existing projects linked by intervention id
    const projectByInterventionIdFindOptions = ProjectFindOptions.create({
      criterias: {
        interventionIds: interventions.filter(i => i.id).map(intervention => intervention.id)
      },
      expand: ProjectExpand.interventions
    }).getValue();

    const existingProjectsByNexoReference = await projectRepository.findAll(projectByNexoReferenceFindOptions);
    const existingProjectsByIntervention = await projectRepository.findAll(projectByInterventionIdFindOptions);

    // Sort other interventions if project already exists or not
    const result: IProjectExistOrNotGroups = {
      projectExist: {
        projects: uniqBy([...existingProjectsByNexoReference, ...existingProjectsByIntervention], 'id'),
        interventions: []
      },
      projectDoNotExist: []
    };
    for (const intervention of interventions) {
      // find project with same externalReferenceId
      let existingProject = existingProjectsByNexoReference.find(
        project =>
          project.externalReferenceIds.find(
            extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
          ).value ===
          intervention.externalReferenceIds.find(
            extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
          ).value
      );
      // if not found by nexo reference, check by interventionIds
      if (!existingProject) {
        existingProject = existingProjectsByIntervention.find(project =>
          project.interventionIds.includes(intervention.id)
        );
      }
      if (existingProject) {
        intervention.setProject({
          id: existingProject.id,
          typeId: existingProject.projectTypeId
        });
        result.projectExist.interventions.push(intervention);
      } else {
        result.projectDoNotExist.push(intervention);
      }
    }
    return result;
  }

  public async interventionsSERowsToInterventions(
    interventionsSERows: InterventionSERow[]
  ): Promise<NexoIntervention[]> {
    const interventions: NexoIntervention[] = [];
    // Filter still valid rows
    const validRows = interventionsSERows.filter(row => row.status !== NexoImportStatus.FAILURE);
    // group by noDossierSE
    const groupedByNoDossier = appUtils.groupArrayToObject('noDossierSE', validRows);
    for (const noDossierKey of Object.keys(groupedByNoDossier)) {
      // For each noDossierSE group, group by codeActif
      const groupedByCodeActif = appUtils.groupArrayToObject('codeActif', groupedByNoDossier[noDossierKey]);
      for (const codeActifKey of Object.keys(groupedByCodeActif)) {
        // For each codeActif group, group by codeTravaux
        const groupedByCodeTravaux = appUtils.groupArrayToObject('codeTravaux', groupedByCodeActif[codeActifKey]);
        for (const codeTravaux of Object.keys(groupedByCodeTravaux)) {
          try {
            const mergedInterventionResult = await this.mergeInterventionsSERows(groupedByCodeTravaux[codeTravaux]);
            if (mergedInterventionResult.isSuccess) {
              interventions.push(mergedInterventionResult.getValue());
            }
          } catch (error) {
            for (const row of groupedByCodeTravaux[codeTravaux]) {
              row.addErrors([
                NexoFileError.create({
                  code: ErrorCode.UNEXPECTED,
                  target: NexoErrorTarget.UNKNOWN,
                  values: {
                    value1: error.message
                  },
                  line: row.lineNumber
                }).getValue()
              ]);
            }
          }
        }
      }
    }
    return interventions;
  }

  // For a same rows group, create one interventions
  private async mergeInterventionsSERows(interventionSERows: InterventionSERow[]): Promise<Result<NexoIntervention>> {
    const nonCancelledRows = interventionSERows.filter(
      interventionSERow => interventionSERow.codePhase !== NEXO_CODE_PHASE_CANCELED
    );
    // Check that elements from same group are equal
    const isInterventionGroupValid = NexoImportFileValidator.isAllInterventionsEquals(
      // validate only on non cancelled interventions
      nonCancelledRows
    );
    if (!isInterventionGroupValid) {
      return Result.fail('Invalid values for group');
    }

    // regroup all comments
    const comments: IInterventionSEComment[] = nonCancelledRows.map(i => {
      return {
        text: i.precision
      };
    });

    // Get the common assetType for this group of interventions
    const nexoCode = interventionSERows.find(i => i).codeActif;
    const assetType = await NexoImportFileValidator.findTaxonomyByNexoType(nexoCode, TaxonomyGroup.assetType);

    const assetsList: Asset[] = [];
    for (const row of interventionSERows) {
      if (row.agirIntervention) {
        row.agirIntervention.assets?.forEach(interventionAsset => {
          if (!assetsList.find(asset => isEqual(asset.geometry, interventionAsset.geometry))) {
            assetsList.push(Asset.create(interventionAsset as IAssetProps).getValue());
          }
        });
      }
    }

    const incomingAssets: Asset[] = appUtils.concatArrayOfArrays(
      appUtils.concatArrayOfArrays(nonCancelledRows.map(row => this.enrichAssetsWithInterventionSE(row, assetType)))
    );

    const removingAssetsId = interventionSERows
      .filter(interventionSERow => interventionSERow.codePhase === NEXO_CODE_PHASE_CANCELED)
      .map(row => row.comparaison);
    const existingAssetsId = assetsList.map(
      asset => asset.externalReferenceIds.find(ext => ext.type === ExternalReferenceType.nexoReferenceNumber).value
    );

    incomingAssets.forEach(incomingAsset => {
      const index = existingAssetsId.findIndex(
        assetId =>
          assetId ===
          incomingAsset.externalReferenceIds.find(ext => ext.type === ExternalReferenceType.nexoReferenceNumber).value
      );
      if (index < 0) {
        assetsList.push(incomingAsset);
      } else {
        incomingAsset.assetDesignData = assetsList[index].assetDesignData;
        assetsList.splice(index, 1, incomingAsset);
      }
    });
    removingAssetsId.forEach(removeId => {
      const exist = assetsList.findIndex(
        asset =>
          removeId ===
          asset.externalReferenceIds.find(ext => ext.type === ExternalReferenceType.nexoReferenceNumber).value
      );
      if (exist > -1) {
        assetsList.splice(exist, 1);
      }
    });

    const referenceInterventionInGroup = this.getReferenceInterventionInGroup(interventionSERows);
    const nexoIntervention = await referenceInterventionInGroup.toIntervention(assetsList, comments);
    return Result.ok(nexoIntervention);
  }

  public async enrichExistingInterventionsRows(
    interventionsSERows: InterventionSERow[]
  ): Promise<Result<InterventionSERow[]>> {
    const existingInterventionsResult = await this.getExistingInterventions(interventionsSERows);
    if (existingInterventionsResult.isFailure) {
      logger.error(existingInterventionsResult.errorValue(), `getInterventionOperation`);
      return Result.fail(existingInterventionsResult.errorValue());
    }

    // group existing interventions by nexo key value
    const existingInterventionsByNexoKey: IKeyAndValue<IEnrichedIntervention[]> = {};
    for (const existingIntervention of existingInterventionsResult.getValue()) {
      const nexoKey = existingIntervention.externalReferenceIds.find(
        extKey => extKey.type === InterventionExternalReferenceType.nexoReferenceNumber
      ).value;
      if (existingInterventionsByNexoKey[nexoKey]) {
        existingInterventionsByNexoKey[nexoKey].push(existingIntervention);
      } else {
        existingInterventionsByNexoKey[nexoKey] = [existingIntervention];
      }
    }

    for (const interventionRow of interventionsSERows) {
      if (existingInterventionsByNexoKey[interventionRow.noDossierSE]) {
        // first check if intervention exists with nexoExternalIds
        let matchingIntervention = existingInterventionsByNexoKey[interventionRow.noDossierSE].find(agirIntervention =>
          agirIntervention.assets.find(
            asset =>
              asset.typeId === interventionRow.agirAssetTypeId &&
              asset.externalReferenceIds?.find(
                extId =>
                  extId.type === InterventionExternalReferenceType.nexoReferenceNumber &&
                  extId.value === interventionRow.comparaison
              )
          )
        );
        // find intervention that also have same assetTypeId and workTypeId
        if (!matchingIntervention) {
          matchingIntervention = existingInterventionsByNexoKey[interventionRow.noDossierSE].find(
            agirIntervention =>
              agirIntervention.workTypeId === interventionRow.agirWorkTypeId &&
              agirIntervention.assets.find(asset => asset.typeId === interventionRow.agirAssetTypeId)
          );
        }

        if (matchingIntervention) {
          interventionRow.setAgirIntervention(matchingIntervention);
          if (interventionRow.codePhase === NEXO_CODE_PHASE_CANCELED) {
            interventionRow.setModificationType(ModificationType.DELETION);
          } else {
            interventionRow.setModificationType(ModificationType.MODIFICATION);
          }
        }
      }
    }
    return Result.ok(interventionsSERows);
  }

  public groupByNexoReferenceNumber(interventions: NexoIntervention[]): IKeyAndValue<NexoIntervention[]> {
    const interventionsGroupedByExternalReferenceId: IKeyAndValue<NexoIntervention[]> = {};
    for (const intervention of interventions) {
      const keyValue = `${
        intervention.externalReferenceIds.find(
          extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
        ).value
      }`;
      if (Object.keys(interventionsGroupedByExternalReferenceId).includes(keyValue)) {
        interventionsGroupedByExternalReferenceId[keyValue].push(intervention);
      } else {
        interventionsGroupedByExternalReferenceId[keyValue] = [intervention];
      }
    }
    return interventionsGroupedByExternalReferenceId;
  }

  public async getNextInterventionsIds(sequence: number): Promise<string[]> {
    return counterRepository.getNextGeneratedIds({
      key: constants.mongo.collectionNames.INTERVENTIONS,
      prefix: 'I',
      sequence
    });
  }

  public async getNextProjectsIds(sequence: number): Promise<string[]> {
    return counterRepository.getNextGeneratedIds({
      key: constants.mongo.collectionNames.PROJECTS,
      prefix: 'P',
      sequence
    });
  }

  public addProjectsToNexoImportLog(
    nexoImportLog: NexoImportLog,
    projectsResults: Result<NexoProject | IEnrichedProject>[],
    modificationType: ModificationType
  ): void {
    const projectsToAddToNexoFile: NexoLogProject[] = projectsResults.map(projectResult => {
      if (projectResult.isSuccess) {
        const project = projectResult.getValue();
        if (isNexoProject(project)) {
          return project.toNexoLogProject();
        }
        let projectLogId = project.externalReferenceIds?.find(
          extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
        )?.value;
        if (!projectLogId) {
          projectLogId = project.id;
        }
        return NexoLogProject.create(
          {
            importStatus: NexoImportStatus.SUCCESS,
            modificationType
          },
          projectLogId
        ).getValue();
      }
      return NexoLogProject.create({
        importStatus: NexoImportStatus.FAILURE,
        modificationType,
        errors: projectResult.errorValue() as any // NexoFileError[]
      }).getValue();
    });

    nexoImportLog.interventionSEFile.addProjects(uniq(projectsToAddToNexoFile));
  }

  // (Re)calculate project annual distribution in case an intervention was added/modified
  public async computeProjectAnnualDistribution(
    project: IEnrichedProject,
    originalStartYear: number,
    originalEndYear: number
  ): Promise<IEnrichedProject> {
    const annualDistributionService = annualDistributionServiceFactory.getService(project);
    if (isEmpty(project.annualDistribution)) {
      annualDistributionService.createAnnualDistribution(project);
    } else {
      annualDistributionService.updateAnnualDistribution(project);
    }

    if (isEmpty(project.interventions)) {
      return project;
    }
    const yearRange = Project.getYearRange(project);
    // fill in annualPeriods with interventions
    for (const year of yearRange) {
      const projectAnnualPeriod = project.annualDistribution.annualPeriods.find(ap => ap.year === year);
      const interventionsAnnualPeriodsForYear = project.interventions
        .map(i => i.annualDistribution?.annualPeriods?.find(ap => ap.year === year))
        .filter(ap => !isNil(ap));

      // projectAnnualPeriod.annualBudget = sum(project.interventions.filter().map(ap => ap.));
      if (projectService.isProjectGeolocated(project)) {
        projectAnnualPeriod.annualAllowance = sum(interventionsAnnualPeriodsForYear.map(ap => ap.annualAllowance));
      }
    }
    // Those function are a mystery as we need interventions to calculate project annual Periods and then project to get interventions annualPeriods...
    await interventionAnnualDistributionService.updateAnnualPeriods(project, originalStartYear, originalEndYear);
    projectService.calculateBudgets(project);
    return project;
  }

  private getProjectTypeId(interventions: NexoIntervention[]) {
    if (
      interventions.length === 1 &&
      interventions[0].codeStatusCarnet === NEXO_CODE_STATUS_CARNET_RECEIVED &&
      !isNil(interventions[0].programId)
    ) {
      return ProjectType.nonIntegrated;
    }
    return ProjectType.integrated;
  }

  // All interventions in project have the same streets delimitation
  // Use first intervention to determine streets of project
  private async generateProjectNameFromReferenceIntervention(
    projectTypeId: string,
    intervention: IEnrichedIntervention
  ): Promise<string> {
    const projectType = await taxonomyService.translate(TaxonomyGroup.projectType, projectTypeId);
    if (projectType && intervention) {
      return `${projectType} / sur ${intervention.streetName}, de ${intervention.streetFrom}, à ${intervention.streetTo}`;
    }
    return `Nexo import - ${new Date().toISOString()}`;
  }

  // define the 'main' intervention from a group of interventionSERow
  private getReferenceInterventionInGroup(interventions: InterventionSERow[]): InterventionSERow {
    let interventionReference: InterventionSERow;
    if (interventions.length > 1) {
      interventionReference = interventions.find(i => i.modificationType !== ModificationType.DELETION);
    }
    // Still no intervention reference
    if (!interventionReference) {
      interventionReference = interventions.find(i => i);
    }
    return interventionReference;
  }

  private enrichAssetsWithInterventionSE(interventionsSERow: InterventionSERow, assetType: ITaxonomy): Asset[] {
    // owner is the first found on taxonomy
    const ownerId = [].concat(assetType?.properties?.owners).find(o => o);
    // We just add elements from intervention row from input file
    const assetsResults = interventionsSERow.assets
      .filter(asset => asset)
      .map(asset => {
        const externalReferenceIds: ExternalReferenceId[] = [];
        const nexoReferenceNumber = ExternalReferenceId.create({
          type: InterventionExternalReferenceType.nexoReferenceNumber,
          value: interventionsSERow.comparaison
        });
        if (nexoReferenceNumber.isFailure) {
          return nexoReferenceNumber as any;
        }
        externalReferenceIds.push(nexoReferenceNumber.getValue());

        if (!isEmpty(interventionsSERow.iDActif)) {
          const nexoAssetIdResult = ExternalReferenceId.create({
            type: InterventionExternalReferenceType.nexoAssetId,
            value: interventionsSERow.iDActif
          });
          if (nexoAssetIdResult.isFailure) {
            return nexoAssetIdResult as any;
          }
          externalReferenceIds.push(nexoAssetIdResult.getValue());
        }

        const lengthResult = Length.create({
          unit: LengthUnit.meter,
          value: interventionsSERow.longueurIntervention
        });
        if (lengthResult.isFailure) {
          return lengthResult;
        }

        return Asset.create({
          ...asset.props,
          ownerId,
          length: lengthResult.getValue(),
          externalReferenceIds
        });
      });
    return assetsResults.filter(result => result.isSuccess).map(result => result.getValue());
  }
}

export const nexoImportService = new NexoImportService();

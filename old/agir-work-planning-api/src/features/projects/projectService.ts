import * as turf from '@turf/turf';
import {
  CommentCategory,
  IAudit,
  IBudget,
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IGeometry,
  IHistory,
  IInterventionDecision,
  ILength,
  InterventionDecisionType,
  InterventionStatus,
  IPlainProject,
  IPlainProjectAnnualDistribution,
  IPoint3D,
  IProjectCategory,
  IProjectDecision,
  IProjectPaginatedSearchRequest,
  ITaxonomy,
  Permission,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectDecisionType,
  ProjectExternalReferenceType,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { Feature, Polygon } from 'geojson';
import {
  cloneDeep,
  flatten,
  get,
  includes,
  isEmpty,
  isEqual,
  isNil,
  max,
  maxBy,
  min,
  orderBy,
  remove,
  sumBy,
  uniq
} from 'lodash';

import { constants, EntityType } from '../../../config/constants';
import { annualDistributionServiceFactory } from '../../factories/annualDistributionServiceFactory';
import { budgetCalculationServiceFactory } from '../../factories/budgetCalculationServiceFactory';
import { geolocatedAnnualDistributionService } from '../../services/annualDistribution/geolocatedAnnualDistributionService';
import { interventionAnnualDistributionService } from '../../services/annualDistribution/interventionAnnualDistributionService';
import { annualPeriodService } from '../../services/annualPeriodService';
import { auditService } from '../../services/auditService';
import { projectMedalService } from '../../services/projectMedalService';
import { projectWorkAreaService } from '../../services/projectWorkAreaService';
import { spatialAnalysisService } from '../../services/spatialAnalysisService';
import { workAreaService } from '../../services/workAreaService';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { joinStrings } from '../../utils/arrayUtils';
import { enumValues } from '../../utils/enumUtils';
import { createInvalidInputError } from '../../utils/errorUtils';
import { createLogger } from '../../utils/logger';
import { parseIntKeys } from '../../utils/numberUtils';
import { StateMachine2 } from '../../utils/stateMachine2';
import { appUtils } from '../../utils/utils';
import { annualPeriodMapperDTO } from '../annualPeriods/mappers/annualPeriodMapperDTO';
import { ProjectAnnualPeriod } from '../annualPeriods/models/projectAnnualPeriod';
import { annualProgramService } from '../annualPrograms/annualProgramService';
import { AnnualProgram } from '../annualPrograms/models/annualProgram';
import { historyService, IMoreInformation } from '../history/historyService';
import { HistoryFindOptions } from '../history/models/historyFindOptions';
import { historyRepository } from '../history/mongo/historyRepository';
import { interventionService } from '../interventions/interventionService';
import { InterventionFindOptions } from '../interventions/models/interventionFindOptions';
import { interventionRepository } from '../interventions/mongo/interventionRepository';
import { LengthUnit } from '../length/models/length';
import { programBookPriorityScenarioService } from '../priorityScenarios/priorityScenarioService';
import { ProgramBook } from '../programBooks/models/programBook';
import { ProgramBookFindOneOptions } from '../programBooks/models/programBookFindOneOptions';
import { ProgramBookFindOptions } from '../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../programBooks/mongo/programBookRepository';
import { programBookService } from '../programBooks/programBookService';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { Project } from './models/project';
import { ProjectFindOptions } from './models/projectFindOptions';
import { projectRepository } from './mongo/projectRepository';
import { projectValidator } from './validators/projectValidator';

const logger = createLogger('projectService');

export interface IProjectService {
  createProject(
    project: IPlainProject,
    projectInterventions: IEnrichedIntervention[],
    medals: ITaxonomy[]
  ): Promise<IEnrichedProject>;
  updateProject(
    input: IPlainProject,
    originalProject: IEnrichedProject,
    inputInterventions: IEnrichedIntervention[],
    medals: ITaxonomy[]
  ): Promise<IEnrichedProject>;
  generateProjectName(projectTypeId: string, interventions: IEnrichedIntervention[]): Promise<string>;
  updateProjectInProgramBookStatus(project: IEnrichedProject, status: ProjectStatus): Promise<void>;
}

export interface IProjectDecisionYearsOptions {
  startYear?: number;
  endYear?: number;
}

export interface IProjectDecisionYearsOptions {
  startYear?: number;
  endYear?: number;
}

export interface IUpdatedProjectInterventions {
  added: IEnrichedIntervention[];
  removed: IEnrichedIntervention[];
}

export interface IProjectProgramBookAnnualProgram {
  project: IEnrichedProject;
  programBook?: ProgramBook;
  annualProgram?: AnnualProgram;
}

export const decisionTypesToProjectStatuses = [
  { decisionType: ProjectDecisionType.replanned, projectStatusTo: ProjectStatus.replanned },
  { decisionType: ProjectDecisionType.postponed, projectStatusTo: ProjectStatus.postponed },
  { decisionType: ProjectDecisionType.canceled, projectStatusTo: ProjectStatus.canceled }
];

class ProjectService implements IProjectService {
  private readonly stateMachine = new StateMachine2<IEnrichedProject>();

  constructor() {
    this.stateMachine.transitions = [
      {
        from: [null, ProjectStatus.programmed, ProjectStatus.preliminaryOrdered, ProjectStatus.finalOrdered],
        to: ProjectStatus.planned,
        transit: async (source: IEnrichedProject, target: ProjectStatus, options: any): Promise<IEnrichedProject> => {
          return this.transitionToPlanned(source, target, options);
        }
      },
      {
        from: [
          ProjectStatus.planned,
          ProjectStatus.replanned,
          ProjectStatus.programmed,
          ProjectStatus.preliminaryOrdered,
          ProjectStatus.finalOrdered,
          ProjectStatus.postponed
        ],
        to: ProjectStatus.replanned,
        transit: async (source: IEnrichedProject, target: ProjectStatus, options: any): Promise<IEnrichedProject> => {
          return this.transitionToPostponedOrReplanned(source, target, options);
        }
      },
      {
        from: [ProjectStatus.preliminaryOrdered, ProjectStatus.finalOrdered, ProjectStatus.programmed],
        to: ProjectStatus.postponed,
        transit: async (source: IEnrichedProject, target: ProjectStatus, options: any): Promise<IEnrichedProject> => {
          return this.transitionToPostponedOrReplanned(source, target, options);
        }
      },
      {
        from: [
          ProjectStatus.planned,
          ProjectStatus.replanned,
          ProjectStatus.programmed,
          ProjectStatus.preliminaryOrdered,
          ProjectStatus.postponed,
          ProjectStatus.finalOrdered
        ],
        to: ProjectStatus.canceled,
        transit: async (source: IEnrichedProject, target: ProjectStatus): Promise<IEnrichedProject> => {
          return this.transitionToCanceled(source, target);
        }
      },
      {
        from: [
          ProjectStatus.planned,
          ProjectStatus.replanned,
          ProjectStatus.postponed,
          ProjectStatus.programmed,
          ProjectStatus.preliminaryOrdered,
          ProjectStatus.finalOrdered
        ],
        to: ProjectStatus.programmed,
        transit: async (source: IEnrichedProject, target: ProjectStatus): Promise<IEnrichedProject> => {
          return this.setStatus(source, target);
        }
      },
      {
        from: [
          ProjectStatus.planned,
          ProjectStatus.replanned,
          ProjectStatus.postponed,
          ProjectStatus.programmed,
          ProjectStatus.finalOrdered
        ],
        to: ProjectStatus.preliminaryOrdered,
        transit: async (source: IEnrichedProject, target: ProjectStatus): Promise<IEnrichedProject> => {
          return this.setStatus(source, target);
        }
      },
      {
        from: [
          ProjectStatus.planned,
          ProjectStatus.replanned,
          ProjectStatus.postponed,
          ProjectStatus.programmed,
          ProjectStatus.preliminaryOrdered
        ],
        to: ProjectStatus.finalOrdered,
        transit: async (source: IEnrichedProject, target: ProjectStatus): Promise<IEnrichedProject> => {
          return this.setStatus(source, target);
        }
      }
    ];
  }

  /**
   * Creates project with validated input.
   * @param input The input data.
   */
  public async createProject(
    input: IPlainProject,
    projectInterventions: IEnrichedIntervention[],
    medals: ITaxonomy[],
    initSpatialproperties = true
  ): Promise<IEnrichedProject> {
    const annualDistributionService = annualDistributionServiceFactory.getService(input);

    const project: IEnrichedProject = {
      annualDistribution: annualDistributionService.createAnnualDistribution(input),
      audit: auditService.buildAudit(),
      boroughId: input.boroughId,
      endYear: input.endYear,
      executorId: input.executorId,
      externalReferenceIds: input.externalReferenceIds, // more information
      geometry: workAreaService.simplifyWorkArea(input.geometry) || null,
      geometryPin: this.getGeometryPin(input.geometry),
      globalBudget: this.getProjectGlobalBudget(input.globalBudget, projectInterventions),
      importFlag: input.importFlag || null,
      inChargeId: input.inChargeId || null,
      interventions: projectInterventions,
      interventionIds: input.interventionIds || null,
      length: input.geometry ? this.getProjectLength(projectInterventions) : undefined,
      medalId: projectMedalService.getMedalCodeFromInterventions(projectInterventions, medals) || null, // more information
      moreInformationAudit: auditService.buildAudit(), // more information
      projectName: input.projectName || null,
      projectTypeId: input.projectTypeId || null,
      riskId: input.riskId, // more information
      servicePriorities: input.servicePriorities,
      startYear: input.startYear,
      status: ProjectStatus.planned,
      subCategoryIds: input.subCategoryIds?.length ? input.subCategoryIds : null
    };

    if (initSpatialproperties) {
      await spatialAnalysisService.initializeSpatialProperties(EntityType.project, project, input.geometry);
    }
    this.distributeInterventionsOnCreate(project, projectInterventions);
    return project;
  }

  public async updateProject(
    input: IPlainProject,
    originalProject: IEnrichedProject,
    projectInterventions: IEnrichedIntervention[],
    medals: ITaxonomy[],
    initSpatialproperties = true,
    projectName?: string,
    isNexoImportModification = false
  ): Promise<IEnrichedProject> {
    const startYear = min(projectInterventions.map(intervention => intervention.planificationYear));
    // How to determine reference intervention ?
    const referenceIntervention = projectInterventions.find(i => i);

    let length: ILength = originalProject.length;
    let globalBudget: IBudget = originalProject.globalBudget;
    if (orderBy(input.interventionIds) !== orderBy(originalProject.interventionIds)) {
      length = this.getProjectLength(projectInterventions);
      globalBudget = this.getProjectGlobalBudget(input.globalBudget, projectInterventions);
    }
    const endYear = max(projectInterventions.map(intervention => intervention.endYear));
    const medalId = projectMedalService.getMedalCodeFromInterventions(projectInterventions, medals);
    const project: IEnrichedProject = {
      // TODO
      // Why not recompute the annual distribution with new/updated interventions
      annualDistribution: cloneDeep(originalProject.annualDistribution),
      audit: auditService.buildAudit(originalProject.audit),
      boroughId: appUtils.getMostOccurenceValue<string>(projectInterventions.map(i => i.boroughId)) || input.boroughId,
      comments: originalProject.comments,
      documents: originalProject.documents,
      endYear: isNexoImportModification && endYear ? endYear : input.endYear,
      executorId: referenceIntervention?.executorId || input.executorId,
      externalReferenceIds: input.externalReferenceIds, // more information
      geometry: input.geometry || null,
      globalBudget,
      id: originalProject.id,
      importFlag: input.importFlag || null,
      inChargeId: input.inChargeId || null,
      interventionIds: uniq(projectInterventions.map(i => i.id)), // input.interventionIds || null, HOW CAN IT UPDATE interventions without it
      length,
      medalId, // more information
      projectName: projectName || input.projectName || null,
      projectTypeId: input.projectTypeId || null,
      riskId: input.riskId, // more information
      servicePriorities: input.servicePriorities,
      startYear,
      status: originalProject.status,
      subCategoryIds: input.subCategoryIds?.length ? input.subCategoryIds : null,
      decisions: originalProject.decisions,
      rtuExport: originalProject.rtuExport
    };

    project.interventions = projectInterventions;

    if (initSpatialproperties) {
      await spatialAnalysisService.initializeSpatialProperties(EntityType.project, project, input.geometry);
    }
    const inputForAudit = Object.assign({}, input, { roadNetworkTypeId: project.roadNetworkTypeId, medalId });
    project.moreInformationAudit = this.buildMoreInformationUpdateAudit(originalProject, inputForAudit); // more information
    if (this.isProjectGeolocated(project)) {
      geolocatedAnnualDistributionService.updateInterventionDistribution(
        project,
        originalProject.interventionIds,
        projectInterventions
      );
    }

    return project;
  }

  public async updateAnnualDistribution(
    input: IPlainProjectAnnualDistribution,
    project: IEnrichedProject
  ): Promise<IEnrichedProject> {
    await projectValidator.validateAnnualDistributionInput(input, project);
    const updatedProject = cloneDeep(project);
    if (isEmpty(project.geometry) && input.annualProjectDistributionSummary?.totalAnnualBudgetNote) {
      updatedProject.annualDistribution.distributionSummary.totalAnnualBudget.note =
        input.annualProjectDistributionSummary.totalAnnualBudgetNote;
    }
    if (input.annualPeriods?.length) {
      for (const period of input.annualPeriods) {
        const annualPeriod = updatedProject.annualDistribution.annualPeriods.find(p => p.year === period.year);

        if (period.additionalCosts?.length) {
          for (const additionalCost of period.additionalCosts) {
            const updatedAdditionalCost = annualPeriod.additionalCosts.find(ac => ac.type === additionalCost.type);
            updatedAdditionalCost.accountId = additionalCost.accountId;
            updatedAdditionalCost.amount = additionalCost.amount;
          }
        }
      }
    }
    if (input.annualProjectDistributionSummary?.additionalCostsNotes) {
      for (const inputAdditionalCost of input.annualProjectDistributionSummary.additionalCostsNotes) {
        const projectAdditionalCost = updatedProject.annualDistribution.distributionSummary.additionalCostTotals.find(
          a => a.type === inputAdditionalCost.type
        );
        projectAdditionalCost.note = inputAdditionalCost.note || null;
      }
    }
    return updatedProject;
  }

  public async updateProjectInterventions(
    originalInterventions: IEnrichedIntervention[],
    interventions: IEnrichedIntervention[],
    updatedProject: IEnrichedProject
  ): Promise<IEnrichedIntervention[]> {
    const interventionIds = interventions.map(x => x.id);
    let updateInterventions: IEnrichedIntervention[] = [];
    const removed = remove(originalInterventions, x => !includes(interventionIds, x.id));
    updateInterventions = await interventionService.updateProjectInterventionsStatus(updatedProject, interventions);
    if (updateInterventions.some(intervention => !intervention.annualDistribution)) {
      interventionAnnualDistributionService.create(
        updateInterventions,
        updatedProject.annualDistribution.annualPeriods
      );
    }
    updateInterventions.push(...this.updateInterventionsToDisconnect(removed));
    return updateInterventions;
  }

  public buildCategories(startYear: number, endYear: number, status: string): IProjectCategory[] {
    const currentYear = appUtils.getCurrentYear();
    const loopStartYear = currentYear > startYear ? startYear : currentYear;
    const loopEndYear = currentYear + constants.services.project.category.yearRange;
    const categories = [];
    for (let i = loopStartYear; i <= loopEndYear; i++) {
      categories.push({
        year: +i,
        categoryId: Project.getCategoryId(i, startYear, endYear, status)
      });
    }
    return categories;
  }

  public getProjectLength(projectInterventions: IEnrichedIntervention[]): ILength {
    if (!projectInterventions) {
      return undefined;
    }
    const totalLength = sumBy(projectInterventions, intervention =>
      sumBy(intervention.assets, asset => asset.length?.value)
    );
    return { unit: LengthUnit.meter, value: totalLength };
  }

  public getProjectGlobalBudget(globalBudget: IBudget, projectInterventions: IEnrichedIntervention[]): IBudget {
    if (isEmpty(projectInterventions)) {
      return globalBudget || { allowance: 0 };
    }
    const totalEstimateAllowance: number = sumBy(projectInterventions, intervention => {
      return intervention.estimate?.allowance ? intervention.estimate.allowance : 0;
    });
    return { allowance: +totalEstimateAllowance.toFixed(3) };
  }

  private async transitionToPlanned(source: IEnrichedProject, target: ProjectStatus, options: any) {
    if (source.geometry !== null && isEmpty(source.interventionIds)) {
      throw createInvalidInputError('Project must contain interventionIds');
    }
    const cloneSource = cloneDeep(source);
    cloneSource.status = target;
    this.updateProjectYears(cloneSource, options);
    this.removeProgramBooks(cloneSource);
    cloneSource.interventions = await interventionService.updateProjectInterventionsStatus(
      cloneSource,
      cloneSource.interventions
    );
    annualDistributionServiceFactory.getService(cloneSource).updateAnnualDistribution(cloneSource);
    return cloneSource;
  }

  private async transitionToPostponedOrReplanned(
    project: IEnrichedProject,
    target: ProjectStatus,
    options: any
  ): Promise<IEnrichedProject> {
    const cloneProject = cloneDeep(project);
    this.validateModifyingYears(cloneProject, options);
    cloneProject.status = target;

    this.updateProjectYears(cloneProject, options);
    this.addInterventionsDecision(cloneProject.interventions, cloneProject.startYear, cloneProject.status);
    this.updateInterventionsPlanificationYear(cloneProject);
    this.removeProgramBooks(cloneProject);
    annualDistributionServiceFactory.getService(cloneProject).updateAnnualDistribution(cloneProject);
    await this.updateInterventionsAnnualPeriodsByDecision(cloneProject, project.startYear, project.endYear);

    return cloneProject;
  }

  private async updateInterventionsAnnualPeriodsByDecision(
    project: IEnrichedProject,
    originalStartYear: number,
    originalEndYear: number
  ): Promise<void> {
    if (!project.interventions) {
      return;
    }
    await interventionAnnualDistributionService.updateAnnualPeriods(project, originalStartYear, originalEndYear);
    project.interventions = await interventionService.updateProjectInterventionsStatus(project, project.interventions);
    geolocatedAnnualDistributionService.updateInterventionDistributionByYears(project);
  }

  private removeProgramBooks(project: IEnrichedProject): void {
    for (const annualPeriod of project.annualDistribution.annualPeriods) {
      annualPeriod.programBookId = null;
    }
  }

  private async transitionToCanceled(project: IEnrichedProject, target: ProjectStatus): Promise<IEnrichedProject> {
    const cloneProject = cloneDeep(project);
    cloneProject.status = target;
    this.removeProgramBooks(cloneProject);
    annualDistributionServiceFactory.getService(cloneProject).updateAnnualDistribution(cloneProject);
    await this.updateInterventionsAnnualPeriodsByDecision(cloneProject, project.startYear, project.endYear);
    return cloneProject;
  }

  public async addDecision(
    project: IEnrichedProject,
    currentDecision: IProjectDecision,
    annualPeriod: ProjectAnnualPeriod
  ): Promise<IEnrichedProject> {
    currentDecision.audit = auditService.buildAudit();
    const statusTo = await this.getStatusToFromDecision(currentDecision.typeId, project, annualPeriod?.programBook?.id);
    this.setDecisionPreviousYears(project, currentDecision);
    let updatedProject = this.addDecisionToProject(project, currentDecision);
    const options = this.getDecisionYearOptions(currentDecision);
    updatedProject = await this.stateMachine.transit(updatedProject, statusTo, options);
    updatedProject.audit = auditService.buildAudit(updatedProject.audit);
    await this.removeAnnualPeriodFromProgramBookWithDecision(annualPeriod, currentDecision, updatedProject);
    return updatedProject;
  }

  private getDecisionYearOptions(currentDecision: IProjectDecision): IProjectDecisionYearsOptions {
    const options: IProjectDecisionYearsOptions = {};
    if (
      currentDecision.typeId === ProjectDecisionType.postponed ||
      currentDecision.typeId === ProjectDecisionType.replanned
    ) {
      options.startYear = currentDecision?.startYear;
      options.endYear = currentDecision?.endYear;
    }
    return options;
  }

  private setDecisionPreviousYears(project: IEnrichedProject, currentDecision: IProjectDecision): void {
    if (currentDecision.startYear && currentDecision.endYear) {
      currentDecision.previousStartYear = project.startYear;
      currentDecision.previousEndYear = project.endYear;
    }
  }

  private addDecisionToProject(project: IEnrichedProject, currentDecision: IProjectDecision): IEnrichedProject {
    const cloneProject = cloneDeep(project);
    const decisions = project.decisions || [];
    decisions.splice(0, 0, currentDecision);
    Object.assign(cloneProject, { decisions });
    return cloneProject;
  }

  private updateInterventionsPlanificationYear(project: IEnrichedProject): void {
    const interventions = project.interventions;

    for (const intervention of interventions) {
      if (intervention.planificationYear < project.startYear) {
        intervention.planificationYear = project.startYear;
      } else if (intervention.planificationYear > project.endYear) {
        intervention.planificationYear = project.endYear;
      }
    }
    project.interventions = interventions;
  }

  private addInterventionsDecision(interventions: IEnrichedIntervention[], targetYear: number, status: string): void {
    if (isEmpty(interventions)) {
      return;
    }
    for (const intervention of interventions) {
      this.addInterventionDecision(intervention, targetYear, status);
    }
  }

  private addInterventionDecision(intervention: IEnrichedIntervention, targetYear: number, status: string): void {
    const decision = this.createInterventionDecision(targetYear, status);
    intervention.decisions = intervention.decisions || [];
    intervention.decisions.push(decision);
  }

  private createInterventionDecision(targetYear: number, status: string): IInterventionDecision {
    let decision: IInterventionDecision;

    if (status === ProjectStatus.postponed) {
      decision = {
        typeId: InterventionDecisionType.postponed,
        text: `Intervention reportée à ${targetYear} après une décision de projet.`
      };
    } else if (status === ProjectStatus.replanned) {
      decision = {
        typeId: InterventionDecisionType.replanned,
        text: `Intervention replanifiée à ${targetYear} après une décision de projet.`
      };
    }

    decision.audit = auditService.buildAudit();
    decision.targetYear = targetYear;

    return decision;
  }

  private validateModifyingYears(project: IEnrichedProject, options: { startYear: number; endYear: number }): void {
    const { startYear, endYear } = options;
    if (project.startYear === startYear && project.endYear === endYear) {
      throw createInvalidInputError('Years must be different from the project years.');
    }
  }

  private updateProjectYears(cloneProject: IEnrichedProject, options: { startYear: number; endYear: number }): void {
    const { startYear, endYear } = options;
    if (startYear) {
      cloneProject.startYear = startYear;
    }
    if (endYear) {
      cloneProject.endYear = endYear;
    }
  }

  public async generateProjectName(projectTypeId: string, interventions: IEnrichedIntervention[]): Promise<string> {
    const projectType = await taxonomyService.translate(TaxonomyGroup.projectType, projectTypeId);

    const allRoadSections = flatten(interventions.map(x => x.roadSections.features));
    const longestRoadSection = maxBy(allRoadSections, x => turf.length(x.geometry));

    return joinStrings([projectType, longestRoadSection.properties.name], ' / ');
  }

  public async updateProjectInProgramBookStatus(project: IEnrichedProject, status: ProjectStatus): Promise<void> {
    if (project.status !== status) {
      await this.stateMachine.transit(project, status, {
        startYear: project.startYear,
        endYear: project.endYear
      });
    }
  }

  private setStatus(source: IEnrichedProject, target: ProjectStatus): IEnrichedProject {
    source.status = target;
    return source;
  }

  /**
   * Tries to regenerate the work area.
   * @param project The project
   */
  public async tryRegenerateWorkArea(project: IEnrichedProject): Promise<void> {
    const interventionFindOptions = InterventionFindOptions.create({
      criterias: {
        id: project.interventionIds
      }
    });
    if (interventionFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptions)));
    }
    const projectInterventions = await interventionRepository.findAll(interventionFindOptions.getValue());
    try {
      const workAreaResult = await this.generateWorkAreaFromInterventions(projectInterventions);
      if (workAreaResult.isSuccess) {
        project.geometry = workAreaResult.getValue().geometry;
      }
    } catch (error) {
      // Ignore error, if it fails we keep the same work area.
      logger.error(error, `keep the same work area`);
    }
  }

  /**
   * Tries to regenerate the work area.
   * @param project The project
   */
  public async generateWorkAreaFromInterventions(
    interventions: IEnrichedIntervention[]
  ): Promise<Result<Feature<Polygon>>> {
    const polygons = interventions.map(intervention => intervention.interventionArea.geometry as turf.Polygon);
    try {
      const workArea = await projectWorkAreaService.generateWorkArea(polygons);
      return Result.ok(workArea);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public async cancelProject(project: IEnrichedProject): Promise<void> {
    const updatedProject = await this.stateMachine.transit(project, ProjectStatus.canceled);
    Object.assign(project, updatedProject);
  }

  public prepareSearchRequest(request: IProjectPaginatedSearchRequest): void {
    if (isEmpty(request)) {
      return;
    }
    if (request.isGeolocated) {
      request.isGeolocated = (request.isGeolocated as any) !== 'false';
    }
    const keys: (keyof IProjectPaginatedSearchRequest)[] = [
      'limit',
      'offset',
      'fromStartYear',
      'startYear',
      'toStartYear',
      'fromEndYear',
      'fromBudget',
      'budget',
      'toBudget',
      'endYear',
      'toEndYear',
      'fromYear'
    ];
    parseIntKeys(request, keys);

    this.splitSearchRequest(request);
  }

  private splitSearchRequest(request: any): void {
    const keys: (keyof IProjectPaginatedSearchRequest)[] = [
      'boroughId',
      'categoryId',
      'executorId',
      'id',
      'inChargeId',
      'interventionProgramId',
      'interventionAssetTypeId',
      'medalId',
      'programBookId',
      'projectTypeId',
      'status',
      'subCategoryId',
      'submissionNumber',
      'workTypeId'
    ];
    keys.forEach(k => {
      if (request[k] && !Array.isArray(request[k])) {
        request[k] = (request[k] as string).split(',');
      }
    });
  }

  public updateGetExpand(project: IEnrichedProject): IEnrichedProject {
    return cloneDeep(project);
  }

  public isStateTransitionPossible(statusFrom: string, statusTo: string): boolean {
    return this.stateMachine.isStateTransitionPossible(statusFrom, statusTo);
  }

  public async getStatusToFromDecision(
    projectDecisionType: string,
    project: IEnrichedProject,
    programBookId: string
  ): Promise<string> {
    if (projectDecisionType === ProjectDecisionType.removeFromProgramBook) {
      let otherProjectProgramBooksIds = this.getProgramBookIds(project);
      if (programBookId) {
        otherProjectProgramBooksIds = otherProjectProgramBooksIds.filter(id => id !== programBookId);
      }
      // if project do not belongs to any other programBook => return last known status
      if (isEmpty(otherProjectProgramBooksIds)) {
        return this.getPreviousProjectStatus(project.id);
      }
      if (project.status === ProjectStatus.preliminaryOrdered) {
        // check other programBooks status
        return this.getProjectProgrammedStatusByProgramBooks(project, otherProjectProgramBooksIds);
      }
      return ProjectStatus.programmed;
    }
    return decisionTypesToProjectStatuses.find(x => x.decisionType === projectDecisionType).projectStatusTo;
  }

  // get the previous status value before it went to given current stauts
  private async getPreviousProjectStatus(projectId: string): Promise<ProjectStatus> {
    // get any previous status except for those
    const invalidStatuses: ProjectStatus[] = [
      ProjectStatus.programmed,
      ProjectStatus.preliminaryOrdered,
      ProjectStatus.finalOrdered
    ];
    const historyFindOptions = HistoryFindOptions.create({
      criterias: {
        objectTypeId: EntityType.project,
        referenceId: projectId,
        statusFrom: enumValues<ProjectStatus>(ProjectStatus).filter(s => !invalidStatuses.includes(s))
      },
      orderBy: '-createdAt',
      limit: 1
    }).getValue();
    const history: IHistory = await historyRepository.findOne(historyFindOptions);
    // return default value (planned) when no status was founded
    return get(history, 'summary.statusFrom') ? get(history, 'summary.statusFrom') : ProjectStatus.planned;
  }

  /**
   *
   * Get the computed project status according to programbooks status to which the project belongs
   * for a project that being programmed
   * @param programBookIds
   */
  public async getProjectProgrammedStatusByProgramBooks(
    project: IEnrichedProject,
    programBookIds: string[]
  ): Promise<ProjectStatus> {
    // check other programBooks status
    const programBooks = await programBookRepository.findAll(
      ProgramBookFindOneOptions.create({
        criterias: {
          id: programBookIds
        }
      }).getValue()
    );
    if (programBooks.find(pb => pb.status === ProgramBookStatus.submittedFinal)) {
      return ProjectStatus.finalOrdered;
    }
    // belongs to another submittedPreliminary programBook
    if (programBooks.find(pb => pb.status === ProgramBookStatus.submittedPreliminary)) {
      return ProjectStatus.preliminaryOrdered;
    }
    return ProjectStatus.programmed;
  }

  private async removeAnnualPeriodFromProgramBookWithDecision(
    annualPeriod: ProjectAnnualPeriod,
    currentDecision: IProjectDecision,
    project: IEnrichedProject
  ): Promise<void> {
    if (currentDecision.typeId !== ProjectDecisionType.removeFromProgramBook) {
      return;
    }
    await programBookService.removeAnnualPeriodFromProgramBook(annualPeriod);
    const updatedAnnualPeriods: IEnrichedProjectAnnualPeriod[] = [];
    for (const ap of project.annualDistribution.annualPeriods) {
      if (ap.year === annualPeriod.year) {
        const enrichedAp = await annualPeriodMapperDTO.getFromModel(annualPeriod);
        Object.assign(ap, enrichedAp);
      }
      updatedAnnualPeriods.push(ap);
    }

    project.annualDistribution.annualPeriods = updatedAnnualPeriods;
  }

  /**
   * Updates interventions that loses link to project
   * adds reference to intervention
   * @param project
   */
  private updateInterventionsToDisconnect(removedInterventions: IEnrichedIntervention[]): IEnrichedIntervention[] {
    const interventions: IEnrichedIntervention[] = [];
    for (const intervention of removedInterventions) {
      intervention.project = null;
      if (!intervention.programId) {
        intervention.status = InterventionStatus.waiting;
      }
      interventions.push(intervention);
    }
    return interventions;
  }

  public getGeometryPin(geometry: IGeometry): IPoint3D {
    if (!geometry) {
      return undefined;
    }
    return spatialAnalysisService.middlePoint(geometry as turf.Polygon);
  }

  public getValidInterventionStatuses(project: IEnrichedProject): InterventionStatus[] {
    if (project.projectTypeId === ProjectType.nonIntegrated) {
      return [InterventionStatus.accepted];
    }
    return [InterventionStatus.waiting, InterventionStatus.integrated, InterventionStatus.accepted];
  }

  public isProjectRequiresIntegratedIntervention(project: IEnrichedProject): boolean {
    return this.isProjectIntegrated(project) || this.isProjectOther(project);
  }

  public isProjectIntegrated(project: IEnrichedProject): boolean {
    return [ProjectType.integrated, ProjectType.integratedgp].includes(project.projectTypeId as ProjectType);
  }

  public isProjectOther(project: IEnrichedProject): boolean {
    return project.projectTypeId === ProjectType.other;
  }

  public isProjectNonIntegrated(project: IEnrichedProject): boolean {
    return (project.projectTypeId as ProjectType) === ProjectType.nonIntegrated;
  }

  public getInterventionStatusByProjectType(project: IEnrichedProject): InterventionStatus {
    return project.projectTypeId === ProjectType.nonIntegrated
      ? InterventionStatus.accepted
      : InterventionStatus.integrated;
  }

  public isProjectNonGeolocated(project: IPlainProject | IEnrichedProject): boolean {
    return project.projectTypeId === ProjectType.other && !project.geometry;
  }

  public isProjectGeolocated(project: IPlainProject | IEnrichedProject): boolean {
    return !this.isProjectNonGeolocated(project);
  }

  public async addAnnualPeriodsToProgramBooks(project: IEnrichedProject): Promise<void> {
    if (project.status !== ProjectStatus.programmed) {
      return;
    }
    for (const [index, annualPeriod] of project.annualDistribution.annualPeriods.entries()) {
      project.annualDistribution.annualPeriods[index] = await this.addAnnualPeriodToProgramBook(
        annualPeriod,
        project,
        annualPeriod.year
      );
    }
  }

  public async addAnnualPeriodToProgramBook(
    annualPeriod: IEnrichedProjectAnnualPeriod,
    project: IEnrichedProject,
    targetYear: number
  ): Promise<IEnrichedProjectAnnualPeriod> {
    if (project.status !== ProjectStatus.programmed || project.startYear > targetYear || project.endYear < targetYear) {
      return annualPeriod;
    }
    const programBookFindOptions = ProgramBookFindOptions.create({
      criterias: {
        targetYear,
        importCompatibleProject: {
          executorId: project.executorId,
          boroughId: project.boroughId,
          projectTypeId: project.projectTypeId
        }
      },
      orderBy: 'createdAt',
      expand: ProgramBookExpand.projects
    });
    if (programBookFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(programBookFindOptions)));
    }
    const programBooks: ProgramBook[] = await programBookRepository.findAll(programBookFindOptions.getValue());
    if (isEmpty(programBooks)) {
      return annualPeriod;
    }

    let programBook = programBooks.find(pb => pb.boroughIds?.includes(project.boroughId));
    if (!programBook) {
      programBook = programBooks[0];
      programBookPriorityScenarioService.outdateProgramBookPriorityScenarios(programBook);
    }

    const annualPeriodInstance = await ProjectAnnualPeriod.fromEnrichedToInstance(annualPeriod);
    annualPeriodInstance.setStatus(ProjectStatus.programmed);
    annualPeriodInstance.setProgramBook(programBook);

    await programBookService.updateProgramBookStatusWithAnnualPeriod(programBook, annualPeriodInstance);
    await annualProgramService.updateStatusWithProgramBook(programBook.annualProgram, programBook);
    // Remove it, should be done by project save pre or post
    const saveUpdatedProgramBookResult = await programBookRepository.save(programBook);
    if (saveUpdatedProgramBookResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveUpdatedProgramBookResult)));
    }
    // Remove it, should be done by project save pre or post

    return annualPeriodMapperDTO.getFromModel(annualPeriodInstance);
  }

  public getProgramBookIds(project: IEnrichedProject): string[] {
    const projectAnnualPeriods = project?.annualDistribution?.annualPeriods
      ? project.annualDistribution?.annualPeriods
      : [];
    return projectAnnualPeriods.filter(x => x.programBookId).map(x => x.programBookId);
  }

  public getProjectAnnualPeriodsFromProgramBookId(
    programBookId: string,
    ...projects: IEnrichedProject[]
  ): IEnrichedProjectAnnualPeriod[] {
    return flatten(projects.map(x => x.annualDistribution.annualPeriods as IEnrichedProjectAnnualPeriod)).filter(
      x => x.programBookId?.toString() === programBookId?.toString()
    );
  }

  public addAnnualBudgetToAnnualPeriod(annualPeriod: IEnrichedProjectAnnualPeriod, annualBudget: number): void {
    annualPeriod.annualBudget = annualBudget;
  }

  public filterAnnualPeriodByYear(annualPeriods: ProjectAnnualPeriod[], year: number): ProjectAnnualPeriod {
    if (!annualPeriods) {
      return null;
    }
    const arrAnnualPeriods = annualPeriodService.getAnnualPeriodsFromYear(annualPeriods, year);
    return arrAnnualPeriods[0] || null;
  }

  public buildMoreInformation(project: IEnrichedProject): IMoreInformation {
    const moreInformation = historyService.buildCommonMoreInformation(project);
    if (project?.externalReferenceIds?.length) {
      const infoRTUReferenceNumber = project.externalReferenceIds
        .filter(reference => reference.type === ProjectExternalReferenceType.infoRTUReferenceNumber)
        .pop();
      if (infoRTUReferenceNumber) {
        moreInformation.infoRTUReferenceNumber = infoRTUReferenceNumber;
      }
    }
    if (project?.comments?.length) {
      const riskComments = project.comments.filter(comment => comment.categoryId === CommentCategory.risk);
      if (riskComments) {
        moreInformation.riskComments = riskComments;
      }
    }
    if (project?.riskId) {
      moreInformation.riskId = project.riskId;
    }
    return moreInformation;
  }

  public buildMoreInformationUpdateAudit(currentProject: IEnrichedProject, newProject: IEnrichedProject): IAudit {
    const currentMoreInformation = this.buildMoreInformation(currentProject);
    const newMoreInformation = this.buildMoreInformation(newProject);
    if (!isEqual(currentMoreInformation, newMoreInformation)) {
      return auditService.buildAudit(currentProject.moreInformationAudit);
    }
    return currentProject.moreInformationAudit;
  }

  public async getProjectAnnualPeriodByYear(
    project: IEnrichedProject,
    annualPeriodYear: number
  ): Promise<ProjectAnnualPeriod> {
    const annualPeriods: ProjectAnnualPeriod[] = await ProjectAnnualPeriod.fromEnrichedToInstanceBulk(
      project.annualDistribution.annualPeriods
    );
    return annualPeriods.find(x => x.year === annualPeriodYear);
  }

  public calculateBudgets(project: IEnrichedProject): void {
    const budgetCalculationService = budgetCalculationServiceFactory.getService(project);
    budgetCalculationService.calculate(project);
  }

  public async getProjectsByProgramBookId(programBookId: string, expand?: string): Promise<IEnrichedProject[]> {
    const projectFindOptionsResult = ProjectFindOptions.create({
      criterias: {
        programBookId
      },
      expand
    });
    if (projectFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(projectFindOptionsResult)));
    }
    return projectRepository.findAll(projectFindOptionsResult.getValue());
  }

  public distributeInterventionsOnCreate(project: IEnrichedProject, interventions: IEnrichedIntervention[]): void {
    if (this.isProjectNonGeolocated(project)) {
      return;
    }
    interventionAnnualDistributionService.create(interventions, project.annualDistribution.annualPeriods);
    geolocatedAnnualDistributionService.distributeInterventions(project, interventions);
  }

  public async getAvailableProjectServiceTaxonomies(
    project: IEnrichedProject,
    interventions?: IEnrichedIntervention[]
  ): Promise<ITaxonomy[]> {
    const projectInterventions = project.interventions?.length > 0 ? project.interventions : interventions;
    const projectRequestors = projectInterventions.map(
      (intervention: IEnrichedIntervention) => intervention.requestorId
    );
    const serviceTaxonomies = await taxonomyService.getGroup(TaxonomyGroup.service);
    return serviceTaxonomies.filter(service =>
      (service.properties.requestors as string[]).some(requestor => projectRequestors.includes(requestor))
    );
  }

  public async updateProjectSpatialElements(
    project: IEnrichedProject,
    interventions: IEnrichedIntervention[]
  ): Promise<IEnrichedProject> {
    project.interventionIds = uniq(interventions.map(intervention => intervention.id));
    // regenerate geometry/work-area
    const interventionsGeometries = interventions
      .filter(intervention => !isNil(intervention.interventionArea?.geometry))
      .map(intervention => intervention.interventionArea.geometry);
    const updatedProjectGeometry = (await workAreaService.getPolygonFromGeometries(
      interventionsGeometries.filter(g => g)
    )) as Feature<Polygon>;
    project.geometry = updatedProjectGeometry ? updatedProjectGeometry.geometry : project.geometry;
    project.geometryPin = projectService.getGeometryPin(project.geometry);

    this.setSpatialElementsFromReferenceIntervention(
      project,
      interventions.find(i => i)
    );
    return project;
  }

  public setSpatialElementsFromReferenceIntervention(
    project: IEnrichedProject,
    intervention: IEnrichedIntervention
  ): void {
    project.streetName = intervention.streetName;
    project.streetFrom = intervention.streetFrom;
    project.streetTo = intervention.streetTo;
  }

  public getPermissionForDecision(typeId: string): Permission {
    switch (typeId) {
      case ProjectDecisionType.canceled:
        return Permission.PROJECT_DECISION_CANCELED_CREATE;
      case ProjectDecisionType.replanned:
        return Permission.PROJECT_DECISION_REPLANNED_CREATE;
      case ProjectDecisionType.postponed:
        return Permission.PROJECT_DECISION_POSTPONED_CREATE;
      case ProjectDecisionType.removeFromProgramBook:
        return Permission.PROJECT_DECISION_REMOVE_FROM_PROGRAM_BOOK_CREATE;
      default:
        return null;
    }
  }
}
export const projectService = new ProjectService();

import * as turf from '@turf/turf';
import {
  ErrorCodes,
  GeometryUtil,
  IApiError,
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  InterventionStatus,
  IPlainIntervention,
  IPlainProject,
  IPlainProjectAnnualDistribution,
  IProjectCountBySearchRequest,
  IProjectDecision,
  IProjectPaginatedSearchRequest,
  IProjectSearchRequest,
  ProjectExpand,
  ProjectExternalReferenceType,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { cloneDeep, get, includes, isEmpty, isNil } from 'lodash';

import { constants } from '../../../../config/constants';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { PROJECT_RESTRICTION_TYPES, RestrictionsValidator } from '../../../shared/restrictions/restrictionsValidator';
import { IRestriction } from '../../../shared/restrictions/userRestriction';
import { hasDuplicates } from '../../../utils/arrayUtils';
import { createInvalidInputError } from '../../../utils/errorUtils';
import { createLogger } from '../../../utils/logger';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { stateMachine } from '../../../utils/stateMachine';
import { createUnprocessableEntityError } from '../../../utils/utils';
import { BaseValidator } from '../../../validators/baseValidator';
import { commonValidator } from '../../../validators/commonValidator';
import { projectDecisionValidator } from '../../../validators/projectDecisionValidator';
import { ProjectAnnualPeriod } from '../../annualPeriods/models/projectAnnualPeriod';
import { ProjectAnnualPeriodValidator } from '../../annualPeriods/validators/projectAnnualPeriodValidator';
import { db } from '../../database/DB';
import { ByInterventionIdCommand } from '../../interventions/useCases/byInterventionIdCommand';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { ProjectModel } from '../mongo/projectModel';
import { projectService } from '../projectService';

interface IProjectTaxonomyProperty {
  param: string;
  taxonomyGroup: TaxonomyGroup;
  optionnal: boolean;
}

const logger = createLogger('ProjectValidator');
const invalidProjectErrorMessage = 'Project is invalid';
export const projectInputErrorMessage = 'The data input is incorrect!!';
/**
 * Validates the input project againts openApi schema
 * @param project
 */
export class ProjectValidator extends BaseValidator<IPlainProject | IEnrichedProject> {
  public static validateCanInteract(
    project: IEnrichedProject,
    invalidStatuses: ProjectStatus[] = [ProjectStatus.canceled]
  ): Result<IGuardResult> {
    if (invalidStatuses.includes(project.status as ProjectStatus) || isEmpty(project.status)) {
      return Result.fail(
        Guard.error('status', ErrorCodes.ProjectStatus, `Cannot interact with a project with status ${project.status}`)
      );
    }
    return Result.ok();
  }

  protected get model(): ProjectModel {
    return db().models.Project;
  }

  protected getOpenApiModelName(project: IPlainProject | IEnrichedProject) {
    if (!project.hasOwnProperty('audit')) {
      return 'PlainProject';
    }
    return 'EnrichedProject';
  }

  public validateId(id: string): void {
    const regex = RegExp('^P(\\d){5}$');
    if (!regex.test(id)) {
      throw createInvalidInputError(`Project id is invalid`);
    }
  }

  public async validateInput(inputErrors: IApiError[], project: IPlainProject): Promise<void> {
    await this.validateOpenApiModel(inputErrors, project);
    await this.validateTaxonomy(inputErrors, project);
    this.validateGeometry(inputErrors, project);
    if (!isEmpty(project.interventionIds)) {
      const guardInterventionIds = ByInterventionIdCommand.guard({
        id: project.interventionIds.join(',')
      });
      if (!guardInterventionIds.succeeded) {
        inputErrors.push(
          ...guardInterventionIds.failures.map(failure => {
            return {
              code: ErrorCodes.InvalidId,
              message: `Intervention id ${failure.target} is invalid`,
              target: failure.target
            };
          })
        );
      }
    }
  }

  public async validateInputForCreation(project: IPlainProject, interventions: IEnrichedIntervention[]): Promise<void> {
    const inputErrors: IApiError[] = [];
    await this.validateInput(inputErrors, project);
    if (!isEmpty(inputErrors)) {
      throw createInvalidInputError(`Project received is invalid`, inputErrors);
    }
    const businessErrorDetails: IApiError[] = [];
    await this.validateCommonBusinessRules<IPlainProject>(businessErrorDetails, project, interventions);
    for (const intervention of interventions) {
      await this.validateInterventionStatus(businessErrorDetails, project, intervention);
    }
    if (businessErrorDetails.length) {
      throw createUnprocessableEntityError(invalidProjectErrorMessage, businessErrorDetails);
    }
  }

  public async validateInputForUpdate(
    project: IPlainProject,
    originalProject: IEnrichedProject,
    interventions: IEnrichedIntervention[]
  ): Promise<void> {
    const inputErrors: IApiError[] = [];
    await this.validateInput(inputErrors, project);
    if (!isEmpty(inputErrors)) {
      throw createInvalidInputError(`Project received is invalid`, inputErrors);
    }
    const businessErrorDetails: IApiError[] = [];
    this.validateCanInteractWithErrors(businessErrorDetails, originalProject);
    project.id = originalProject.id;
    await this.validateCommonBusinessRules<IPlainProject>(businessErrorDetails, project, interventions);
    this.validateYearForUpdate(businessErrorDetails, originalProject, project);
    for (const intervention of interventions) {
      await this.validateInterventionStatus(businessErrorDetails, originalProject, intervention);
    }
    if (businessErrorDetails.length) {
      throw createUnprocessableEntityError(invalidProjectErrorMessage, businessErrorDetails);
    }
  }

  public async validateAnnualDistributionInput(
    annualDistribution: IPlainProjectAnnualDistribution,
    project: IEnrichedProject
  ): Promise<void> {
    const errorDetails: IApiError[] = [];
    await ProjectAnnualPeriodValidator.validatePlainAnnualDistributionOpenApiModel(errorDetails, annualDistribution);
    ProjectAnnualPeriodValidator.validatePlainAnnualDistributionYears(errorDetails, annualDistribution, project);

    if (errorDetails.length) {
      throw createInvalidInputError(projectInputErrorMessage, errorDetails);
    }
  }

  public async validateAnnualDistributionForUpdate(project: IEnrichedProject): Promise<void> {
    const businessErrorDetails: IApiError[] = [];
    this.validateCanInteractWithErrors(businessErrorDetails, project);
    if (businessErrorDetails.length) {
      throw createUnprocessableEntityError(invalidProjectErrorMessage, businessErrorDetails);
    }
    const errorDetails: IApiError[] = [];
    await ProjectAnnualPeriodValidator.validateAnnualPeriods(errorDetails, project);

    if (errorDetails.length) {
      throw createInvalidInputError(projectInputErrorMessage, errorDetails);
    }
  }

  public async validateProjectIntegrityForIntervention(
    intervention: IEnrichedIntervention,
    project: IEnrichedProject
  ): Promise<void> {
    if (isNil(project)) {
      return;
    }
    const businessErrorDetails: IApiError[] = [];
    await this.validateProjectInterventionsCompatibility(project, project.interventions, businessErrorDetails);
    await this.validateInterventionStatus(businessErrorDetails, project, intervention);
    if (businessErrorDetails.length) {
      throw createUnprocessableEntityError(invalidProjectErrorMessage, businessErrorDetails);
    }
  }

  /**
   * validate
   */
  public async validateImport(project: IEnrichedProject, interventions: IEnrichedIntervention[]) {
    const errorDetails: IApiError[] = [];
    // TODO NOT WORKING
    // TODO NOT WORKING
    // TODO NOT WORKING
    // TODO NOT WORKING
    // id is not in the target model , which id
    // await this.validateOpenApiModel(errorDetails, project);
    // TODO NOT WORKING
    // TODO NOT WORKING
    // TODO NOT WORKING
    // TODO NOT WORKING
    await this.validateTaxonomy(errorDetails, project);
    await this.validateCommonBusinessRules<IEnrichedProject>(errorDetails, project, interventions);
    await ProjectAnnualPeriodValidator.validateAnnualPeriods(errorDetails, project);
    if (errorDetails.length) {
      throw createInvalidInputError(projectInputErrorMessage, errorDetails);
    }
  }

  private async validateCommonBusinessRules<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    interventions: IEnrichedIntervention[]
  ): Promise<void> {
    this.validateProjectName(errorDetails, project);
    this.validateProjectBudget(errorDetails, project);
    this.validateStartYearEndYear(errorDetails, project);
    this.validateEmptyList(errorDetails, project);
    this.validatePtiNumberDuplicate<T>(errorDetails, project);
    this.validateInfoRTUReferenceNumberDuplicate<T>(errorDetails, project);
    await this.validateProjectInterventionsCompatibility(project, interventions, errorDetails);
  }

  public async validateProjectInterventionsCompatibility<T extends IPlainProject | IEnrichedProject>(
    project: T,
    interventions: IEnrichedIntervention[],
    errorDetails: IApiError[] = []
  ): Promise<void> {
    this.validateInterventionList<T>(errorDetails, project, interventions);
    this.validateProjectContainsInterventions<T>(errorDetails, project, interventions);
    this.validateInChargeWithinInterventionsRequestors<T>(errorDetails, project, interventions);
    this.validateInterventionsExecutor(errorDetails, project, interventions);
    for (const intervention of interventions) {
      this.validateInterventionDecisionRequired(errorDetails, intervention);
      this.validateProjectTypeCompatibility(errorDetails, project, intervention);
      this.validateIsNotIntegrated<T>(errorDetails, project, intervention);
      this.validateStartYear<T>(errorDetails, project, intervention);
      this.validateEndYear(errorDetails, project, intervention);
    }
    await this.validateProjectServices<T>(errorDetails, project, interventions);
  }

  public validateGeometry<T extends IPlainProject | IEnrichedProject>(inputErrors: IApiError[], project: T): void {
    if (this.hasOtherType(project.projectTypeId) && isEmpty(project.geometry)) {
      return;
    }
    commonValidator.validateGeometry(inputErrors, 'geometry', get(project, 'geometry', null));
  }

  /**
   * Validates whether the start year is less or equal to the oldest intervention
   * @param errorDetails
   * @param project
   * @param intervention
   */
  public validateStartYear<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    intervention: IEnrichedIntervention
  ): void {
    logger.debug('Validate start year ::::::::::::::::::::');
    if (project.startYear > intervention.planificationYear) {
      errorDetails.push({
        code: ErrorCodes.ProjectStartYear,
        message: 'Project start year must be less or equal to the oldest intervention',
        target: 'startYear'
      });
    }
  }
  /**
   * Validates that end year of project is equal or greater than latest intervention
   * @param errorDetails
   * @param project
   * @param intervention
   */
  public validateEndYear<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    intervention: IEnrichedIntervention
  ): void {
    logger.debug('Validate end year ::::::::::::::::::::');
    if (project.endYear < intervention.planificationYear) {
      errorDetails.push({
        code: intervention.id,
        message: 'Project end year must be equal or greater than latest intervention',
        target: 'endYear'
      });
    }
  }

  public validateInterventionsExecutor<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    interventions: IEnrichedIntervention[]
  ): void {
    if (interventions.some(intervention => project.executorId !== intervention.executorId)) {
      errorDetails.push({
        code: ErrorCodes.BusinessRule,
        message: `Interventions executor mismatch the project executor`,
        target: 'interventionIds'
      });
    }
  }

  public async validateInterventionStatus(
    errorDetails: IApiError[],
    project: IEnrichedProject,
    intervention: IEnrichedIntervention
  ) {
    const projectStatus = project.status || null;
    const validInterventionStatuses = projectService.getValidInterventionStatuses(project);
    if (
      validInterventionStatuses.includes(intervention.status as InterventionStatus) &&
      (projectStatus === null || projectStatus === ProjectStatus.planned || projectStatus === ProjectStatus.programmed)
    ) {
      this.validateIntegrationTransition(errorDetails, project, intervention);
      return;
    }
    if (!stateMachine.isTransitionPossible(intervention, this.getInterventionStatusByProjectStatus(project))) {
      errorDetails.push({
        code: intervention.id,
        message: `Invalid intervention status`,
        target: 'status'
      });
    }
  }

  /**
   * Intervention must not be linked to another project
   * @param errorDetails
   * @param project
   * @param intervention
   */
  public validateIsNotIntegrated<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    intervention: IEnrichedIntervention
  ): void {
    const interventionProjectId = get(intervention, 'project.id', undefined);
    let isIntegrated = false;
    // project is being updated so already has an id
    if (project.id && interventionProjectId) {
      if (interventionProjectId !== project.id) {
        isIntegrated = true;
      }

      // project doesnt have an id yet
    } else if (interventionProjectId) {
      isIntegrated = true;
    }
    if (isIntegrated) {
      errorDetails.push({
        code: intervention.id,
        message: 'Intervention is already integrated in another project',
        target: 'interventionIds'
      });
    }
  }

  private validateProjectTypeCompatibility(
    errorDetails: IApiError[],
    project: IEnrichedProject,
    intervention: IEnrichedIntervention
  ): void {
    const isProjectNonIntegrated = projectService.isProjectNonIntegrated(project);
    if (isProjectNonIntegrated && !intervention.programId) {
      errorDetails.push({
        code: ErrorCodes.ProjectIntervention,
        message: 'An non-integrated project cannot contain interventions without programs.',
        target: 'project.projectTypeId'
      });
    }
  }

  /**
   * Makes sure that list of intervention ids is not empty
   * @param errorDetails
   * @param project
   */
  public validateEmptyList<T extends IPlainProject | IEnrichedProject>(errorDetails: IApiError[], project: T): void {
    if (this.hasOtherType(project.projectTypeId) && this.validateOtherTypeEmptyList(errorDetails, project)) {
      return;
    }

    if (isEmpty(project.interventionIds)) {
      errorDetails.push({
        code: ErrorCodes.ProjectIntervention,
        message: 'Project must contain interventions to be created or updated',
        target: 'interventionIds'
      });
    } else if (project.hasOwnProperty('interventions')) {
      const tmpProj = project as IEnrichedProject; // Property only exist in IEnrichedProject
      if (tmpProj.interventions.length === 0) {
        errorDetails.push({
          code: ErrorCodes.ProjectIntervention,
          message: 'Project must contain interventions to be created or updated',
          target: 'interventionIds'
        });
      }
    }
  }

  /**
   * Validates that all ids exists in intervention repository,
   * project might have an id of a non-existing id of intervention
   * intervention list represents only those found in repository
   * @param errorDetails
   * @param project
   * @param interventions found in repo based on ids
   */
  public validateInterventionList<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    interventions: IEnrichedIntervention[]
  ): void {
    if (this.hasOtherType(project.projectTypeId) || isEmpty(project.interventionIds)) {
      return;
    }

    const interventionIds = interventions.map(intervention => intervention.id);
    const notFoundIds = project.interventionIds.filter(id => !includes(interventionIds, id));
    if (notFoundIds.length > 0) {
      for (const id of notFoundIds) {
        errorDetails.push({
          code: id,
          message: 'Intervention was not found based on given id',
          target: 'interventionIds'
        });
      }
    }
  }

  public validateInterventionDecisionRequired(errorDetails: IApiError[], intervention: IEnrichedIntervention): void {
    if (intervention.decisionRequired) {
      errorDetails.push({
        code: intervention.id,
        message: 'Intervention requires a decision',
        target: 'decisionRequired'
      });
    }
  }

  public validateIntegrationTransition(
    errorDetails: IApiError[],
    project: IEnrichedProject,
    intervention: IEnrichedIntervention
  ): void {
    logger.debug('Validate interventions status ::::::::::::::::::::');
    const targetStatus = projectService.getInterventionStatusByProjectType(project);
    if (!stateMachine.isTransitionPossible(intervention, targetStatus) && intervention.status !== targetStatus) {
      errorDetails.push({
        code: intervention.id,
        message: 'Intervention cannot be integrated',
        target: 'status'
      });
    }
  }

  /**
   * Verifies that project feature contains all interventions and that none are out of bounds
   * @param errorDetails
   * @param project
   * @param interventions
   */
  public validateProjectContainsInterventions<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    interventions: IEnrichedIntervention[]
  ): void {
    if (this.hasOtherType(project.projectTypeId) && isEmpty(interventions)) {
      return;
    }
    const projectClone = cloneDeep(project);

    if (isEmpty(projectClone.geometry)) {
      errorDetails.push({
        code: ErrorCodes.ProjectGeometry,
        message: 'Project has no geometry',
        target: 'geometry'
      });
      return;
    }

    // TODO: validate if buffer is a good option before validation, currently is the only option because
    // simplify used to poject could had change the surfacique zone and interventions won't fit in
    // increases buffer geometry temporally
    projectClone.geometry = turf.buffer(
      projectClone.geometry,
      constants.spatialAnalysis.INTERSECTED_FEATURES_BUFFER_DISTANCE,
      {
        units: 'meters'
      }
    ).geometry as IGeometry;
    const notContainedList = GeometryUtil.validateProjectContainsIntervention(
      projectClone as IPlainProject,
      interventions as IPlainIntervention[]
    );
    if (notContainedList.length > 0) {
      for (const notContained of notContainedList) {
        errorDetails.push({
          code: notContained,
          message: 'Project geometry is not containing this intervention area',
          target: 'geometry'
        });
      }
    }
  }

  /**
   * Verifies that project feature contains all interventions and that none are out of bounds
   * @param errorDetails
   * @param project
   * @param interventions
   */
  public validateInChargeWithinInterventionsRequestors<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    interventions: IEnrichedIntervention[]
  ): void {
    if (this.hasOtherType(project.projectTypeId) || this.hasIntegratedgpType(project.projectTypeId)) {
      return;
    }
    if (isEmpty(project.inChargeId)) {
      return;
    }
    const results = interventions.find(i => i.requestorId === project.inChargeId);
    if (isEmpty(results)) {
      errorDetails.push({
        code: '',
        message: 'Project inChargeId property is not contained by interventions',
        target: 'inChargeId'
      });
    }
  }

  /**
   * Verifies that the intervention has reference to taxonomies that exist
   * @param errorDetails
   * @param project
   * @param taxonomies
   */
  public async validateTaxonomy(errorDetails: IApiError[], project: IPlainProject | IEnrichedProject): Promise<void> {
    const projectTaxProperties: IProjectTaxonomyProperty[] = [
      { param: 'projectTypeId', taxonomyGroup: TaxonomyGroup.projectType, optionnal: true },
      { param: 'executorId', taxonomyGroup: TaxonomyGroup.executor, optionnal: false },
      { param: 'boroughId', taxonomyGroup: TaxonomyGroup.borough, optionnal: false },
      { param: 'inChargeId', taxonomyGroup: TaxonomyGroup.requestor, optionnal: true },
      { param: 'subCategoryIds', taxonomyGroup: TaxonomyGroup.projectSubCategory, optionnal: true },
      { param: 'riskId', taxonomyGroup: TaxonomyGroup.riskType, optionnal: true }
    ];
    // Add validation on comments properties
    if (project.hasOwnProperty('comments')) {
      (project as IEnrichedProject).comments.forEach((x, idx) => {
        projectTaxProperties.push({
          param: `comments[${idx}].categoryId`,
          taxonomyGroup: TaxonomyGroup.commentCategory,
          optionnal: true
        });
      });
    }
    // Add external references properties
    if (project.hasOwnProperty('externalReferenceIds')) {
      project.externalReferenceIds.forEach((x, idx) => {
        projectTaxProperties.push({
          param: `externalReferenceIds[${idx}].type`,
          taxonomyGroup: TaxonomyGroup.externalReferenceType,
          optionnal: true
        });
      });
    }
    if (project.hasOwnProperty('servicePriorities')) {
      project.servicePriorities.forEach((x, index) => {
        projectTaxProperties.push({
          param: `servicePriorities[${index}].service`,
          taxonomyGroup: TaxonomyGroup.service,
          optionnal: true
        });
        projectTaxProperties.push({
          param: `servicePriorities[${index}].priorityId`,
          taxonomyGroup: TaxonomyGroup.priorityType,
          optionnal: true
        });
      });
    }

    if (this.isEnrichedProject(project) && project.hasOwnProperty('decisions')) {
      // Add validation on decisions property
      project.decisions.forEach((x, idx) => {
        projectTaxProperties.push({
          param: `decisions[${idx}].typeId`,
          taxonomyGroup: TaxonomyGroup.projectDecisionType,
          optionnal: false
        });
      });
    }

    for (const property of projectTaxProperties) {
      const projectPropertyValue = get(project, property.param);
      if (!property.optionnal || projectPropertyValue) {
        await taxonomyValidator.validate(errorDetails, property.taxonomyGroup, projectPropertyValue);
      }
    }
  }

  /**
   * Validate project decision input
   * @param input
   * @param project
   */
  public async validateInputForDecision(
    input: IProjectDecision,
    project: IEnrichedProject,
    annualPeriod: ProjectAnnualPeriod
  ): Promise<void> {
    const inputErrorDetails: IApiError[] = [];
    const businessErrorDetails: IApiError[] = [];
    await projectDecisionValidator.validateProjectDecisionInput(inputErrorDetails, input);
    if (!isEmpty(inputErrorDetails.length)) {
      throw createInvalidInputError('Project decision has error(s)', inputErrorDetails);
    }
    this.validateCanInteractWithErrors(businessErrorDetails, project);

    await this.validateStateTransition(businessErrorDetails, input, project, annualPeriod);
    projectDecisionValidator.validateProjectDecisionYears(businessErrorDetails, input);
    await projectDecisionValidator.validateCanBeRemovedFromProgramBook(
      businessErrorDetails,
      input,
      annualPeriod,
      project
    );

    if (!isEmpty(businessErrorDetails)) {
      throw createUnprocessableEntityError('Project decision is unprocessable', businessErrorDetails);
    }
  }

  public validateGetExpandsInput(inputErrors: IApiError[], queryExpands: string | string[]): void {
    if (isEmpty(queryExpands)) {
      return;
    }

    let cloneQueryExpands = cloneDeep(queryExpands);
    if (typeof cloneQueryExpands === 'string') {
      cloneQueryExpands = cloneQueryExpands.split(',') || [cloneQueryExpands];
    }

    for (const queryExpand of cloneQueryExpands) {
      if (!(queryExpand in ProjectExpand)) {
        inputErrors.push({
          code: ErrorCodes.InvalidInput,
          message: `The expand param, ${queryExpand}, is not a possible value.`,
          target: 'expand'
        });
      }
    }
  }

  public validateFromToBudget(inputErrors: IApiError[], request: IProjectSearchRequest): void {
    if (request.fromBudget && request.toBudget && request.fromBudget > request.toBudget) {
      inputErrors.push({
        code: ErrorCodes.ProjectBudget,
        message: `The starting budget is higher than the arriving budget.`,
        target: 'budget.allowance'
      });
    }
  }

  public async validateProjectSearchRequest(request: IProjectPaginatedSearchRequest): Promise<void> {
    if (isEmpty(request)) {
      return;
    }
    const errors: IApiError[] = [];

    await openApiInputValidator.validateInputModel(errors, 'ProjectPaginatedSearchRequest', request);
    await this.validateSearchRequestTaxonomies(errors, request);
    this.validateGetExpandsInput(errors, request?.expand);
    this.validateFromToBudget(errors, request);

    if (errors.length) {
      throw createInvalidInputError(projectInputErrorMessage, errors);
    }
  }

  public async validateProjectCountBySearchRequest(request: IProjectCountBySearchRequest): Promise<void> {
    const errors: IApiError[] = [];

    await openApiInputValidator.validateInputModel(errors, 'ProjectCountBySearchRequest', request);
    this.validateKeyOf(errors, request.countBy);
    await this.validateSearchRequestTaxonomies(errors, request);
    this.validateFromToBudget(errors, request);

    if (errors.length) {
      throw createInvalidInputError(projectInputErrorMessage, errors);
    }
  }

  public async validateSearchRequestTaxonomies(
    errors: IApiError[],
    searchRequest: IProjectSearchRequest
  ): Promise<void> {
    if (searchRequest.projectTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectType, searchRequest.projectTypeId);
    }
    if (searchRequest.categoryId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectCategory, searchRequest.categoryId);
    }
    if (searchRequest.subCategoryId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectSubCategory, searchRequest.subCategoryId);
    }
    if (searchRequest.status) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectStatus, searchRequest.status);
    }
    if (searchRequest.workTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.workType, searchRequest.workTypeId);
    }
    if (searchRequest.executorId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.executor, searchRequest.executorId);
    }
    if (searchRequest.interventionProgramId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.programType, searchRequest.interventionProgramId);
    }
  }

  /**
   * Validate that we can interact with the project
   * @param errorDetails
   * @param project
   */
  public validateCanInteractWithErrors(errorDetails: IApiError[], project: IEnrichedProject): void {
    const canInteractResult = ProjectValidator.validateCanInteract(project);
    if (canInteractResult.isFailure) {
      errorDetails.push({
        code: ErrorCodes.ProjectStatus,
        message: `It's impossible to interact with project : ${project.id} `,
        target: 'status'
      });
    }
  }

  public async validateStateTransition(
    businessErrorDetails: IApiError[],
    input: IProjectDecision,
    project: IEnrichedProject,
    annualPeriod: ProjectAnnualPeriod
  ): Promise<void> {
    const statusTo = await projectService.getStatusToFromDecision(input.typeId, project, annualPeriod?.programBook?.id);
    if (!projectService.isStateTransitionPossible(project.status, statusTo)) {
      businessErrorDetails.push({
        code: ErrorCodes.InvalidStatusTransition,
        message: `Cannot transit status from "${project.status}" to "${statusTo}".`,
        target: 'status'
      });
    }
  }

  protected isEnrichedProject(project: IPlainProject | IEnrichedProject): project is IEnrichedProject {
    return project.hasOwnProperty('audit');
  }

  private hasOtherType(projectTypeId: string): boolean {
    return projectTypeId === ProjectType.other;
  }

  private hasIntegratedgpType(projectTypeId: string): boolean {
    return projectTypeId === ProjectType.integratedgp;
  }

  private validateOtherTypeEmptyList<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T
  ): boolean {
    if (isEmpty(project.interventionIds)) {
      return true;
    }

    if (isEmpty(project.geometry) && !isEmpty(project.interventionIds)) {
      errorDetails.push({
        code: ErrorCodes.ProjectIntervention,
        message: 'Project without geometry must not contain intervention to be created or updated',
        target: 'interventionIds'
      });
      return true;
    }
    return false;
  }

  public validateProjectName<T extends IPlainProject | IEnrichedProject>(errorDetails: IApiError[], project: T): void {
    if (!isEmpty(project.geometry) && isEmpty(project.projectName)) {
      errorDetails.push({
        code: ErrorCodes.ProjectName,
        message: 'Project with geometry must contain a project name',
        target: 'interventionIds'
      });
    }
  }

  private validateProjectBudget(errorDetails: IApiError[], project: IPlainProject | IEnrichedProject): void {
    if (projectService.isProjectNonGeolocated(project) && project.globalBudget?.allowance == null) {
      errorDetails.push({
        code: ErrorCodes.ProjectBudget,
        message: 'A budget must be specified when the project is non-geolocated.',
        target: 'globalBudget.allowance'
      });
    }
  }

  private validateStartYearEndYear(errorDetails: IApiError[], project: IPlainProject | IEnrichedProject) {
    if (project.startYear > project.endYear) {
      errorDetails.push({
        code: ErrorCodes.InvalidInput,
        message: "The project's startYear must be lower than or equal to the endYear.",
        target: 'startYear,endYear'
      });
    }
  }

  private getInterventionStatusByProjectStatus(project: IEnrichedProject): InterventionStatus {
    return project.projectTypeId === ProjectType.nonIntegrated
      ? InterventionStatus.accepted
      : InterventionStatus.integrated;
  }

  private validateYearForUpdate(
    businessErrorDetails: IApiError[],
    originalProject: IEnrichedProject,
    project: IEnrichedProject
  ): void {
    if (originalProject.startYear !== project.startYear) {
      businessErrorDetails.push({
        code: ErrorCodes.ProjectStartYear,
        message: 'Project start year cannot be changed with this method',
        target: 'startYear'
      });
    }
  }

  private validatePtiNumberDuplicate<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T
  ): void {
    if (!project || isEmpty(project.externalReferenceIds)) {
      return;
    }
    if (
      hasDuplicates(
        project.externalReferenceIds,
        externalReferenceId => externalReferenceId.type === ProjectExternalReferenceType.ptiNumber
      )
    ) {
      errorDetails.push({
        code: ErrorCodes.Duplicate,
        message: 'Project pti number already exist',
        target: 'externalReferenceIds'
      });
    }
  }

  private validateInfoRTUReferenceNumberDuplicate<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T
  ): void {
    if (!project || isEmpty(project.externalReferenceIds)) {
      return;
    }
    if (
      hasDuplicates(
        project.externalReferenceIds,
        externalReferenceId => externalReferenceId.type === ProjectExternalReferenceType.infoRTUReferenceNumber
      )
    ) {
      errorDetails.push({
        code: ErrorCodes.Duplicate,
        message: 'Project info rtu reference number already exist',
        target: 'externalReferenceIds'
      });
    }
  }

  private async validateProjectServices<T extends IPlainProject | IEnrichedProject>(
    errorDetails: IApiError[],
    project: T,
    interventions: IEnrichedIntervention[]
  ): Promise<void> {
    if (!project || isEmpty(project.servicePriorities)) {
      return;
    }

    const availableServiceTaxonomies = await projectService.getAvailableProjectServiceTaxonomies(
      project,
      interventions
    );
    const availableServices = availableServiceTaxonomies.map(serviceTaxonomy => serviceTaxonomy.code);

    for (const servicePriority of project.servicePriorities) {
      if (!availableServices.includes(servicePriority.service)) {
        errorDetails.push({
          code: ErrorCodes.ProjectServicePriority,
          message: 'At least one service priority is not defined in the list of available services for this project',
          target: 'servicePriorities'
        });
        break;
      }
    }
  }

  public validateRestrictions(project: IEnrichedProject | IPlainProject): Result<IGuardResult> {
    const restrictions: IRestriction = {
      BOROUGH: [project.boroughId],
      EXECUTOR: [project.executorId]
    };
    return RestrictionsValidator.validate(PROJECT_RESTRICTION_TYPES, restrictions);
  }
}
export const projectValidator = new ProjectValidator();

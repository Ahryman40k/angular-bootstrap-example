import {
  ErrorCodes,
  IApiError,
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  IInterventionCountBySearchRequest,
  IInterventionDecision,
  IInterventionPaginatedSearchRequest,
  InterventionDecisionType,
  InterventionExternalReferenceType,
  InterventionStatus,
  IPlainIntervention,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { createUnprocessableEntityError } from '@villemontreal/core-utils-general-nodejs-lib/dist/src';
import * as GJV from 'geojson-validation';
import { cloneDeep, get, isEmpty, isNil, isNumber } from 'lodash';

import { constants } from '../../../../config/constants';
import { assetService } from '../../../services/assetService';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  INTERVENTION_RESTRICTION_TYPES,
  RestrictionsValidator
} from '../../../shared/restrictions/restrictionsValidator';
import { IRestriction } from '../../../shared/restrictions/userRestriction';
import { hasDuplicates } from '../../../utils/arrayUtils';
import { createInvalidInputError } from '../../../utils/errorUtils';
import { createLogger } from '../../../utils/logger';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { appUtils, createInvalidParameterError } from '../../../utils/utils';
import { BaseValidator } from '../../../validators/baseValidator';
import { commonValidator } from '../../../validators/commonValidator';
import { AssetValidator } from '../../asset/validators/assetValidator';
import { db } from '../../database/DB';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { InterventionModel } from '../mongo/interventionModel';

const logger = createLogger('interventionUtils');
const DATA_INPUT_INCORRECT = 'The data input is incorrect!';

export const ESTIMATE_PRECISION = 3;
interface IInterventionTaxProperties {
  param: string;
  taxonomyGroup: string;
  optionnal: boolean;
}
export class InterventionValidator extends BaseValidator<IPlainIntervention | IEnrichedIntervention> {
  public static validateCanInteract(
    intervention: IEnrichedIntervention,
    invalidStatuses: InterventionStatus[] = [InterventionStatus.canceled]
  ): Result<IGuardResult> {
    if (invalidStatuses.includes(intervention.status as InterventionStatus)) {
      return Result.fail(
        Guard.error(
          'status',
          ErrorCode.FORBIDDEN,
          `Cannot interact with an intervention with status ${intervention.status}`
        )
      );
    }
    return Result.ok();
  }

  protected get model(): InterventionModel {
    return db().models.Intervention;
  }

  protected getOpenApiModelName(intervention: IPlainIntervention | IEnrichedIntervention) {
    if (typeof intervention.estimate === 'number') {
      return 'PlainIntervention';
    }
    return 'EnrichedIntervention';
  }
  /**
   * validate all fields and business constraints for an intervention object
   * @param intervention
   */
  public async validate<T extends IPlainIntervention | IEnrichedIntervention>(intervention: T): Promise<void> {
    if (isEmpty(intervention)) {
      throw createInvalidParameterError('The intervention to update is required');
    }
    const errorDetails: IApiError[] = [];
    await this.commonValidation<T>(errorDetails, intervention);
    this.validatePtiNumberDuplicate<T>(errorDetails, intervention);
    this.validateRequestorReferenceNumberDuplicate<T>(errorDetails, intervention);
    this.validateEstimate<T>(errorDetails, intervention);
    this.validateAssetsInIntervention<T>(errorDetails, intervention);
    if (errorDetails.length) {
      throw createInvalidInputError(DATA_INPUT_INCORRECT, errorDetails);
    }

    await this.validateBusinessRules(intervention);
  }

  public async validateForCreate(intervention: IPlainIntervention): Promise<void> {
    await this.validate<IPlainIntervention>(intervention);
    const errorDetails: IApiError[] = [];
    this.validateInterventionYear<IPlainIntervention>(errorDetails, intervention);
    if (errorDetails.length) {
      throw createInvalidInputError(DATA_INPUT_INCORRECT, errorDetails);
    }
  }

  public async validateForUpdate(
    currentIntervention: IEnrichedIntervention,
    incomingIntervention: IPlainIntervention
  ): Promise<void> {
    const clonedIncomingIntervention = { ...cloneDeep(incomingIntervention), id: currentIntervention.id };
    const result = InterventionValidator.validateCanInteract(currentIntervention);
    if (result.isFailure) {
      throw createUnprocessableEntityError(
        `It's impossible to interact with the intervention ${currentIntervention.id}`
      );
    }
    if (incomingIntervention.status && currentIntervention.status !== incomingIntervention.status) {
      throw createUnprocessableEntityError(`Intervention status can't be changed on update`);
    }
    await this.validate<IPlainIntervention>(clonedIncomingIntervention);
    const errorDetails: IApiError[] = [];
    if (errorDetails.length) {
      throw createInvalidInputError(DATA_INPUT_INCORRECT, errorDetails);
    }
  }

  public validateForDelete(intervention: IEnrichedIntervention): void {
    if (intervention.status === InterventionStatus.wished) {
      return;
    }
    throw createUnprocessableEntityError('Invalid intervention status', [
      {
        code: ErrorCodes.InvalidStatus,
        message: `Only intervention with status ${InterventionStatus.wished} can be deleted`,
        target: 'status'
      }
    ]);
  }

  public validateRestrictions(intervention: IPlainIntervention | IEnrichedIntervention): Result<IGuardResult> {
    const restrictions: IRestriction = {
      BOROUGH: [intervention.boroughId],
      EXECUTOR: [intervention.executorId],
      REQUESTOR: [intervention.requestorId]
    };
    return RestrictionsValidator.validate(INTERVENTION_RESTRICTION_TYPES, restrictions);
  }

  public async validateImport<T extends IPlainIntervention | IEnrichedIntervention>(intervention: T): Promise<void> {
    const errorDetails: IApiError[] = [];
    await this.commonValidation<T>(errorDetails, intervention);
    if (errorDetails.length) {
      throw createInvalidInputError(DATA_INPUT_INCORRECT, errorDetails);
    }
    await this.validateBusinessRules(intervention);
  }
  /**
   * Validates that geometry from asset property
   * @param geometry
   */
  public validateInputGeometry(geometry: IGeometry): void {
    logger.debug({ theGeometry: geometry }, 'Geometry received ::::::::::::::::::::');
    if (!geometry || !GJV.isGeometryObject(geometry)) {
      throw createInvalidParameterError('Specified geometry in body is not valid');
    }
  }

  public validateFromToBudget(inputErrors: IApiError[], request: IInterventionPaginatedSearchRequest): void {
    if (request.fromEstimate && request.toEstimate && request.fromEstimate > request.toEstimate) {
      inputErrors.push({
        code: ErrorCodes.InterventionEstimate,
        message: `The starting estimate is higher than the arriving estimate.`,
        target: 'estimate'
      });
    }
  }

  public async validateSearchRequest(searchRequest: IInterventionPaginatedSearchRequest): Promise<void> {
    if (isEmpty(searchRequest)) {
      return;
    }
    const errors: IApiError[] = [];
    await openApiInputValidator.validateInputModel(errors, 'InterventionPaginatedSearchRequest', searchRequest);
    await this.validateSearchRequestTaxonomy(errors, searchRequest);
    this.validateFromToBudget(errors, searchRequest);
    if (errors.length) {
      throw createInvalidInputError('Invalid search request.', errors);
    }
  }

  private async validateSearchRequestTaxonomy(
    errors: IApiError[],
    searchRequest: IInterventionPaginatedSearchRequest
  ): Promise<void> {
    if (searchRequest.status) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.interventionStatus, searchRequest.status);
    }
    if (searchRequest.interventionTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.interventionType, searchRequest.interventionTypeId);
    }
    if (searchRequest.workTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.workType, searchRequest.workTypeId);
    }
    if (searchRequest.executorId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.executor, searchRequest.executorId);
    }
    if (searchRequest.programId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.programType, searchRequest.programId);
    }
  }

  public async validateCountBySearchRequest(searchRequest: IInterventionCountBySearchRequest): Promise<void> {
    const errors: IApiError[] = [];
    await openApiInputValidator.validateInputModel(errors, 'InterventionCountBySearchRequest', searchRequest);
    if (searchRequest.status) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.interventionStatus, searchRequest.status);
    }
    if (searchRequest.interventionTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.interventionType, searchRequest.interventionTypeId);
    }
    this.validateKeyOf(errors, searchRequest.countBy);
    this.validateFromToBudget(errors, searchRequest);
    if (errors.length) {
      throw createInvalidInputError('Invalid search request.', errors);
    }
  }

  public validateInterventionYear<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): void {
    logger.debug('Validate interventionYear of intervention ::::::::::::::::::::');
    if (intervention.interventionYear - appUtils.getCurrentYear() < constants.interventionRules.MINIMUM_YEAR_GAP) {
      const minimumYear = appUtils.getCurrentYear() + constants.interventionRules.MINIMUM_YEAR_GAP - 1;
      errorDetails.push({
        code: '',
        message: `An intervention can only be created if the intervention year isn't older than the year ${minimumYear}.`,
        target: 'interventionYear'
      });
    }
  }

  /**
   * An intervention Year has to exist as int and 2000 or higher
   * 2000 is subject to change
   * @param intervention
   */
  public validatePlannedYear(intervention: IEnrichedIntervention, project?: IEnrichedProject): IApiError {
    if (!intervention.planificationYear) {
      return {
        code: 'Status',
        message: `Planification year must be defined`,
        target: 'planificationYear'
      };
    }
    if (intervention.planificationYear && intervention.planificationYear < 2000) {
      return {
        code: 'Status',
        message: `Planification year must be above the 2000`,
        target: 'planificationYear'
      };
    }
    return null;
  }

  public validatePostponedYear(targetYear: number, currentYear: number): IApiError {
    if (targetYear === currentYear) {
      return {
        code: 'Status',
        message: `Planification year and target year must be different`,
        target: 'planificationYear'
      };
    }
    return null;
  }

  /**
   * An intervention Year has to exist as int and 2000 or higher
   * 2000 is subject to change
   * @param intervention
   */
  public validatePlanificationYear(intervention: IEnrichedIntervention, project?: IEnrichedProject): IApiError {
    if (!intervention.planificationYear) {
      return {
        code: 'Status',
        message: `Planification year must be defined`,
        target: 'planificationYear'
      };
    }
    if (intervention.planificationYear && intervention.planificationYear < 2000) {
      return {
        code: 'Status',
        message: `Planification year must be above the 2000`,
        target: 'planificationYear'
      };
    }
    if (
      intervention.hasOwnProperty('project') &&
      project &&
      (intervention.planificationYear < project.startYear || intervention.planificationYear > project.endYear)
    ) {
      return {
        code: 'Status',
        message: `Planification year must be between year ${project.startYear} and ${project.endYear}`,
        target: 'planificationYear'
      };
    }
    return null;
  }

  /**
   * Validates that intervention is part of a program
   * @param intervention
   */
  public validateProgram(intervention: IEnrichedIntervention): IApiError {
    if (intervention.programId === null || intervention.programId === '') {
      return {
        code: 'Status',
        message: `Intervention must be attached to a program to be refused`,
        target: 'programId'
      };
    }
    return null;
  }

  /**
   * Verifies that the intervention has reference to taxonomies that exist
   * @param errorDetails
   * @param intervention
   * @param taxonomies
   */
  public async validateTaxonomy<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T,
    taxonomies: ITaxonomy[]
  ) {
    const interventionTaxProperties: IInterventionTaxProperties[] = [
      { param: 'programId', taxonomyGroup: TaxonomyGroup.programType, optionnal: true },
      { param: 'interventionTypeId', taxonomyGroup: TaxonomyGroup.interventionType, optionnal: false },
      { param: 'executorId', taxonomyGroup: TaxonomyGroup.executor, optionnal: false },
      { param: 'requestorId', taxonomyGroup: TaxonomyGroup.requestor, optionnal: false },
      { param: 'boroughId', taxonomyGroup: TaxonomyGroup.borough, optionnal: false },
      { param: 'medalId', taxonomyGroup: TaxonomyGroup.medalType, optionnal: true }
    ];

    // Add decisions properties
    this.addDecisionsPropertiesValidations<T>(interventionTaxProperties, intervention, errorDetails);

    // Add comments properties
    this.addCommentsPropertiesValidations<T>(interventionTaxProperties, intervention);

    // Add external references properties
    this.addExternalReferenceIdsPropertiesValidations<T>(interventionTaxProperties, intervention);

    // Add assets type id properties
    this.addAssetTypesPropertiesValidations<T>(interventionTaxProperties, intervention);

    this.validateTaxonomyPropertiesValidations<T>(taxonomies, interventionTaxProperties, intervention, errorDetails);

    // Validate asset type taxonomies only if the asset type is valid.
    if (errorDetails.every(x => x.target !== 'asset.typeId')) {
      await this.validateAssetTypeTaxonomies<T>(errorDetails, intervention);
    }
  }

  private addDecisionsPropertiesValidations<T extends IPlainIntervention | IEnrichedIntervention>(
    interventionTaxProperties: IInterventionTaxProperties[],
    intervention: T,
    errorDetails: IApiError[]
  ): void {
    if (!intervention.hasOwnProperty('decisions')) {
      return;
    }
    // TODO:
    // - use Intervention.create when domain class will be done
    const myIntervention = intervention as IEnrichedIntervention;
    const decisions = myIntervention.decisions;
    decisions.forEach((x, idx) => {
      interventionTaxProperties.push({
        param: `decisions[${idx}].typeId`,
        taxonomyGroup: TaxonomyGroup.interventionDecisionType,
        optionnal: false
      });
      if (x.typeId === InterventionDecisionType.refused) {
        this.validateDecisionRefusedTaxonomy(errorDetails, idx, x, interventionTaxProperties);
      }
    });
  }

  private addCommentsPropertiesValidations<T extends IPlainIntervention | IEnrichedIntervention>(
    interventionTaxProperties: IInterventionTaxProperties[],
    intervention: T
  ): void {
    if (!intervention.hasOwnProperty('comments')) {
      return;
    }
    // TODO:
    // - use Intervention.create when domain class will be done
    const myIntervention = intervention as IEnrichedIntervention;
    const comments = myIntervention.comments;
    comments.forEach((x, idx) => {
      interventionTaxProperties.push({
        param: `comments[${idx}].categoryId`,
        taxonomyGroup: TaxonomyGroup.commentCategory,
        optionnal: true
      });
    });
  }
  private addExternalReferenceIdsPropertiesValidations<T extends IPlainIntervention | IEnrichedIntervention>(
    interventionTaxProperties: IInterventionTaxProperties[],
    intervention: T
  ): void {
    if (!intervention.hasOwnProperty('externalReferenceIds')) {
      return;
    }
    // TODO:
    // - use Intervention.create when domain class will be done
    const myIntervention = intervention as IEnrichedIntervention;
    const externalReferenceIds = myIntervention.externalReferenceIds;
    externalReferenceIds.forEach((x, idx) => {
      interventionTaxProperties.push({
        param: `externalReferenceIds[${idx}].type`,
        taxonomyGroup: TaxonomyGroup.externalReferenceType,
        optionnal: true
      });
    });
  }
  private addAssetTypesPropertiesValidations<T extends IPlainIntervention | IEnrichedIntervention>(
    interventionTaxProperties: IInterventionTaxProperties[],
    intervention: T
  ) {
    if (!intervention.hasOwnProperty('assets')) {
      return;
    }
    // TODO:
    // - use Intervention.create when domain class will be done
    const myIntervention = intervention as IEnrichedIntervention;
    const assets = myIntervention.assets;
    assets.forEach((x, idx) => {
      interventionTaxProperties.push({
        param: `assets[${idx}].typeId`,
        taxonomyGroup: TaxonomyGroup.assetType,
        optionnal: false
      });
    });
  }
  private validateTaxonomyPropertiesValidations<T extends IPlainIntervention | IEnrichedIntervention>(
    taxonomies: ITaxonomy[],
    interventionTaxProperties: IInterventionTaxProperties[],
    intervention: T,
    errorDetails: IApiError[]
  ): void {
    for (const property of interventionTaxProperties) {
      const interventionPropertyValue = get(intervention, property.param);
      if (!property.optionnal || interventionPropertyValue) {
        const getTaxonomy = taxonomies.find(
          taxonomy => taxonomy.group === property.taxonomyGroup && taxonomy.code === interventionPropertyValue
        );
        if (getTaxonomy === undefined && interventionPropertyValue !== undefined) {
          errorDetails.push({
            code: '',
            message: `Taxonomy code: ${interventionPropertyValue} doesn't exist`,
            target: property.param
          });
        }
      }
    }
  }

  public validateDecisionTimeframeForProjectAndIntervention(
    intervention: IEnrichedIntervention,
    project: IEnrichedProject,
    decisionTargetYear: number
  ): void {
    if (project && (decisionTargetYear < project.startYear || decisionTargetYear > project.endYear)) {
      throw createInvalidInputError(
        `The decision is not allowed because its target year is outside the project's start and end years`
      );
    }

    if (intervention.planificationYear === decisionTargetYear) {
      throw createInvalidInputError(
        `The decision is not allowed, the decision year must be different from the intervention year`
      );
    }
  }

  private validateDecisionRefusedTaxonomy(
    errorDetails: IApiError[],
    idx: number,
    decision: IInterventionDecision,
    interventionTaxProperties: IInterventionTaxProperties[]
  ) {
    if (!decision.hasOwnProperty('refusalReasonId')) {
      errorDetails.push({
        code: '',
        message: `Refusal reason is required when decision is refused`,
        target: 'decision.refusalReasonId'
      });
    }
    interventionTaxProperties.push({
      param: `decisions[${idx}].refusalReasonId`,
      taxonomyGroup: TaxonomyGroup.interventionDecisionRefused,
      optionnal: false
    });
  }

  /**
   * Validates taxonomies that are based on the asset type.
   * @param errorDetails The list of errors
   * @param intervention The intervention model
   * @param taxonomies The list of all taxonomies
   */
  private async validateAssetTypeTaxonomies<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): Promise<void> {
    if (isEmpty(intervention.assets)) {
      return;
    }
    for (const asset of intervention.assets) {
      const assetTypeTaxonomy = await assetService.getTaxonomyAssetType(asset.typeId);

      if (!assetTypeTaxonomy) {
        errorDetails.push({
          code: ErrorCodes.Taxonomy,
          message: `Cannot find taxonomy group: ${TaxonomyGroup.assetType} and code: ${asset.typeId}`
        });
        return;
      }

      if (!assetTypeTaxonomy.properties.owners?.includes(intervention.assets[0].ownerId)) {
        errorDetails.push({
          code: ErrorCodes.Taxonomy,
          message: `Owner ID taxonomy code: ${asset.ownerId} doesn't exist for asset type: ${asset.typeId}`
        });
      }

      if (!assetTypeTaxonomy.properties.workTypes?.includes(intervention.workTypeId)) {
        errorDetails.push({
          code: ErrorCodes.Taxonomy,
          message: `Work type taxonomy code: ${intervention.workTypeId} doesn't exist for asset type: ${asset.typeId}`
        });
      }
    }
  }

  private async commonValidation<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): Promise<void> {
    await this.validateOpenApiModel(errorDetails, intervention);
    intervention.assets?.forEach(asset => {
      if (asset?.geometry) {
        AssetValidator.validateGeometry(errorDetails, 'assets.geometry', get(asset, 'geometry', null));
      }
    });
    commonValidator.validateGeometry(
      errorDetails,
      'interventionArea.geometry',
      get(intervention?.interventionArea, 'geometry', null)
    );
    await this.validateTaxonomy<T>(errorDetails, intervention, await taxonomyService.all());
  }

  private validatePtiNumberDuplicate<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): void {
    if (!intervention || isEmpty(intervention.externalReferenceIds)) {
      return;
    }
    if (
      hasDuplicates(
        intervention.externalReferenceIds,
        externalReferenceId => externalReferenceId.type === InterventionExternalReferenceType.ptiNumber
      )
    ) {
      errorDetails.push({
        code: '',
        message: 'Intervention pti number already exist',
        target: ErrorCodes.Duplicate
      });
    }
  }

  private validateRequestorReferenceNumberDuplicate<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): void {
    if (!intervention || isEmpty(intervention.externalReferenceIds)) {
      return;
    }
    if (
      hasDuplicates(
        intervention.externalReferenceIds,
        externalReferenceId => externalReferenceId.type === InterventionExternalReferenceType.requestorReferenceNumber
      )
    ) {
      errorDetails.push({
        code: '',
        message: 'Intervention requestor reference number already exist',
        target: ErrorCodes.Duplicate
      });
    }
  }

  private async validateBusinessRules<T extends IPlainIntervention | IEnrichedIntervention>(
    intervention: T
  ): Promise<void> {
    if (isNil(intervention.assets)) {
      return;
    }
    const errorDetails: IApiError[] = [];
    await AssetValidator.validateAssetsIntoIntervention<T>(errorDetails, intervention);
    if (errorDetails.length) {
      throw createUnprocessableEntityError(`The intervention doesn't meet the business rules`, errorDetails);
    }
  }

  /**
   *  validate that all assets of the intervention are in the intervention geometry
   */
  public validateAssetsInIntervention<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): void {
    if (isNil(intervention.assets)) {
      return;
    }
    for (const asset of intervention.assets) {
      AssetValidator.validateAssetInInterventionGeometry(errorDetails, asset, intervention);
    }
  }

  private validateEstimate<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): void {
    if (isNil(intervention.estimate)) {
      return;
    }
    if (isNumber(intervention.estimate)) {
      this.validateNumberPrecision(errorDetails, intervention.estimate, ESTIMATE_PRECISION, 'estimate');
    } else {
      for (const key of Object.keys(intervention.estimate)) {
        this.validateNumberPrecision(errorDetails, intervention.estimate[key], ESTIMATE_PRECISION, `estimate.${key}`);
      }
    }
  }

  private validateNumberPrecision(
    errorDetails: IApiError[],
    numberToValidate: number,
    precision: number,
    target: string
  ): void {
    const splitedEstimate = numberToValidate.toString().split('.');
    if (splitedEstimate.length > 1 && splitedEstimate.pop().length > precision) {
      errorDetails.push({
        code: ErrorCode.INVALID,
        message: `${precision} digits maximum after the point`,
        target
      });
    }
  }
}
export const interventionValidator = new InterventionValidator();

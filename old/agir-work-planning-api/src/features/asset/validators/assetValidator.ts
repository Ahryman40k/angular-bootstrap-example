import { feature, multiPolygon, polygon, Position } from '@turf/turf';
import {
  AssetExpand,
  ErrorCodes,
  IApiError,
  IAsset,
  IEnrichedIntervention,
  IGeometry,
  InterventionStatus,
  IPlainIntervention,
  ISearchAssetsRequest,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import * as GJV from 'geojson-validation';
import { intersection, isEmpty } from 'lodash';

import { IGetAssetRequest } from '../../../models/assets/get-asset-request';
import { spatialAnalysisService } from '../../../services/spatialAnalysisService';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, GuardType } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { createInvalidInputError, INVALID_INPUT_ERROR_MESSAGE } from '../../../utils/errorUtils';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { commonValidator } from '../../../validators/commonValidator';
import { InterventionFindOptions } from '../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../interventions/mongo/interventionRepository';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { IAssetCriterias } from '../models/assetFindOptions';

export class AssetValidator {
  public static async validateAgainstOpenApi(assetInput: IAsset): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('Asset', assetInput);
  }

  /**
   * Validates that geometry from asset property
   * @param geometry
   */
  public static validateGeometry(errorDetails: IApiError[], target: string, geometry: IGeometry): void {
    if (!geometry || !GJV.isGeometryObject(geometry)) {
      errorDetails.push({
        code: '',
        message: 'the geometry is not valid',
        target
      });
    }
  }

  /**
   * Validates that geometry from asset property
   * @param geometry
   */
  public static async validateAssetsIntoIntervention<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    intervention: T
  ): Promise<void> {
    const validStatus: string[] = [
      InterventionStatus.canceled,
      InterventionStatus.refused,
      InterventionStatus.wished,
      InterventionStatus.accepted,
      InterventionStatus.integrated
    ];
    const conditionnalValidStatus: string[] = [InterventionStatus.accepted, InterventionStatus.integrated];
    const assetId = intervention.assets.filter(a => a.id).map(a => a.id);
    const interventions = await interventionRepository.findAll(
      InterventionFindOptions.create({
        criterias: { assetId, excludeIds: [intervention.id] },
        orderBy: '-planificationYear',
        fields: ['assets.id', 'status', 'planificationYear'].join(',')
      }).getValue()
    );
    const invalidAssetIds: string[] = [];
    interventions.forEach(i => {
      if (
        !validStatus.includes(i.status) ||
        (conditionnalValidStatus.includes(i.status) && i.planificationYear === intervention.planificationYear)
      ) {
        invalidAssetIds.push(
          ...intersection(
            assetId,
            i.assets.map(a => a.id)
          )
        );
      }
    });
    if (!isEmpty(invalidAssetIds)) {
      errorDetails.push({
        code: ErrorCodes.InvalidStatus,
        message: `Some assets are already in interventions having incorrect status: [${invalidAssetIds.join(',')}]`,
        target: 'assets'
      });
    }
  }

  /**
   * validate that all assets of the intervention are in the intervention geometry
   * @param errorDetails
   * @param asset
   * @param intervention
   * @returns
   */
  public static validateAssetInInterventionGeometry<T extends IPlainIntervention | IEnrichedIntervention>(
    errorDetails: IApiError[],
    asset: IAsset,
    intervention: T
  ): void {
    if (!asset?.geometry || !intervention?.interventionArea?.geometry) {
      return;
    }

    // Intervention area can only be of type Polygon or MultiPolygon
    // We create feature with the geometry
    const interventionAreaFeature =
      intervention.interventionArea.geometry.type === 'Polygon'
        ? polygon(intervention.interventionArea.geometry.coordinates as Position[][])
        : multiPolygon(intervention.interventionArea.geometry.coordinates as Position[][][]);
    if (!spatialAnalysisService.booleanIntersects(interventionAreaFeature, feature(asset.geometry as any))) {
      errorDetails.push({
        code: ErrorCodes.InterventionAsset,
        message: `An Asset is not within the intervention geometry`,
        target: 'asset.geometry'
      });
    }
  }

  public static async validateSearchAssetsRequestTaxonomy(request: IAssetCriterias): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];

    let objectToValidate: string | string[];
    if (request.hasOwnProperty('assetTypes')) {
      objectToValidate = request.assetTypes;
    }
    if (objectToValidate) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.assetType, objectToValidate);
    }

    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }

    return Result.ok();
  }

  /**
   * Validates that geometry from asset property
   * @param geometry
   */
  public isValidGeometry(geometry: IGeometry): boolean {
    if (!geometry || !GJV.isGeometryObject(geometry)) {
      return false;
    }
    return true;
  }

  public async validateGetAssetRequest(request: IGetAssetRequest): Promise<void> {
    commonValidator.assertRequestTruthy(request);

    const errors: IApiError[] = [];

    if (!/^\d+$/.test(request.id)) {
      errors.push({
        code: ErrorCodes.InvalidInput,
        message: 'The ID is invalid. It must be an integer.'
      });
    }

    await taxonomyValidator.validate(errors, TaxonomyGroup.assetType, request.type);

    if (request.expand?.length && !request.expand.every(x => Object.values(AssetExpand).includes(x))) {
      errors.push({
        code: ErrorCodes.InvalidInput,
        message: 'The expand option is not valid.'
      });
    }

    if (errors.length) {
      throw createInvalidInputError('Invalid request.', errors);
    }
  }

  public async validateSearchAssetsRequest(request: ISearchAssetsRequest): Promise<void> {
    commonValidator.assertRequestTruthy(request);
    commonValidator.assertRequestNotEmpty(request);

    const errors: IApiError[] = [];

    await openApiInputValidator.validateInputModel(errors, 'SearchAssetsRequest', request);

    if (request.assetTypes) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.assetType, request.assetTypes);
    }
    const guardPolygon = Guard.guard({
      argument: request.geometry,
      argumentName: 'geometry',
      guardType: [GuardType.VALID_POLYGON]
    });
    if (!guardPolygon.succeeded) {
      errors.push({
        code: ErrorCodes.InvalidInput,
        message: guardPolygon.message
      });
    }

    if (errors.length) {
      throw createInvalidInputError(INVALID_INPUT_ERROR_MESSAGE, errors);
    }
  }
}

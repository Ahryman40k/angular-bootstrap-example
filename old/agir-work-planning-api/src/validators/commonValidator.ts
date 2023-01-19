import { IGeometry, ITaxonomy } from '@villemontreal/agir-work-planning-lib';
import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as GJV from 'geojson-validation';
import * as _ from 'lodash';

import { createInvalidInputError } from '../utils/errorUtils';
import { createLogger } from '../utils/logger';
import { IApiError } from '../utils/utils';

const logger = createLogger('CommonValidator');
export interface ITaxonomyValidatorProperty {
  param: string;
  taxonomyGroup: string;
  optionnal: boolean;
}
export class CommonValidator {
  public assertRequestTruthy(request: any): void {
    if (request) {
      return;
    }

    throw createInvalidInputError('Invalid request.', [
      {
        code: ErrorCodes.InvalidInput,
        message: 'The request object is null.'
      }
    ]);
  }

  public assertRequestNotEmpty(request: any): void {
    if (!_.isEmpty(request)) {
      return;
    }

    throw createInvalidInputError('Invalid request.', [
      {
        code: ErrorCodes.InvalidInput,
        message: 'The request object is empty.'
      }
    ]);
  }

  /**
   * Validates that geometry from asset property
   * @param geometry
   */
  public validateGeometry(errorDetails: IApiError[], target: string, geometry: IGeometry): void {
    logger.debug({ theGeometry: geometry }, 'Geometry received ::::::::::::::::::::');
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
  public isValidGeometry(geometry: IGeometry): boolean {
    if (!geometry || !GJV.isGeometryObject(geometry)) {
      return false;
    }
    return true;
  }

  public validateTaxonomies(
    errorDetails: IApiError[],
    taxonomies: ITaxonomy[],
    property: ITaxonomyValidatorProperty,
    objectPropertyValue: any
  ): void {
    const getTaxonomy = taxonomies.find(
      taxonomy => taxonomy.group === property.taxonomyGroup && taxonomy.code === objectPropertyValue
    );
    if (getTaxonomy === undefined && objectPropertyValue !== undefined) {
      errorDetails.push({
        code: property.taxonomyGroup,
        message: `Taxonomy code: ${objectPropertyValue} doesn't exist`,
        target: property.param
      });
    }
  }
}
export const commonValidator = new CommonValidator();

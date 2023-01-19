import { Feature, LineString, MultiLineString, MultiPolygon, Point, Polygon } from '@turf/helpers';
import * as turf from '@turf/turf';
import { IApiError } from '@villemontreal/agir-work-planning-lib';

import { projectInputErrorMessage } from '../features/projects/validators/projectValidator';
import { createInvalidInputError } from '../utils/errorUtils';
import { openApiInputValidator } from '../utils/openApiInputValidator';
import { BUFFER_INTERVENTION_AREA_METERS, workAreaService } from './workAreaService';

export const BUFFER_PROJECT_AREA_DISTANCE_METERS = 2;

export class ProjectWorkAreaService {
  public async validatePolygons(polygons: Polygon[]): Promise<void> {
    const errorDetails: IApiError[] = [];

    if (!polygons || !polygons.length) {
      throw createInvalidInputError('The input must be an array of polygons');
    }

    await Promise.all(polygons.map(p => openApiInputValidator.validateInputModel(errorDetails, 'Geometry', p)));

    if (errorDetails.length) {
      throw createInvalidInputError(projectInputErrorMessage, errorDetails);
    }
  }
  public generateImportWorkAreaFromInterventionArea(
    interventionArea: turf.Feature<turf.Polygon>
  ): Feature<Polygon | MultiPolygon> {
    return turf.buffer(interventionArea, BUFFER_INTERVENTION_AREA_METERS, {
      units: 'meters'
    });
  }

  public async generateWorkArea(point: Point): Promise<Feature<Polygon>>;
  // tslint:disable-next-line:unified-signatures
  public async generateWorkArea(lineString: LineString): Promise<Feature<Polygon>>;
  // tslint:disable-next-line:unified-signatures
  public async generateWorkArea(multiLineString: MultiLineString): Promise<Feature<Polygon>>;
  // tslint:disable-next-line:unified-signatures
  public async generateWorkArea(polygon: Polygon): Promise<Feature<Polygon>>;
  // tslint:disable-next-line:unified-signatures
  public async generateWorkArea(polygons: Polygon[]): Promise<Feature<Polygon>>;
  public async generateWorkArea(geometry: any): Promise<Feature<Polygon>> {
    let workArea: Feature<Polygon>;
    if (geometry instanceof Array && geometry.every(x => x.type === 'Polygon')) {
      if (geometry.length === 1) {
        workArea = await this.generateWorkAreaFromPolygon(geometry[0]);
      } else {
        workArea = await workAreaService.generateWorkAreaFromPolygons(geometry, BUFFER_PROJECT_AREA_DISTANCE_METERS);
      }
    } else {
      switch (geometry.type) {
        case 'Point':
          workArea = await workAreaService.generateWorkAreaFromPoint(geometry);
          break;
        case 'LineString':
          workArea = await workAreaService.generateWorkAreaFromLineString(geometry);
          break;
        case 'MultiLineString':
          workArea = await workAreaService.generateWorkAreaFromMultiLineString(geometry);
          break;
        case 'Polygon':
          workArea = await this.generateWorkAreaFromPolygon(geometry);
          break;
        default:
          throw createInvalidInputError(`Invalid geometry. The geometry type "${geometry.type}" is not supported`);
      }
    }
    return workAreaService.simplifyWorkArea(workArea);
  }

  /**
   * Generate a work area for a project based on a single polygon.
   * @param polygon The polygon.
   */
  private async generateWorkAreaFromPolygon(polygon: Polygon): Promise<Feature<Polygon>> {
    return turf.buffer(polygon, BUFFER_PROJECT_AREA_DISTANCE_METERS, { units: 'meters' });
  }
}
export const projectWorkAreaService = new ProjectWorkAreaService();

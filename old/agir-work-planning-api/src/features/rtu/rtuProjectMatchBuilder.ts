import { bboxPolygon } from '@turf/turf';
import { AssetGeometryType, IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as moment from 'moment';

import { assetService } from '../../services/assetService';
import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { IRtuProjectCriterias } from './models/rtuProjectFindOptions';

class RtuProjectMatchBuilder extends BaseMatchBuilder<IRtuProjectCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    areaId: 'areaId',
    partnerId: 'partnerId',
    phase: 'phase',
    rtuStatus: 'status',
    fromDateStart: 'dateStart',
    fromDateEnd: 'dateEnd',
    toDateStart: 'dateStart',
    toDateEnd: 'dateEnd',
    bbox: 'geometry',
    intersectGeometry: 'geometry',
    geometryPin: 'geometryPin'
  };

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case 'id':
      case '_id':
      case 'areaId':
      case 'partnerId':
      case 'rtuStatus':
      case 'phase':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: convertStringOrStringArray(criteriaValue) } };
      case 'bbox':
        // convert the string of coordinates into array of numbers
        const bbox = criteriaValue.split(',').map((x: string) => +x);
        const bboxGeometry = bboxPolygon(bbox).geometry;
        return this.getGeoIntersectGeoWhithInOrQuery(criteriaKey, bboxGeometry);
      case 'intersectGeometry':
        // convert line and point to polygon
        const intersectGeometry = this.getPolygon(criteriaValue);
        return this.getGeoIntersectGeoWhithInOrQuery(criteriaKey, criteriaValue, intersectGeometry);
      case 'fromDateStart':
      case 'fromDateEnd':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $gte: moment(criteriaValue).toDate()
          }
        };
      case 'toDateStart':
      case 'toDateEnd':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $lte: moment(criteriaValue).toDate()
          }
        };
      default:
        return {
          [criteriaKey]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }

  private getPolygon(criteriaValue: IGeometry): IGeometry {
    const polygon = criteriaValue;
    if (criteriaValue.type === AssetGeometryType.Point || criteriaValue.type === AssetGeometryType.LineString) {
      const buffered = assetService.getDefaultBuffer(criteriaValue);
      polygon.type = buffered.geometry.type;
      polygon.coordinates = buffered.geometry.coordinates;
    }
    return polygon;
  }

  private getGeoIntersectGeoWhithInOrQuery(
    criteriaKey: string,
    geoIntersectsGeometry: IGeometry,
    geoWithinGeometry: IGeometry = geoIntersectsGeometry
  ) {
    return {
      $or: [
        {
          [this.queryCorrespondence[criteriaKey]]: {
            $geoIntersects: { $geometry: geoIntersectsGeometry }
          }
        },
        {
          [this.queryCorrespondence.geometryPin]: {
            $geoWithin: { $geometry: geoWithinGeometry }
          }
        }
      ]
    };
  }
}

export const rtuProjectMatchBuilder = new RtuProjectMatchBuilder();

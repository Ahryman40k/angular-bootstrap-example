import { Injectable } from '@angular/core';
import {
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  IRtuProject
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';
import { MapLayersSources } from 'src/app/map/config/layers/map-enums';

import { assetSourceLayerIds } from '../../map/config/layers/asset-logic-layer-groups';
import { IAddressFull } from '../models/location/address-full';
import { ObjectType } from '../models/object-type/object-type';

export type ObjectTypeModel = IEnrichedIntervention | IEnrichedProject | IAddressFull | IAsset | IRtuProject;

@Injectable({ providedIn: 'root' })
export class ObjectTypeService {
  public getObjectTypeFromFeature(feature: mapboxgl.MapboxGeoJSONFeature): ObjectType {
    if (!feature) {
      return null;
    }
    if (feature.properties?.rtuProject) {
      return ObjectType.rtuProject;
    }
    if (typeof feature.properties?.id === 'string') {
      if (feature.properties?.id?.startsWith('I')) {
        return ObjectType.intervention;
      }
      if (feature.properties?.id?.startsWith('P')) {
        return ObjectType.project;
      }
    }

    switch (feature.source) {
      case MapLayersSources.ADDRESSES_PINS:
        return ObjectType.address;
      case MapLayersSources.COUNT_BY_BOROUGH:
        return ObjectType.countBorough;
      default:
        break;
    }

    if (assetSourceLayerIds.includes(feature.sourceLayer)) {
      return ObjectType.asset;
    }
    throw new Error('Cannot determine the object type.');
  }

  public getObjectTypeFromModel(object: ObjectTypeModel): ObjectType {
    const rtuProject = object as IRtuProject;
    if (!_.isUndefined(rtuProject.partnerId)) {
      return ObjectType.rtuProject;
    }
    if (typeof object.id === 'string') {
      if (object.id?.startsWith('I')) {
        return ObjectType.intervention;
      }
      if (object.id?.startsWith('P')) {
        return ObjectType.project;
      }
    }
    const address = object as IAddressFull;
    if (address?.street) {
      return ObjectType.address;
    }
    const asset = object as IAsset;
    if (asset.typeId && asset.id) {
      return ObjectType.asset;
    }
    return null;
  }
}

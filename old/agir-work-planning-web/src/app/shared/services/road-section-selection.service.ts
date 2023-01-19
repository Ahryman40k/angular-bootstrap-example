import { Injectable } from '@angular/core';
import { buffer, LineString } from '@turf/turf';
import { AssetType, IAssetList, IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AssetService, roadwayAssetTypes } from './asset.service';

const ROAD_SECTION_SELECTION_BUFFER_METERS = 5;

@Injectable({
  providedIn: 'root'
})
export class RoadSectionSelectionService {
  constructor(private readonly assetService: AssetService) {}

  public async getRoadSectionAssets(roadSection: any, assetType: AssetType): Promise<IAssetList> {
    if (!roadSection) {
      return undefined;
    }
    const bufferedFeature = buffer(roadSection.geometry as LineString, ROAD_SECTION_SELECTION_BUFFER_METERS, {
      units: 'meters'
    });
    let assetTypes = [assetType];
    if (assetType === AssetType.roadway) {
      assetTypes = roadwayAssetTypes;
    }
    return this.assetService.searchAssets({
      geometry: bufferedFeature.geometry as IGeometry,
      assetTypes
    });
  }
}

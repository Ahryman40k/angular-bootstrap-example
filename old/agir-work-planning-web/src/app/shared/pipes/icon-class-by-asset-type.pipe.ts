import { Pipe, PipeTransform } from '@angular/core';
import { flatten } from 'lodash';
import { mapLayerManagerConfig } from 'src/app/map/panel/asset-layer/map-layer-manager-config';

@Pipe({
  name: 'appIconClassNameByAssetType',
  pure: false
})
export class IconClassNameByAssetType implements PipeTransform {
  public transform(assetType: string): string {
    return this.getClassByAssetType(assetType);
  }

  private getClassByAssetType(assetType: string): string {
    if (!assetType) {
      return '';
    }

    const groups = flatten(mapLayerManagerConfig.layersType.map(layerType => layerType.groups));
    const subGroups = flatten(groups.map(group => group.subGroups));
    const layer = flatten(subGroups.map(subGroup => subGroup.layers)).find(l => l.layerId === assetType);

    return `icon ${layer?.icon}`;
  }
}

import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import { IFeature } from '@villemontreal/agir-work-planning-lib/dist/src';
import { MapComponent } from '@villemontreal/maps-angular-lib';
import { isEqual, uniqBy } from 'lodash';
import { GeoJSONSource } from 'mapbox-gl';
import {
  hoverLayerConfigs,
  hoverRoadSectionConfig,
  IHoverLayerConfig,
  roadSectionConfig
} from 'src/app/map/hover/hover-layer-configs';

import { MapLayersSources } from '../../map/config/layers/map-enums';
import { Visibility } from '../models/visibility';

const ROAD_SECTION_SELECTION_LAYER_ID = 'roads-section-selection';
@Injectable({ providedIn: 'root' })
export class MapRoadSectionHoverService {
  private map: MapComponent;

  public init(map: MapComponent): void {
    this.map = map;
    for (const hoverLayerConfig of hoverLayerConfigs) {
      this.handleHover(hoverLayerConfig);
    }
  }

  public initRoadSectionSelectionHover(): void {
    this.setRoadSectionVisibility('visible');
    this.handleHover(roadSectionConfig);
  }

  public disableRoadSectionVisibility(): void {
    this.setRoadSectionVisibility('none');
  }

  private handleHover(config: IHoverLayerConfig): void {
    this.map?.map.on('mousemove', config.layerId, ev => this.hover(ev, config));
    this.map?.map.on('mouseleave', config.layerId, () => this.clearHover(config));
  }

  private hover(e: any, config: IHoverLayerConfig): void {
    if (e.features?.length > 0) {
      const isLayerRoadSection = e.features[0].layer.id === ROAD_SECTION_SELECTION_LAYER_ID;
      if (config.hoveredId) {
        if (isLayerRoadSection) {
          this.setRoadSectionHoverSource([]);
        } else {
          this.setFeatureStateHover(false, config);
        }
      }
      config.hoveredId = e.features[0].id;
      if (isLayerRoadSection) {
        this.setRoadSectionFeatureStateHover(true, e.features[0], config);
      } else {
        this.setFeatureStateHover(true, config);
      }
    }
  }

  private clearHover(config: IHoverLayerConfig): void {
    if (config.hoveredId) {
      this.setRoadSectionHoverSource([]);
      this.setFeatureStateHover(false, config);
    }
    config.hoveredId = null;
  }

  private setFeatureStateHover(hover: boolean, config: IHoverLayerConfig): void {
    this.map?.map.setFeatureState(
      { source: config.source, sourceLayer: config.sourceLayer, id: config.hoveredId },
      { hover }
    );
  }

  private setRoadSectionFeatureStateHover(hover: boolean, feature: IFeature, config: IHoverLayerConfig): void {
    this.setRoadSectionHoverSource([feature], hover, true);
    this.map?.map.setFeatureState({ source: hoverRoadSectionConfig.source, id: config.hoveredId }, { hover });
  }

  private setRoadSectionHoverSource(features: IFeature[], hover?: boolean, handleHover?: boolean): void {
    const source = this.map?.map.getSource(MapLayersSources.ROAD_SECTION_HOVER) as GeoJSONSource;
    if (!source) {
      return;
    }
    let roadSections: any[];
    if (handleHover) {
      if (hover) {
        roadSections = uniqBy([features[0], ...(source as any)._data?.features], feature =>
          JSON.stringify(feature.geometry)
        );
      } else {
        roadSections = [
          ...(source as any)._data?.features.filter(feature => !isEqual(feature.geometry, features[0].geometry))
        ];
      }
      source.setData(turf.featureCollection(roadSections || []) as any);
    } else {
      source.setData(turf.featureCollection(features || []) as any);
    }
  }

  private setRoadSectionVisibility(visibility: Visibility): void {
    this.map?.map.setLayoutProperty('roads-section-selection', 'visibility', visibility);
    this.map?.map.setLayoutProperty('hover-roads-section-selection', 'visibility', visibility);
  }
}

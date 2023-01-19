import { Component, OnInit } from '@angular/core';
import area from '@turf/area';
import centroid from '@turf/centroid';
import { Feature } from '@turf/helpers';

import { ITool } from '../../models/tools/tool.model';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

const defaultStyle = [
  {
    id: 'highlight-active-points',
    type: 'circle',
    paint: {
      'circle-color': '#007bff',
      'circle-radius': 6
    }
  },
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'fill-color': '#000080',
      'fill-outline-color': '#D20C0C',
      'fill-opacity': 0.1
    }
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#696969',
      'line-dasharray': [0.5, 3],
      'line-width': 2
    }
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#404040'
    }
  },
  // vertex points
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 7,
      'circle-color': '#007bff'
    }
  }
];

@Component({
  selector: 'vdm-geometry-draw-tool',
  templateUrl: './geometry-draw-tool.component.html',
  styleUrls: ['./geometry-draw-tool.component.css']
})
export class GeometryDrawToolComponent extends MapEventListener implements OnInit, ITool {
  private modeInteraction = 'geometry-draw-tool';
  public showOkCancel = true;
  public toolName: string = 'geometry-draw-tool';
  public isEditTool = true;

  public drawProperties = {
    displayControlsDefault: false,
    userProperties: true,
    styles: defaultStyle,
    controls: null
  };

  constructor() {
    super();
  }

  public onMapLoaded() {
    this.targetMap.subscribeEvent('dblclick', this.modeInteraction).subscribe((e: any) => this.done());

    this.targetMap
      .subscribeEvent('mousemove', this.modeInteraction)
      .subscribe((e: any) => this.updateMeasurementofGeometry(e));

    this.targetMap.addTool(this);
  }

  private updateMeasurement(polygon: any) {
    const centroidValue = centroid(polygon as Feature<any>);

    const areaValue: number = area(polygon);

    // Area Text
    let textArea = '';
    if (areaValue > 1000 * 1000) {
      textArea = (areaValue / 1000000).toFixed(3) + ' km²';
    } else {
      textArea = areaValue.toFixed(3) + ' m²';
    }

    centroidValue.properties.text = textArea;
    (this.targetMap.map.getSource('tools') as mapboxgl.GeoJSONSource).setData(centroidValue);
  }

  public updateMeasurementofGeometry(event) {
    // Obtenir tous les feature de mapbox draw.
    const feat = this.getFeature();
    if (feat && feat.geometry && feat.geometry.coordinates[0]) {
      if (feat.geometry.type === 'Polygon') {
        const polygonOk = feat.geometry.coordinates[0][0] != null; // Le premier coordonnées est null si la forme est en 'construction'
        if (polygonOk) {
          this.updateMeasurement(feat);
        }
      }
    } else {
      return;
    }
  }

  public start(options: any, callback: (e: any) => void) {
    this.doneCallback = callback;

    const mode = options.mode;
    if (!mode) {
      throw new Error('No mode for tool');
    }

    const drawControls = this.targetMap.getDraw().getSupportedControls(options.controls);

    this.targetMap.initDraw({ ...this.drawProperties, controls: drawControls });

    this.targetMap.draw.mapboxDrawInstance.deleteAll();
    this.targetMap.interactionMode = this.modeInteraction;

    // Ajouter la forme s'il y en a une
    if (options.feature) {
      const featureId = this.targetMap.draw.mapboxDrawInstance.add(options.feature);
      this.targetMap.draw.useMode(mode, {
        featureIds: featureId
      });
    } else {
      this.targetMap.draw.useMode(mode, {});
    }
  }

  private getFeature() {
    const all = this.targetMap.draw.getAll();
    return all.features[0];
  }

  private clean() {
    if (this.targetMap.draw.mapboxDrawInstance) {
      this.targetMap.draw.mapboxDrawInstance.deleteAll();
      (this.targetMap.map.getSource('tools') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }

  public cancel() {
    this.targetMap.resetDraw(this.drawProperties);
    this.clean();
  }

  public done() {
    const feat = this.getFeature();
    this.clean();

    this.targetMap.interactionMode = '';

    this.doneCallback(feat);
  }
}

import { Component, OnInit } from '@angular/core';
import transformRotate from '@turf/transform-rotate';
import { Feature, FeatureCollection } from 'geojson';
import { MapMouseEvent } from 'mapbox-gl';
import { ITool } from '../../models/tools/tool.model';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

/**
 * Ce composant permet de faire des transformations 2D:
 *  - Déplacer
 *  - Pivoter
 *  - Zoomer
 */
@Component({
  selector: 'vdm-transform-tool',
  templateUrl: './transform-tool.component.html',
  styleUrls: ['./transform-tool.component.css']
})
export class TransformToolComponent extends MapEventListener implements OnInit, ITool {
  private modeInteraction = 'transform-tool';
  public showOkCancel = true;
  public toolName: string = 'transform-tool';
  public isEditTool = true;

  private mouseDown = false;
  private mouseDownEvent: MapMouseEvent = null;

  private clickedFeatures = [];
  private rotateOffset = 0;

  // Devrait être commun à tous les outils. Devrait remplacer la fonction temporaire unRectangle()
  // private featuresToEdit: Feature[] = [];

  constructor() {
    super();
  }

  public onMapLoaded() {
    this.targetMap.subscribeEvent('mousedown', this.modeInteraction).subscribe((e: any) => this.onMouseDown(e));
    this.targetMap.subscribeEvent('drag', this.modeInteraction).subscribe((e: any) => this.onDrag(e));
    this.targetMap.subscribeEvent('mousemove', this.modeInteraction).subscribe((e: any) => this.onMouseMove(e));
    this.targetMap.subscribeEvent('mouseup', this.modeInteraction).subscribe((e: any) => this.onMouseUp(e));

    this.targetMap.addTool(this);
  }

  public start(options: any, callback: (e: any) => void) {
    this.doneCallback = callback;
    this.targetMap.interactionMode = this.modeInteraction;

    //
    // Récupérer la géométrie
    const featuresToEdit = [this.unRectangle()];
    const featureCollection = this.createFeatureCollection(featuresToEdit);
    (this.targetMap.map.getSource('tools') as mapboxgl.GeoJSONSource).setData(featureCollection);

    // Pour le moment, c'est rotation
    // const mode = options.mode;
    // if (!mode) {
    //   throw new Error('No mode for tool');
    // }
  }

  private onMouseDown(mouseEvent: MapMouseEvent) {
    this.mouseDownEvent = mouseEvent;
    this.mouseDown = true;

    this.clickedFeatures = this.getToolsFeaturesFromPoint(mouseEvent);
  }

  private getToolsFeaturesFromPoint(mouseEvent: MapMouseEvent) {
    this.targetMap.queryableLayers = ['tools'];
    // const selectionContent: { [logicalLayerId: string]: Feature[] } = this.targetMap.queryFromPoint(mouseEvent.point);
    // TODO: Corriger.
    // if (selectionContent.length > 0) {
    //   return selectionContent[0].features;
    // }
    return [];
  }

  private onDrag(mouseEvent: MapMouseEvent) {
    // On s'assure que la carte ne bouge pas

    if (this.clickedFeatures.length > 0) {
      this.targetMap.map.dragPan.disable();
      this.targetMap.map.getCanvas().style.cursor = 'alias';
    }
  }

  private getRotatedGeometry(degree) {
    const rectangle = this.unRectangle();

    return transformRotate(rectangle as any, degree);
  }

  private onMouseMove(mouseEvent: MapMouseEvent) {
    if (this.mouseDown && this.clickedFeatures.length > 0) {
      const rectangle = this.unRectangle();
      const degree = this.getDegree(mouseEvent);
      const rotated = this.getRotatedGeometry(degree);
      // const rotated = turf.transformScale(rectangle as any, (degree + this.rotateOffset) * 0.1);
      const featureCollection = this.createFeatureCollection([rectangle, rotated]);
      (this.targetMap.map.getSource('tools') as mapboxgl.GeoJSONSource).setData(featureCollection);
    }
  }

  private onMouseUp(mouseEvent: MapMouseEvent) {
    this.targetMap.map.dragPan.enable();

    // Save current rotation
    this.rotateOffset = this.getDegree(mouseEvent);

    this.mouseDownEvent = null;
    this.mouseDown = false;
    this.targetMap.map.getCanvas().style.cursor = 'auto';
  }

  private getDegree(mouseEvent: MapMouseEvent) {
    const currentY = mouseEvent.originalEvent.screenY;
    const firstY = this.mouseDownEvent.originalEvent.screenY;
    const degree = firstY - currentY;
    return degree + this.rotateOffset;
  }

  private clean() {
    (this.targetMap.map.getSource('tools') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: []
    });
  }

  public cancel() {
    this.clean();
  }

  public done() {
    const transformedFEature = this.getRotatedGeometry(this.rotateOffset);
    this.clean();

    this.doneCallback(transformedFEature);
  }

  // On recoit une carte
  public onEditChange(geojson: any, options) {
    // Un chagnement d'outil d'édition a eu lieu, on doit recevoir la/les nouvelles géométries. Conserver le doneCallback et initialiser les outils
  }

  public unRectangle(): Feature {
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-73.58479499816895, 45.52673498746817],
            [-73.5739803314209, 45.52673498746817],
            [-73.5739803314209, 45.53124462813693],
            [-73.58479499816895, 45.53124462813693],
            [-73.58479499816895, 45.52673498746817]
          ]
        ]
      }
    };
  }

  public createFeatureCollection(features: Feature[]): FeatureCollection {
    return {
      type: 'FeatureCollection',
      features
    };
  }
}

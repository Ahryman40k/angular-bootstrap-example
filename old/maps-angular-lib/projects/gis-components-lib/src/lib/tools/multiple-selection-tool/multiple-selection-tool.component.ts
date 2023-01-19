import { Component, OnInit } from '@angular/core';
import { Feature } from 'geojson';
import { MapMouseEvent } from 'mapbox-gl';
import { ITool } from '../../models/tools/tool.model';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

@Component({
  selector: 'vdm-multiple-selection-tool',
  templateUrl: './multiple-selection-tool.component.html',
  styleUrls: ['./multiple-selection-tool.component.css']
})
export class RoadSelectorToolComponent extends MapEventListener implements OnInit, ITool {
  private modeInteraction = 'multiple-selection';
  public showOkCancel = true;
  public toolName: string = 'multipleSelection';
  public isEditTool = false;

  private hoveredLogicalLayerId = {};

  private selectedFeatures: any = {};

  private unselectableFeatures: any = {};

  private itemClickedCallback = null;

  constructor() {
    super();
  }

  public onMapLoaded() {
    this.targetMap.subscribeEvent('mousemove', this.modeInteraction).subscribe((e: any) => this.onMove(e));
    this.targetMap.subscribeEvent('click', this.modeInteraction).subscribe((e: any) => this.onClick(e));
    this.targetMap.subscribeEvent('dblclick', this.modeInteraction).subscribe((e: any) => this.onDoubleClick(e));

    this.targetMap.addTool(this);
  }

  private onMove(mouseEvent: MapMouseEvent) {
    // Choisi un point en prenant en compte la liste des queryableLayers
    const selectionContent = this.targetMap.queryFromPoint(mouseEvent.point);
    this.highlightIdsGroupByLogicalLayer(selectionContent);
  }

  private onDoubleClick(mouseEvent: MapMouseEvent) {
    // Disable double-click to prevent zoom
    this.targetMap.map.doubleClickZoom.disable();
    this.done();
  }

  /**
   * On click, selected features are highlighted.
   * @param mouseEvent
   */
  private onClick(mouseEvent: MapMouseEvent) {
    const changesContent = {
      changes: {},
      currentSelection: {}
    };
    const selectionContent = this.targetMap.queryFromPoint(mouseEvent.point);

    Object.keys(selectionContent).forEach(logicalLayerId => {
      changesContent.changes[logicalLayerId] = {};

      const alreadySelectedFeatures: Feature[] = this.selectedFeatures[logicalLayerId] || [];

      selectionContent[logicalLayerId].forEach(feature => {
        let unselectableFeature: any = null;
        if (this.unselectableFeatures && this.unselectableFeatures[logicalLayerId]) {
          unselectableFeature = this.unselectableFeatures[logicalLayerId].find(
            (unselectable: any) => unselectable.properties.id === feature.properties.id
          );
        }
        if (!unselectableFeature) {
          const featureIndex = alreadySelectedFeatures.findIndex(
            x => x.properties.id.toString() === feature.properties.id.toString()
          );
          if (featureIndex !== -1) {
            // Already selected needs to be unselected
            alreadySelectedFeatures.splice(featureIndex, 1);

            // Populate changes event object
            if (!changesContent.changes[logicalLayerId].deleted) {
              changesContent.changes[logicalLayerId].deleted = [];
            }
            changesContent.changes[logicalLayerId].deleted.push(feature.properties.id.toString());
          } else {
            // Feature isn't selected and must be selected
            alreadySelectedFeatures.push(feature);

            if (!changesContent.changes[logicalLayerId].added) {
              changesContent.changes[logicalLayerId].added = [];
            }
            changesContent.changes[logicalLayerId].added.push(feature.properties.id.toString());
          }
        } else {
          if (!changesContent.changes[logicalLayerId].unselectable) {
            changesContent.changes[logicalLayerId].unselectable = [];
          }
          changesContent.changes[logicalLayerId].unselectable.push(feature.properties.id.toString());
        }
      });

      this.selectedFeatures[logicalLayerId] = alreadySelectedFeatures;
      const toHighlight = alreadySelectedFeatures.map(f => f.properties.id.toString());
      this.targetMap.highlight(logicalLayerId, toHighlight);
    });

    if (this.itemClickedCallback) {
      changesContent.currentSelection = this.selectedFeatures;
      this.itemClickedCallback(changesContent);
    }
  }
  /**
   * Highlight (hover) selection. Remove highlight from previous selection
   * @param selectionContent the selection
   */
  private highlightIdsGroupByLogicalLayer(selectionContent: { [logicalLayerId: string]: Feature[] }) {
    // Detect highlight from previous selection
    const hoveredLogicalLayerId = {};
    Object.keys(this.hoveredLogicalLayerId).forEach(cle => {
      hoveredLogicalLayerId[cle] = 0;
    });

    // Highligh current selection
    Object.keys(selectionContent).forEach(logicalLayerId => {
      const ids = selectionContent[logicalLayerId].map(x => x.properties.id.toString());

      hoveredLogicalLayerId[logicalLayerId] = 1;
      this.targetMap.hover(logicalLayerId, ids);
    });

    // Disable highlight for non-selectied layers
    Object.keys(this.hoveredLogicalLayerId).forEach(logicLayerId => {
      if (hoveredLogicalLayerId[logicLayerId] === 0) {
        this.targetMap.hover(logicLayerId, []);
      }
    });

    this.hoveredLogicalLayerId = hoveredLogicalLayerId;
  }

  /**
   * Remove highlight and hover for all selected features
   */
  private clean() {
    Object.keys(this.selectedFeatures).forEach(logicLayerId => {
      this.targetMap.hover(logicLayerId, []);
      this.targetMap.highlight(logicLayerId, []);
    });

    setTimeout(() => {
      this.targetMap.map.doubleClickZoom.enable();
    }, 0);
  }

  public start(options: any, callback: (e: any) => void) {
    this.doneCallback = callback;

    this.selectedFeatures = {};
    this.targetMap.interactionMode = this.modeInteraction;
    this.targetMap.queryableLayers = options.queryableLayers;
    if (options.preSelectedFeatures) {
      this.selectedFeatures = options.preSelectedFeatures;
      this.highlightSelectedFeatures();
    }
    this.unselectableFeatures = options.unselectableFeatures;
    this.itemClickedCallback = options.itemClickedCallback;
  }

  private highlightSelectedFeatures() {
    for (const layer of this.targetMap.queryableLayers) {
      if (!this.selectedFeatures[layer]) {
        continue;
      }
      const ids = this.selectedFeatures[layer].map(feature => feature.properties.id.toString());
      this.targetMap.highlight(layer, ids);
    }
  }

  public cancel() {
    this.clean();
  }

  public done() {
    const selectedFeatures = this.selectedFeatures;
    this.clean();

    this.doneCallback(selectedFeatures);
  }
}

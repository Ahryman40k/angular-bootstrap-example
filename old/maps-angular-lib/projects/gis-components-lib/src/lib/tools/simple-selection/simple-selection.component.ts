import { Component, OnInit } from '@angular/core';
import { Feature } from 'geojson';
import { MapMouseEvent } from 'mapbox-gl';
import { ITool } from '../../models/tools/tool.model';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

@Component({
  selector: 'vdm-simple-selection',
  templateUrl: './simple-selection.component.html',
  styleUrls: ['./simple-selection.component.css']
})
export class SimpleSelectionComponent extends MapEventListener implements OnInit, ITool {
  private modeInteraction = 'simple-selection';
  public toolName: string = 'simpleSelection';
  public showOkCancel = false;
  public isEditTool = false;

  private highlightOnSelection = true;
  private highlightedLayers: { [logicalLayerId: string]: boolean } = {};

  constructor() {
    super();
  }

  public onMapLoaded() {
    this.targetMap.subscribeEvent('click', this.modeInteraction).subscribe((e: any) => this.onClick(e));
    this.targetMap.addTool(this);
  }

  private onClick(mouseEvent: MapMouseEvent) {
    // TODO: Deselectionner dans les couches d'avant

    // Choisi un point en prenant en compte la liste des queryableLayers
    const selectionContent: { [logicalLayerId: string]: Feature[] } = this.targetMap.selectFromPoint(mouseEvent.point);
    if (this.highlightOnSelection) {
      Object.keys(selectionContent).forEach(logicLayerId => {
        this.targetMap.highlight(logicLayerId, selectionContent[logicLayerId].map(x => x.properties.id.toString()));
        this.highlightedLayers[logicLayerId] = true;
      });
    }
    this.doneCallback(selectionContent);
  }

  public start(options: any, callback: (e: any) => void) {
    this.doneCallback = callback;

    const defaultValues = {
      highlightOnSelection: true,
      queryableLayers: []
    };

    this.targetMap.interactionMode = this.modeInteraction;

    if (options) {
      this.targetMap.queryableLayers = options.queryableLayers || defaultValues.queryableLayers;
      this.highlightOnSelection = options.highlightOnSelection || defaultValues.highlightOnSelection;
    } else {
      // Configuration par défeaut
      this.targetMap.queryableLayers = [];
    }
  }

  /**
   * Remove highlight and hover for all selected features
   */
  private clean() {
    Object.keys(this.highlightedLayers).forEach(logicLayerId => {
      this.targetMap.hover(logicLayerId, []);
      this.targetMap.highlight(logicLayerId, []);
    });
  }

  public cancel() {
    this.clean();
  }

  public done() {
    // Rien à faire lors du done
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { ICheckboxState, ILayerManagerConfig, ILogicLayer, ILogicLayerGroup } from '../models/layer-manager';
import { MapEventListener } from '../shared/component-classes/map-event-listener';

@Component({
  selector: 'vdm-layer-manager',
  templateUrl: './layer-manager.component.html'
})
export class LayerManagerComponent extends MapEventListener implements OnInit {
  @Input() public layerManagerConfig: ILayerManagerConfig;
  public isMapLoaded: boolean = false;
  public isCustomTemplateProvided: boolean = false;
  public theme: string = 'default-theme';
  private availableThemes: string[] = ['default-theme', 'bootstrap-theme'];

  protected onMapLoaded() {
    this.defineTheme();
    this.initLayersVisibilty(this.layerManagerConfig.layerGroups);
    this.targetMap
      .subscribeEvent('zoom')
      .subscribe(() => this.handleLayerStatesAfterMapZoom(this.layerManagerConfig.layerGroups));
    this.isMapLoaded = true;
  }

  /**
   * toggles visibility of a list of logicLayers by calling the map component
   * @param logicLayerIds
   * @param checked
   */
  public toggleLayerVisibility(logicLayerIds: string[], checked: boolean) {
    this.targetMap.setLayerVisibility(logicLayerIds, checked);
  }

  /**
   * Triggers either onToggleLayer if logicalCorrespondance in the event is a layer or a group if it's a group
   * @param event
   */
  public handleToggleEvent(event: ICheckboxState) {
    if (event.logicalCorrespondance.hasOwnProperty('logicLayerId')) {
      this.onToggleLayer(event.checked, event.logicalCorrespondance as ILogicLayer);
    } else {
      this.onToggleLayerGroup(event.checked, event.logicalCorrespondance as ILogicLayerGroup);
    }
  }

  /**
   * toggles visibility of a single logic layer calling toggleLayerVisibility()
   * @param checked
   * @param logicLayer
   */
  public onToggleLayer(checked: boolean, logicLayer: ILogicLayer): void {
    logicLayer.isChecked = checked;
    this.toggleLayerVisibility([logicLayer.logicLayerId], checked);
  }

  /**
   * Handles toggle group
   * @param  $event
   */
  public onToggleLayerGroup(checked: boolean, group: ILogicLayerGroup): void {
    group.isChecked = checked;
    if (group.hasOwnProperty('layerGroups') && group.layerGroups.length > 0) {
      this.handleLayerGroups(group.layerGroups, checked, group);
    }
    if (group.hasOwnProperty('layers') && group.layers.length > 0) {
      this.handleLogicLayers(group.layers, checked, group);
    }
  }

  private defineTheme(): void {
    if (
      this.layerManagerConfig.hasOwnProperty('theme') &&
      this.availableThemes.indexOf(this.layerManagerConfig.theme) > 0
    ) {
      this.theme = this.layerManagerConfig.theme;
    }
  }

  /**
   * Handles recursive loops through layer groups
   * @param layerGroups
   * @param checked
   * @param isParentGroupChecked
   */
  private handleLayerGroups(layerGroups: ILogicLayerGroup[], checked: boolean, parentGroup: ILogicLayerGroup): void {
    for (const group of layerGroups) {
      this.determineGroupIsActive(group, parentGroup);
      if (group.hasOwnProperty('layerGroups') && group.layerGroups.length > 0) {
        this.handleLayerGroups(group.layerGroups, checked, group);
      }
      if (group.hasOwnProperty('layers') && group.layers.length > 0) {
        this.handleLogicLayers(group.layers, checked, group);
      }
    }
  }

  /**
   * Loops and handles layer logics
   * @param layers
   * @param checked
   * @param isParentGroupChecked
   */
  private handleLogicLayers(layers: ILogicLayer[], checked: boolean, parentGroup: ILogicLayerGroup): void {
    const logicLayerIds: string[] = [];
    for (const layer of layers) {
      this.determineLayerIsActive(layer, parentGroup);
      // pushes or not layers to be shown or hidden
      const caseChecked: boolean = checked && parentGroup.isChecked && layer.isActive && layer.isChecked;
      const caseUnChecked: boolean = !checked;
      if (caseChecked || caseUnChecked) {
        logicLayerIds.push(layer.logicLayerId);
      }
    }
    this.toggleLayerVisibility(logicLayerIds, checked);
  }

  /**
   * inits layers visibility
   *
   * @param groups array of layerGroups
   */
  private initLayersVisibilty(groups: ILogicLayerGroup[]) {
    // recursive loop
    for (const group of groups) {
      group.isChecked = true;
      if (group.hasOwnProperty('layerGroups') && group.layerGroups.length > 0) {
        this.initLayersVisibilty(group.layerGroups);
      }
      if (group.hasOwnProperty('layers') && group.layers.length > 0) {
        for (const layer of group.layers) {
          // patches new property to logic layer to determine either it's visible or not
          layer.isChecked = this.targetMap.isLogicLayerVisible(layer.logicLayerId);
          layer.zoomRange = this.targetMap.determineLogicLayerZoomRange(layer.logicLayerId);
          this.determineLayerIsActive(layer, group);
        }
      }
      this.determineGroupIsActive(group);
    }
  }

  /**
   * determines if groups and layers are actives or not, checking layer's zoom config
   * @param groups: ILogicLayerGroup[]
   */
  private handleLayerStatesAfterMapZoom(groups: ILogicLayerGroup[]) {
    // recursive loop
    for (const group of groups) {
      if (group.hasOwnProperty('layerGroups') && group.layerGroups.length > 0) {
        this.handleLayerStatesAfterMapZoom(group.layerGroups);
      }
      if (group.hasOwnProperty('layers') && group.layers.length > 0) {
        for (const layer of group.layers) {
          this.determineLayerIsActive(layer, group);
        }
      }
      this.handleGroupStates(group);
    }
  }

  /**
   * Triggered when group is clicked and determines if group should be active or not
   * @param group
   */
  private handleGroupStates(group: ILogicLayerGroup, parentGroup?: ILogicLayerGroup): void {
    this.determineGroupIsActive(group, parentGroup);
    if (group.hasOwnProperty('layerGroups') && group.layerGroups.length > 0) {
      for (const grp of group.layerGroups) {
        this.handleGroupStates(grp, group);
      }
    }
  }

  /**
   * determines if a layer is active
   * @param layer
   * @param parentGroup
   */
  private determineLayerIsActive(layer: ILogicLayer, parentGroup: ILogicLayerGroup): void {
    const isLayerVisibleAtZoom: boolean = this.targetMap.isLayerVisibleAtCurrentZoom(layer.zoomRange);
    layer.isActive = parentGroup.isChecked && parentGroup.isActive && isLayerVisibleAtZoom;
    this.targetMap.setLayerVisibility([layer.logicLayerId], layer.isChecked && layer.isActive);
  }

  /**
   * determines if a group is active
   * @param layerGroup
   * @param parentGroup?
   */
  private determineGroupIsActive(layerGroup: ILogicLayerGroup, parentGroup?: ILogicLayerGroup): void {
    const hasLayers: boolean = layerGroup.hasOwnProperty('layers') && layerGroup.layers.length > 0;
    const hasLayerGroups: boolean = layerGroup.hasOwnProperty('layerGroups') && layerGroup.layerGroups.length > 0;

    if (parentGroup && (!parentGroup.isChecked || !parentGroup.isActive)) {
      layerGroup.isActive = false;
      return;
    }
    if (hasLayers && !hasLayerGroups) {
      layerGroup.isActive = layerGroup.layers.some((layer: ILogicLayer) => {
        return layer.isActive || this.targetMap.isLayerVisibleAtCurrentZoom(layer.zoomRange);
      });
    }
    if (hasLayerGroups && !hasLayers) {
      layerGroup.isActive = layerGroup.layerGroups.some((gp: ILogicLayerGroup) => gp.isActive);
    }
    if (hasLayerGroups && hasLayers) {
      layerGroup.isActive =
        layerGroup.layers.some((layer: ILogicLayer) => {
          return layer.isActive || this.targetMap.isLayerVisibleAtCurrentZoom(layer.zoomRange);
        }) || layerGroup.layerGroups.some((gp: ILogicLayerGroup) => gp.isActive);
    }
  }
}

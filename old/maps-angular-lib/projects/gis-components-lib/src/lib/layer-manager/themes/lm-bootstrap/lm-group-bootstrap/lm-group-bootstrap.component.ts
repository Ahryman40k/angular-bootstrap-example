import { Component, Input, OnInit } from '@angular/core';
import { ILogicLayer, ILogicLayerGroup } from '../../../../models/layer-manager/layer-manager';
import { LayerGroupBase } from '../../../layer-group-base';

const REGEX: RegExp = /[^A-Za-z0-9]/g;

@Component({
  selector: 'vdm-lm-group-bootstrap',
  templateUrl: './lm-group-bootstrap.component.html',
  styleUrls: ['./lm-group-bootstrap.component.css']
})
export class LmGroupBootstrapComponent extends LayerGroupBase implements OnInit {
  @Input() public isSuperGroup: boolean;
  public dataTarget: string;
  public dataAriaControl: string;
  public idAttr: string;
  public isCollapsed: boolean = false;

  public ngOnInit() {
    this.defineAttributes();
  }

  /**
   * prevent group to callapse if only checkbox is clicked
   * @param $event
   */
  public onPreventCollapsing($event: any) {
    this.layerGroup.isChecked = !this.layerGroup.isChecked;
    $event.stopPropagation();
  }

  /**
   * determines checkbox classes by checking group or layer states in order to apply specific styles
   * @param layerOrGroup ILogicLayer | ILogicLayerGroup
   */
  public onDetermineCheckClasses(layerOrGroup: ILogicLayer | ILogicLayerGroup): string {
    let classes: string = 'checkbox-container';
    if (layerOrGroup.isActive && layerOrGroup.isChecked) {
      classes = classes + ' enabled-checked';
    }
    if (!layerOrGroup.isActive && layerOrGroup.isChecked) {
      classes = classes + ' disabled-checked';
    }
    if (layerOrGroup.isActive && !layerOrGroup.isChecked) {
      classes = classes + ' enabled-unchecked';
    }
    if (!layerOrGroup.isActive && !layerOrGroup.isChecked) {
      classes = classes + ' disabled-unchecked';
    }
    return classes;
  }

  /**
   * determines group label classes by checking group or layer states in order to apply specific styles
   * @param group ILogicLayerGroup
   */
  public onDetermineGroupLabelClasses(group: ILogicLayerGroup): string {
    if (group.isActive && this.isSuperGroup) {
      return 'label-active bold-label';
    }
    if (!group.isActive && this.isSuperGroup) {
      return 'label-inactive bold-label';
    }
    if (group.isActive && !this.isSuperGroup) {
      return 'label-active';
    }
    if (!group.isActive && !this.isSuperGroup) {
      return 'label-inactive';
    }
  }

  /**
   * determines attributes in order to make bootstrap collapsible work
   */
  private defineAttributes(): void {
    this.idAttr = this.generateIdAttr();
    this.dataTarget = `#${this.idAttr}`;
    this.dataAriaControl = this.idAttr;
  }

  /**
   * Generate uniq id
   */
  private generateIdAttr(): string {
    let idAttr: string = `${this.layerGroup.label.replace(REGEX, '')}-${Math.round(Math.random() * 10000)}`;
    if (this.isIdAlreadyTaken(idAttr)) {
      idAttr = this.generateIdAttr();
    }
    return idAttr;
  }

  /**
   * Check if id already exists
   * @param idAttr string
   */
  private isIdAlreadyTaken(idAttr: string): boolean {
    return document.querySelectorAll(`#${idAttr}`).length > 0;
  }
}

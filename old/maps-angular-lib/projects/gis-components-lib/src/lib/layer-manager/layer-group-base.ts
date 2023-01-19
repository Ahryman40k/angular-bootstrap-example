import { EventEmitter, Input, Output } from '@angular/core';
import { ICheckboxState, ILogicLayer, ILogicLayerGroup } from '../models/layer-manager';

export abstract class LayerGroupBase {
  @Input() public layerGroup: ILogicLayerGroup;
  @Output() public toggle: EventEmitter<ICheckboxState> = new EventEmitter<ICheckboxState>();

  /**
   * Sends event to layerManager
   * @param  checked
   * @param  logicalCorrespondance
   */
  public onToggle(checked: boolean, logicalCorrespondance: ILogicLayer | ILogicLayerGroup) {
    this.toggle.next({ checked, logicalCorrespondance });
  }
}

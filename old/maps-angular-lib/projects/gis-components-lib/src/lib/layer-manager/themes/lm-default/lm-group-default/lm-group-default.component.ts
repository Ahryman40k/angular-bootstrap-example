import { Component } from '@angular/core';
import { LayerGroupBase } from '../../../layer-group-base';

@Component({
  selector: 'vdm-lm-group-default',
  templateUrl: './lm-group-default.component.html',
  styleUrls: ['./lm-group-default.component.css']
})
export class LmGroupDefaultComponent extends LayerGroupBase {
  /**
   * Determines whether collapse on
   * @param $event
   */
  public onCollapse($event): void {
    const el = $event.target;
    for (const e of $event.target.parentElement.parentElement.children) {
      if (e.nodeName === 'LI') {
        e.classList.toggle('active');
      }
    }
    el.classList.toggle('caret-down');
  }
}

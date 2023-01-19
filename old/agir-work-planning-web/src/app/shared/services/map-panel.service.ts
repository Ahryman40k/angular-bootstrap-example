import { Injectable } from '@angular/core';
import { MapLeftPanelSubPanelComponent } from 'src/app/map/panel/left-panel-sub-panel/left-panel-sub-panel.component';

import { MapLeftPanelComponent } from '../../map/panel/left-panel/map-left-panel.component';

@Injectable({
  providedIn: 'root'
})
export class MapPanelService {
  public mapLeftPanelComponent: MapLeftPanelComponent;
  public mapLeftPanelSubPanelComponent: MapLeftPanelSubPanelComponent;

  public get leftPanelShown(): boolean {
    return this.mapLeftPanelComponent?.shown || false;
  }

  public get isLeftPanelLarger(): boolean {
    return this.mapLeftPanelComponent?.isPanelLarger;
  }

  public get leftPanelSubPanelShown(): boolean {
    return this.mapLeftPanelSubPanelComponent?.shown || false;
  }
}

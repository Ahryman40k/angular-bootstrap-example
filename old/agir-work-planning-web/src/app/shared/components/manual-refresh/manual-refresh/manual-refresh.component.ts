import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { MapDataService } from 'src/app/shared/services/map-data.service';

@Component({
  selector: 'app-manual-refresh',
  templateUrl: './manual-refresh.component.html',
  styleUrls: ['./manual-refresh.component.scss']
})
export class ManualRefreshComponent {
  constructor(private readonly mapDataService: MapDataService) {}

  public refreshMap() {
    this.mapDataService.refresh();
  }

  public get canRefresh(): boolean {
    return this.mapDataService.canRefresh;
  }
}

import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { MapDataService } from 'src/app/shared/services/map-data.service';

@Component({
  selector: 'app-last-refresh',
  templateUrl: './last-refresh.component.html',
  styleUrls: ['./last-refresh.component.scss']
})
export class LastRefreshComponent {
  constructor(private readonly mapDataService: MapDataService) {}

  public get lastRefresh$(): Observable<Date> {
    return this.mapDataService.lastRefresh$;
  }
}

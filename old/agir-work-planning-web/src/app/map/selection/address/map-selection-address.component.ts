import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { IAddressFull } from 'src/app/shared/models/location/address-full';
import { LocationService } from 'src/app/shared/services/location.service';
import { MapService } from 'src/app/shared/services/map.service';
import { SearchObjectsService } from 'src/app/shared/services/search-objects.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';

import { MapHighlightService } from '../../../shared/services/map-highlight/map-highlight.service';
import { MapSourceId, MapSourceService } from '../../../shared/services/map-source.service';
import { BaseMapSelectionComponent } from '../base-map-selection.component';

@Component({
  selector: 'app-map-selection-address',
  templateUrl: './map-selection-address.component.html'
})
export class MapSelectionAddressComponent extends BaseMapSelectionComponent implements OnInit, OnDestroy {
  public address$: Observable<IAddressFull>;
  public address: IAddressFull;

  constructor(
    private readonly locationService: LocationService,
    private readonly route: ActivatedRoute,
    private readonly mapSourceService: MapSourceService,
    private readonly mapHighlightService: MapHighlightService,
    mapService: MapService,
    spatialAnalysisService: SpatialAnalysisService,
    searchObjectsService: SearchObjectsService
  ) {
    super(mapService, spatialAnalysisService, searchObjectsService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.address$ = combineLatest(this.route.params, this.mapService.mapLoaded$).pipe(
      takeUntil(this.destroy$),
      tap(() => this.destroyAddress()),
      switchMap(([params]) => this.locationService.getAddress(params.addressId)),
      tap(address => this.initFromAddress(address)),
      shareReplay()
    );
    this.address$.subscribe();
  }

  private initFromAddress(address: IAddressFull): void {
    this.address = address;
    const addressFeature = this.locationService.getAddressFeature(address);
    this.initGeometry(addressFeature.geometry);
    this.mapSourceService.setSource(MapSourceId.addressesPins, [addressFeature]);
    this.mapHighlightService.highlight(address);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyAddress();
  }

  private destroyAddress(): void {
    if (!this.address) {
      return;
    }
    this.mapSourceService.setSource(MapSourceId.addressesPins, []);
    this.mapHighlightService.unhighlight(this.address);
  }
}

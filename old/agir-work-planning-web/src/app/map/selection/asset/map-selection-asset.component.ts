import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IAsset, IGeometry, IGeometryType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { shareReplay, switchMap, tap } from 'rxjs/operators';
import { AssetService } from 'src/app/shared/services/asset.service';
import { MapHighlightService } from 'src/app/shared/services/map-highlight/map-highlight.service';
import { MapService } from 'src/app/shared/services/map.service';
import { SearchObjectsService } from 'src/app/shared/services/search-objects.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';

import { mapZoom } from '../../config/layers/styles';
import { BaseMapSelectionComponent } from '../base-map-selection.component';

@Component({
  selector: 'app-map-selection-asset',
  templateUrl: 'map-selection-asset.component.html'
})
export class MapSelectionAssetComponent extends BaseMapSelectionComponent implements OnInit, OnDestroy {
  public asset$: Observable<IAsset>;
  public asset: IAsset;

  constructor(
    private readonly assetService: AssetService,
    private readonly route: ActivatedRoute,
    mapService: MapService,
    spatialAnalysisService: SpatialAnalysisService,
    searchObjectsService: SearchObjectsService,
    private readonly mapHighlightService: MapHighlightService
  ) {
    super(mapService, spatialAnalysisService, searchObjectsService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.asset$ = this.route.params.pipe(
      tap(() => this.destroyAsset()),
      switchMap(params => this.assetService.get(params.assetType, params.assetId)),
      tap(asset => this.initFromAsset(asset)),
      shareReplay()
    );
    this.asset$.subscribe();
  }

  private initFromAsset(asset: IAsset): void {
    this.asset = asset;
    if (asset?.geometry) {
      this.initZoomForSelection(asset.geometry);
    }

    this.mapHighlightService.highlight(this.asset);
  }

  private initZoomForSelection(geometry: IGeometry): void {
    let tempGeometry: IGeometry = geometry;

    if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
      const boxPoly = bboxPolygon(bbox(geometry));
      tempGeometry = {
        type: boxPoly.geometry.type as IGeometryType,
        coordinates: (boxPoly.geometry as IGeometry).coordinates
      } as IGeometry;
    }

    // If asset is oversize we want to 'work' only with the part that we currently see in the current view
    if (this.mapService.isOverSizedFeature(geometry)) {
      const intersectGeometry = this.mapService.getIntersectionFeature(geometry)?.geometry as IGeometry;
      if (intersectGeometry) {
        tempGeometry = intersectGeometry;
      }
    }
    this.initGeometry(tempGeometry);
    this.mapService.goToGeometryCenter(tempGeometry, mapZoom.assetsZoom);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyAsset();
  }

  private destroyAsset(): void {
    if (!this.asset) {
      return;
    }
    this.mapHighlightService.unhighlight(this.asset);
    this.asset = null;
  }
}

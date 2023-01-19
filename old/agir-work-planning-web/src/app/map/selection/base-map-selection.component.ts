import { OnInit } from '@angular/core';
import { IGeometry, IPoint3D } from '@villemontreal/agir-work-planning-lib/dist/src';
import { LngLat } from 'mapbox-gl';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { FitZoomToGeometryPadding, MapService } from 'src/app/shared/services/map.service';
import { SearchObjectsService } from 'src/app/shared/services/search-objects.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';
import { mapZoom } from '../config/layers/styles';

export abstract class BaseMapSelectionComponent extends BaseComponent implements OnInit {
  public point: LngLat;

  constructor(
    protected mapService: MapService,
    protected spatialAnalysisService: SpatialAnalysisService,
    protected searchObjectsService: SearchObjectsService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.searchObjectsService.setTerm('');
  }

  protected initGeometry(geometry: IGeometry): void {
    const [lng, lat] = this.spatialAnalysisService.nearestCentroid(geometry).coordinates as IPoint3D;
    this.point = new LngLat(lng, lat);

    this.mapService.fitZoomToGeometry(geometry, FitZoomToGeometryPadding.LARGE, true, mapZoom.assetsZoom);
  }
}

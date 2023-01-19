import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';

import { MapHighlightService } from '../../../shared/services/map-highlight/map-highlight.service';
import { MapService } from '../../../shared/services/map.service';
import { RtuProjectService } from '../../../shared/services/rtu-project.service';
import { SearchObjectsService } from '../../../shared/services/search-objects.service';
import { SpatialAnalysisService } from '../../../shared/services/spatial-analysis.service';
import { BaseMapSelectionComponent } from '../base-map-selection.component';

@Component({
  selector: 'app-map-selection-rtu-project',
  templateUrl: './map-selection-rtu-project.component.html'
})
export class MapSelectionRtuProjectComponent extends BaseMapSelectionComponent implements OnInit, OnDestroy {
  public rtuProject$: Observable<IRtuProject>;
  public rtuProject: IRtuProject;

  constructor(
    private readonly rtuProjectService: RtuProjectService,
    private readonly route: ActivatedRoute,
    private readonly mapHighlightService: MapHighlightService,
    mapService: MapService,
    spatialAnalysisService: SpatialAnalysisService,
    searchObjectsService: SearchObjectsService
  ) {
    super(mapService, spatialAnalysisService, searchObjectsService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    if (this.mapService.bottomPanel.isOpened) {
      this.mapService.toggleBottomPanel(false);
    }
    this.rtuProject$ = this.route.params.pipe(
      takeUntil(this.destroy$),
      tap(() => this.destroyRtuProject()),
      switchMap(params => this.rtuProjectService.getRtuProject(params.rtuProjectId)),
      tap(rtuProject => this.initRtuProject(rtuProject)),
      shareReplay()
    );
    this.rtuProject$.subscribe();
  }

  private initRtuProject(rtuProject: IRtuProject): void {
    this.rtuProject = rtuProject;
    if (rtuProject.geometry) {
      this.initGeometry(rtuProject.geometry);
      this.mapHighlightService.highlight(this.rtuProject);
    }
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyRtuProject();
  }

  private destroyRtuProject(): void {
    if (!this.rtuProject) {
      return;
    }
    this.mapHighlightService.unhighlight(this.rtuProject);
  }
}

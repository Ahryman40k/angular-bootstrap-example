import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IEnrichedProject, ProjectType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest, Observable } from 'rxjs';
import { shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MapHighlightService } from 'src/app/shared/services/map-highlight/map-highlight.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SearchObjectsService } from 'src/app/shared/services/search-objects.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';

import { RouteService } from '../../../shared/services/route.service';
import { BaseMapSelectionComponent } from '../base-map-selection.component';

@Component({
  selector: 'app-map-selection-project',
  templateUrl: 'map-selection-project.component.html'
})
export class MapSelectionProjectComponent extends BaseMapSelectionComponent implements OnInit, OnDestroy {
  public project$: Observable<IEnrichedProject>;
  public project: IEnrichedProject;

  constructor(
    private readonly projectService: ProjectService,
    private readonly route: ActivatedRoute,
    private readonly mapHighlightService: MapHighlightService,
    private readonly routeService: RouteService,
    mapService: MapService,
    spatialAnalysisService: SpatialAnalysisService,
    searchObjectsService: SearchObjectsService
  ) {
    super(mapService, spatialAnalysisService, searchObjectsService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.project$ = combineLatest(this.route.params, this.projectService.projectChanged$.pipe(startWith(null))).pipe(
      takeUntil(this.destroy$),
      tap(() => this.destroyProject()),
      switchMap(([params]) => {
        return params.projectType === ProjectType.nonIntegrated
          ? this.projectService.getFullProject(params.projectId)
          : this.projectService.getProjectWithOutIntervention(params.projectId);
      }),
      tap(project => {
        this.initProject(project);
        this.initBottomPanel();
      }),
      shareReplay()
    );
    this.project$.subscribe();
    this.initProjectsDisable();
  }

  public initProjectsDisable(): void {
    this.projectService.projectsShown$.pipe(takeUntil(this.destroy$)).subscribe(shown => {
      if (!shown) {
        void this.routeService.clearOutlet('rightPanel');
      }
    });
  }

  private initProject(project: IEnrichedProject): void {
    this.project = project;
    if (project.geometry) {
      this.initGeometry(project.geometry);
      this.mapHighlightService.highlight(this.project);
    }
  }

  private initBottomPanel(): void {
    if (this.mapService.bottomPanel.isOpened) {
      this.mapService.toggleBottomPanel(true, this.project.geometry);
    }
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyProject();
  }

  private destroyProject(): void {
    if (!this.project) {
      return;
    }
    this.mapHighlightService.unhighlight(this.project);
  }
}

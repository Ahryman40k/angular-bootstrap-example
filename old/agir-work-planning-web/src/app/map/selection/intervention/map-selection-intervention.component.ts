import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest, Observable } from 'rxjs';
import { shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { SearchObjectsService } from 'src/app/shared/services/search-objects.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';

import { MapHighlightService } from '../../../shared/services/map-highlight/map-highlight.service';
import { RouteService } from '../../../shared/services/route.service';
import { BaseMapSelectionComponent } from '../base-map-selection.component';

@Component({
  selector: 'app-map-selection-intervention',
  templateUrl: 'map-selection-intervention.component.html'
})
export class MapSelectionInterventionComponent extends BaseMapSelectionComponent implements OnInit, OnDestroy {
  public intervention$: Observable<IEnrichedIntervention>;
  public intervention: IEnrichedIntervention;

  constructor(
    private readonly interventionService: InterventionService,
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
    this.initIntervention();
    this.initInterventionsDisable();
  }

  private initIntervention(): void {
    this.intervention$ = combineLatest(
      this.route.params,
      this.interventionService.interventionChanged$.pipe(startWith(null))
    ).pipe(
      takeUntil(this.destroy$),
      tap(() => this.destroyIntervention()),
      switchMap(([params]) => this.interventionService.getIntervention(params.interventionId)),
      tap((intervention: IEnrichedIntervention) => {
        this.initFromIntervention(intervention);
        this.initBottomPanel();
      }),
      shareReplay()
    );
    this.intervention$.subscribe();
  }

  public initInterventionsDisable(): void {
    this.interventionService.interventionsShown$.pipe(takeUntil(this.destroy$)).subscribe(shown => {
      if (!shown) {
        void this.routeService.clearOutlet('rightPanel');
      }
    });
  }

  private initBottomPanel(): void {
    if (this.mapService.bottomPanel.isOpened) {
      this.mapService.toggleBottomPanel(true, this.intervention.interventionArea.geometry);
    }
  }

  private initFromIntervention(intervention: IEnrichedIntervention): void {
    this.intervention = intervention;
    this.initGeometry(intervention.interventionArea.geometry);
    this.mapHighlightService.highlight(this.intervention);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyIntervention();
  }

  private destroyIntervention(): void {
    if (!this.intervention) {
      return;
    }
    this.mapHighlightService.unhighlight(this.intervention);
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { mapRtuProjectAreaLayerIds } from '../../map/config/layers/logic-layers/projects/map-project-area-layer-ids';
import { mapRtuProjectAreaLogicLayers } from '../../map/config/layers/logic-layers/projects/map-rtu-project-area-logic-layers';
import { mapRtuProjectPinLogicLayers } from '../../map/config/layers/logic-layers/projects/map-rtu-project-pin-logic-layers';
import { MapComponent } from '../../map/map.component';
import { BrowserWindowService } from '../../shared/services/browser-window.service';
import { MapService } from '../../shared/services/map.service';
import { ProjectService } from '../../shared/services/project.service';
import { RtuProjectService } from '../../shared/services/rtu-project.service';
import { WindowService } from '../../shared/services/window.service';
import { BaseDetailsComponent } from '../base-details-component';

@Component({
  selector: 'app-rtu-project-details',
  templateUrl: './rtu-project-details.component.html',
  styleUrls: ['./rtu-project-details.component.scss'],
  providers: [WindowService]
})
export class RtuProjectDetailsComponent extends BaseDetailsComponent implements OnInit {
  public mapInitialized = false;
  @ViewChild('map') public map: MapComponent;

  public get mapShown(): boolean {
    return !!this.rtuProject && this.mapInitialized && !!this.rtuProject.geometry;
  }

  public get rtuProjectStartYear(): number {
    return new Date(this.rtuProject.dateStart).getFullYear();
  }

  public get rtuProjectEndYear(): number {
    return new Date(this.rtuProject.dateEnd).getFullYear();
  }

  constructor(
    public windowService: WindowService,
    activatedRoute: ActivatedRoute,
    private readonly mapService: MapService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly projectService: ProjectService,
    private readonly browserWindowService: BrowserWindowService,
    private readonly router: Router
  ) {
    super(windowService, activatedRoute);
  }

  public ngOnInit(): void {
    this.activatedRoute.params.subscribe(async params => {
      await this.windowService.setRtuProject(params.id);
    });

    combineLatest(
      this.windowService.rtuProject$.pipe(takeUntil(this.destroy$)),
      this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$))
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([rtuProject]) => {
        if (!rtuProject) {
          return;
        }
        this.projectService.fromYearChanged$.subscribe(() => this.onFromYearChange());
        await this.setRtuProjectSource();
        const currentRtuProject = this.windowService.currentRtuProject;
        if (currentRtuProject?.geometry) {
          this.mapService.fitZoomToGeometry(currentRtuProject.geometry);
        }
        this.mapInitialized = true;
      });
  }

  private async setRtuProjectSource(): Promise<void> {
    await this.mapService.setLayerVisibility(mapRtuProjectAreaLogicLayers, true);
    await this.mapService.setLayerVisibility(mapRtuProjectPinLogicLayers, false);
    this.mapService.setLayersZoomRange(mapRtuProjectAreaLayerIds, 0);
    this.map.dataService.setRtuProjects(of([this.rtuProject]));
  }

  private onFromYearChange(): void {
    this.map.dataService.setRtuProjects(of([this.rtuProject]));
  }

  public close(): void {
    if (!this.browserWindowService.close()) {
      void this.router.navigate(['/']);
    }
  }
}

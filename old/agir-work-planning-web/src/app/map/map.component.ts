import { Component, ElementRef, Injector, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMapConfig, MapComponent as LibMapComponent } from '@villemontreal/maps-angular-lib';
import { LngLat, Map, NavigationControl } from 'mapbox-gl';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../shared/components/base/base.component';
import { ContextualMenuComponent } from '../shared/components/contextual-menu/contextual-menu.component';
import { LastRefreshControl } from '../shared/map-controls/last-refresh-control';
import { ManualRefreshControl } from '../shared/map-controls/manual-refresh-control';
import { DynamicComponentService } from '../shared/services/dynamic-component.service';
import { GlobalFilterService } from '../shared/services/filters/global-filter.service';
import { GlobalLayerService } from '../shared/services/global-layer.service';
import { MapConfigService } from '../shared/services/map-config.service';
import { MapDataService } from '../shared/services/map-data.service';
import { MapHighlightService } from '../shared/services/map-highlight/map-highlight.service';
import { MapHoverService } from '../shared/services/map-hover/map-hover.service';
import { MapNavigationService, MapOutlet } from '../shared/services/map-navigation.service';
import { MapPanelService } from '../shared/services/map-panel.service';
import { MapPopupService } from '../shared/services/map-popup.service';
import { MapRoadSectionHoverService } from '../shared/services/map-road-selection-hover.service';
import { MapSelectionService } from '../shared/services/map-selection.service';
import { MapSourceService } from '../shared/services/map-source.service';
import { MapToolService } from '../shared/services/map-tool.service';
import { MapService } from '../shared/services/map.service';
import { MapLeftPanelComponent } from './panel/left-panel/map-left-panel.component';
import { RightClickMapTool } from './tools/right-click.map-tool';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [
    MapHighlightService,
    MapRoadSectionHoverService,
    MapNavigationService,
    MapPopupService,
    MapSelectionService,
    MapSourceService,
    MapToolService
  ]
})
export class MapComponent extends BaseComponent implements OnInit, OnDestroy {
  private interventionCreateLatLng: LngLat;
  private contextualMenuTool: RightClickMapTool;
  private _contextualMenuEnabled = false;
  private initialized = false;

  public mapConfig: IMapConfig;
  public _map: LibMapComponent;

  @Input() public withPanelMenu = true;
  @Input() public withPanel = true;
  @Input() public withRightPanel = true;
  @Input() public withManualRefresh = false;
  @Input() public withNonGeolocatedProjectsPanel = true;
  @Input() public withPlanningBook = true;
  @Input() public withProjects = true;
  @Input() public withInterventions = true;
  @Input() public withRtuProjects = true;
  @Input() public initZoom: number;
  @Input() public popupsEnabled = true;
  @Input() public disabledPopups = [];
  @Input() public disabled = false;
  @Input() public isLoading = false;

  @ViewChild('mapContextualMenu') public mapContextualMenu: ContextualMenuComponent;
  @ViewChild('mapLeftPanelMenu', { read: ElementRef }) public mapLeftPanelMenu: ElementRef<HTMLElement>;
  @ViewChild('mapLeftPanel', { read: ElementRef }) public mapLeftPanel: ElementRef<HTMLElement>;
  @ViewChild('mapLeftPanel') public mapLeftPanelComponent: MapLeftPanelComponent;
  @ViewChild('mapLeftPanelSubPanel', { read: ElementRef }) public mapLeftPanelSubPanel: ElementRef<HTMLElement>;
  @ViewChild('mapRightPanel', { read: ElementRef }) public mapRightPanel: ElementRef<HTMLElement>;

  public get map(): LibMapComponent {
    return this._map;
  }
  @ViewChild('map')
  public set map(v: LibMapComponent) {
    if (this.initialized || !v) {
      return;
    }
    this._map = v;
    this.init(v);
  }

  public get contextualMenuEnabled(): boolean {
    return this._contextualMenuEnabled;
  }
  @Input()
  public set contextualMenuEnabled(v: boolean) {
    this._contextualMenuEnabled = v;
    if (!this.contextualMenuTool) {
      return;
    }
    if (this._contextualMenuEnabled) {
      this.contextualMenuTool.activate();
    } else {
      this.contextualMenuTool.deactivate();
    }
  }

  @Input() public withCountByBorough: boolean;
  @Input() public withCountByCity: boolean;

  public get interventionCreateLink(): string {
    if (!this.interventionCreateLatLng) {
      return null;
    }
    return `window/interventions/create;lat=${this.interventionCreateLatLng.lat};lng=${this.interventionCreateLatLng.lng}`;
  }

  public get isLeftPanelFullSize(): boolean {
    return this.mapLeftPanelComponent ? this.mapLeftPanelComponent.isFullSize : false;
  }

  public get isMapLoading$(): Observable<boolean> {
    return this.dataService.isMapLoading$;
  }

  public get paddingLeft(): number {
    let padding = 0;
    padding += this.mapLeftPanelMenu?.nativeElement.offsetWidth || 0;
    padding += this.mapLeftPanel?.nativeElement.offsetWidth || 0;
    padding += this.mapLeftPanelSubPanel?.nativeElement.offsetWidth || 0;
    return padding;
  }

  public get paddingRight(): number {
    let padding = 0;
    padding += this.mapRightPanel?.nativeElement.offsetWidth || 0;
    return padding;
  }

  public get mapBoxInstance(): Map {
    return this.map?.map;
  }

  public constructor(
    public dataService: MapDataService,
    private readonly dynamicComponentService: DynamicComponentService,
    public highlightService: MapHighlightService,
    public hoverService: MapHoverService,
    public mapPanelService: MapPanelService,
    public mapService: MapService,
    public popupService: MapPopupService,
    public route: ActivatedRoute,
    public selectionService: MapSelectionService,
    public sourceService: MapSourceService,
    public toolService: MapToolService,
    public readonly roadSectionhoverService: MapRoadSectionHoverService,
    private readonly mapConfigService: MapConfigService,
    public mapNavigationService: MapNavigationService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly injector: Injector,
    private readonly globalLayerService: GlobalLayerService
  ) {
    super();
    route.data.subscribe(data => Object.assign(this, data));
    this.mapNavigationService.route = route;
  }

  public async ngOnInit(): Promise<void> {
    this.initNavigations();
    this.mapService.bottomPanelSubject.next({ isOpened: false });
    this.mapConfig = await this.mapConfigService.getMapConfig();
    this.dataService.projectsDisabled = !this.withProjects;
    this.dataService.rtuProjectsDisabled = !this.withRtuProjects;
    this.dataService.interventionsDisabled = !this.withInterventions;
    this.dataService.countByBoroughDisabled = !this.withCountByBorough;
    this.dataService.countByCityDisabled = !this.withCountByCity;

    if (!isNaN(this.initZoom)) {
      this.mapConfig.mapOptions.zoom = this.initZoom;
    }

    this.globalFilterService.resetFilter();
    this.globalLayerService.clearLayers();
  }

  public init(map: LibMapComponent): void {
    this.initialized = true;
    this.highlightService.configureMapHighlightFunction(map);
    this.mapService.map = map;
    this.mapService.mapComponent = this;
    this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => this.initMap());
  }

  private async initMap(): Promise<void> {
    const bottomLeft = 'bottom-left';
    if (this.withManualRefresh) {
      // we should use the same instance of MapDataService in all components related to the map
      this.map.map.addControl(new LastRefreshControl(this.dynamicComponentService, this.injector), bottomLeft);
      this.map.map.addControl(new NavigationControl({ showCompass: false }), bottomLeft);
      this.map.map.addControl(new ManualRefreshControl(this.dynamicComponentService, this.injector), bottomLeft);
    } else {
      this.map.map.addControl(new NavigationControl({ showCompass: false }), bottomLeft);
    }

    this.selectionService.init(this);
    await this.popupService.init(this.map, this.popupsEnabled, this.disabledPopups);
    this.toolService.init(this);
    this.roadSectionhoverService.init(this.map);
    this.initContextualMenu();

    this.selectionService.start();
  }

  private initNavigations(): void {
    if (!this.withRightPanel) {
      return;
    }

    this.selectionService.addressSelected$.pipe(takeUntil(this.destroy$)).subscribe(addressId => {
      const args = ['selection', 'addresses', addressId];
      void this.mapNavigationService.navigateTo(MapOutlet.rightPanel, args);
    });

    this.selectionService.assetSelected$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      const args = ['selection', 'assets', s.assetType, s.assetId];
      void this.mapNavigationService.navigateTo(MapOutlet.rightPanel, args);
    });

    this.selectionService.interventionSelected$.pipe(takeUntil(this.destroy$)).subscribe(intervention => {
      const args = ['selection', 'interventions', intervention.id];
      void this.mapNavigationService.navigateTo(MapOutlet.rightPanel, args);
    });

    this.selectionService.projectSelected$.pipe(takeUntil(this.destroy$)).subscribe(project => {
      const args = ['selection', 'projects', project.id, project.projectTypeId];
      void this.mapNavigationService.navigateTo(MapOutlet.rightPanel, args);
    });

    this.selectionService.rtuProjectSelected$.pipe(takeUntil(this.destroy$)).subscribe(rtuProject => {
      const args = ['selection', 'rtuProjects', rtuProject.id];
      void this.mapNavigationService.navigateTo(MapOutlet.rightPanel, args);
    });
  }

  private initContextualMenu(): void {
    this.contextualMenuTool = new RightClickMapTool(this.mapService.map.map);
    this.contextualMenuTool.rightClick$.subscribe(ev => {
      this.interventionCreateLatLng = ev.lngLat;
      this.mapContextualMenu?.open(ev.originalEvent);
    });
    if (this.contextualMenuEnabled) {
      this.contextualMenuTool.activate();
    }
  }

  public onCancelMapSelection(): void {
    this.mapService.deactivateSelectionModeUI();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.toolService.stopTools();
    this.mapService.mapComponent = null;
    this.mapService.map = null;
  }
}

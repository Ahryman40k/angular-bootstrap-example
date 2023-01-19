import { Injectable } from '@angular/core';
import { Feature } from '@turf/turf';
import { IEnrichedIntervention, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { SimpleSelectionComponent } from '@villemontreal/maps-angular-lib';
import { MapboxGeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { Subject } from 'rxjs';
import { assetLogicLayerGroups } from 'src/app/map/config/layers/asset-logic-layer-groups';
import { MapLogicLayer } from 'src/app/map/config/layers/logic-layers/map-logic-layer-enum';
import { mapProjectAreaLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-logic-layers';
import { mapProjectPinLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-pin-logic-layers';

import { mapRtuProjectAreaLogicLayers } from '../../map/config/layers/logic-layers/projects/map-rtu-project-area-logic-layers';
import { mapRtuProjectPinLogicLayers } from '../../map/config/layers/logic-layers/projects/map-rtu-project-pin-logic-layers';
import { mapStyleConfig } from '../../map/config/layers/styles';
import { MapComponent } from '../../map/map.component';
import { IAssetTypeIdPair } from '../models/assets/asset-type-id-pair';
import { AssetService } from './asset.service';
import { FitZoomToGeometryPadding, MapService } from './map.service';

const mapProjectLogicLayers: MapLogicLayer[] = [...mapProjectAreaLogicLayers, ...mapProjectPinLogicLayers];
const mapRtuProjectLogicLayers: MapLogicLayer[] = [...mapRtuProjectAreaLogicLayers, ...mapRtuProjectPinLogicLayers];
export const assetLogicLayerGroupsIds = Object.keys(assetLogicLayerGroups);

// tslint:disable: no-string-literal
interface ISelectionHandlerConfig {
  logicLayerIds: (string | MapLogicLayer)[];
  handler: (feature: MapboxGeoJSONFeature) => void;
}

// TODO: { providedIn: 'root' } is a tech debt.
// We need this in order to make the constraint service work.
// Once constraints will be fixed, remove the provided in root flag.
@Injectable({ providedIn: 'root' })
export class MapSelectionService {
  private mapComponent: MapComponent;
  private simpleSelectionComponent: SimpleSelectionComponent;

  private readonly selectionHandlerConfigs: ISelectionHandlerConfig[] = [
    { logicLayerIds: mapProjectLogicLayers, handler: f => this.onProjectSelected(f) },
    { logicLayerIds: mapRtuProjectLogicLayers, handler: f => this.onRtuProjectSelected(f) },
    { logicLayerIds: [MapLogicLayer.interventions], handler: f => this.onInterventionSelected(f) },
    { logicLayerIds: [MapLogicLayer.addresses], handler: f => this.onAddressSelected(f) },
    {
      logicLayerIds: [MapLogicLayer.countByBorough, MapLogicLayer.countByCity],
      handler: f => this.onBoroughSelected(f)
    },
    { logicLayerIds: assetLogicLayerGroupsIds, handler: f => this.onAssetSelected(f) }
  ];

  private readonly interventionSelectedSubject = new Subject<IEnrichedIntervention>();
  public interventionSelected$ = this.interventionSelectedSubject.asObservable();

  private readonly projectSelectedSubject = new Subject<IEnrichedProject>();
  public projectSelected$ = this.projectSelectedSubject.asObservable();

  private readonly rtuProjectSelectedSubject = new Subject<IEnrichedProject>();
  public rtuProjectSelected$ = this.rtuProjectSelectedSubject.asObservable();

  private readonly assetSelectedSubject = new Subject<IAssetTypeIdPair>();
  public assetSelected$ = this.assetSelectedSubject.asObservable();

  private readonly addressSelectedSubject = new Subject<string>();
  public addressSelected$ = this.addressSelectedSubject.asObservable();

  constructor(private readonly mapService: MapService, private readonly assetService: AssetService) {}

  public init(mapComponent: MapComponent): void {
    this.mapComponent = mapComponent;
    this.simpleSelectionComponent = this.mapComponent._map.getAllTools()['simpleSelection'];
  }

  public start(): void {
    if (this.simpleSelectionComponent) {
      this.simpleSelectionComponent.start(null, e => this.onMapSelection(e));
      this.simpleSelectionComponent['highlightOnSelection'] = false; // Need to "wall-hack" because options are broken in lib v2.5.1-pre.build.18
      this.simpleSelectionComponent['onClick'] = this.simpleSelectionComponentOnClick;
    }
  }

  public stop(): void {
    this.simpleSelectionComponent.cancel();
  }

  private onMapSelection(selectionContent: { [key: string]: MapboxGeoJSONFeature[] }): void {
    for (const key in selectionContent) {
      if (!selectionContent.hasOwnProperty(key)) {
        continue;
      }

      const features = selectionContent[key];
      const feature = features[0];
      const logicLayer = key as MapLogicLayer;

      const config = this.selectionHandlerConfigs.find(c => c.logicLayerIds.includes(logicLayer));
      if (!config) {
        continue;
      }

      config.handler(feature);
      break;
    }
  }

  private onProjectSelected(feature: MapboxGeoJSONFeature): void {
    const project = JSON.parse(feature.properties.project);
    this.projectSelectedSubject.next(project);
  }

  private onRtuProjectSelected(feature: MapboxGeoJSONFeature): void {
    const rtuProject = JSON.parse(feature.properties.rtuProject);
    this.rtuProjectSelectedSubject.next(rtuProject);
  }

  private onInterventionSelected(feature: MapboxGeoJSONFeature): void {
    const intervention = JSON.parse(feature.properties.intervention);
    this.interventionSelectedSubject.next(intervention);
  }

  private onAddressSelected(feature: MapboxGeoJSONFeature): void {
    const addressId: string = feature.properties.id;
    this.addressSelectedSubject.next(addressId);
  }

  private onBoroughSelected(feature: MapboxGeoJSONFeature): void {
    this.mapService.fitZoomToGeometry(
      feature as Feature,
      FitZoomToGeometryPadding.LARGE,
      true,
      mapStyleConfig.boroughCount.maxZoom + 0.1
    );
  }

  private async onAssetSelected(feature: MapboxGeoJSONFeature): Promise<void> {
    const assetTypeIdPair = await this.assetService.getAssetTypeAndIdFromAssetFeature(feature);
    this.assetSelectedSubject.next(assetTypeIdPair);
  }

  /**
   * Overrides the onClick implementation of the simple selection component.
   * We override the method to be able to retrieve the mapbox layer information.
   * We need that info in order to know which asset the feature corresponds to.
   */
  private simpleSelectionComponentOnClick(this: SimpleSelectionComponent, mouseEvent: MapMouseEvent): void {
    const tolerancePx = 5;
    const mapboxFeatures = this.targetMap.map.queryRenderedFeatures([
      [mouseEvent.point.x - tolerancePx, mouseEvent.point.y - tolerancePx],
      [mouseEvent.point.x + tolerancePx, mouseEvent.point.y + tolerancePx]
    ]);
    for (const mapboxFeature of mapboxFeatures) {
      mapboxFeature.properties.logicLayerId = this.targetMap['styleManagerService'].getLogicLayerIdFromMapboxLayerId(
        mapboxFeature.layer.id
      );
    }
    const groupedFeatures = this.targetMap['groupByLogicLayersFromFeatures'](mapboxFeatures);
    this['doneCallback'](groupedFeatures);
  }
}

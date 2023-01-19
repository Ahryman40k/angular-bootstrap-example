import { Component, OnInit, ViewChild } from '@angular/core';
import { Feature, FeatureCollection } from 'geojson';
import { DrawControls } from '../../../gis-components-lib/src/lib/models/draw';
import { ILayerManagerConfig } from '../../../gis-components-lib/src/lib/models/layer-manager';
import { IMapConfig, MapComponent } from '../../../gis-components-lib/src/public-api';
import { layerManagerConfig } from './map-definition/layer-manager-config';
import { mapConfig } from './map-definition/map-config';
import { miniMapConfig } from './map-definition/mini-map-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('map') public map1: MapComponent;

  public mapLoaded = false;

  public title: string = 'gis-components-tester';

  // ovniReport
  private occupancyZones: FeatureCollection = {
    type: 'FeatureCollection',
    features: [] as any
  };

  protected mapConfig: IMapConfig = mapConfig.mainMapConfig;
  protected layerManagerConfig: ILayerManagerConfig = layerManagerConfig;

  public miniMapConfig = miniMapConfig;
  public selectedFeatures: any = {};

  public async ngOnInit(): Promise<void> {
    this.map1.subscribeEvent('load').subscribe(isLoaded => {
      if (isLoaded) {
        this.refreshMapWithOccupancyZones();

        /**
         * Subscribe to event on tool change, we init some data
         */
        this.map1.subscribeEvent('toolChange').subscribe((data: any) => {
          // tslint:disable-next-line: no-console
          console.log("Changement d'outil", data);
        });
      }

      this.mapLoaded = isLoaded;
    });
  }

  private refreshMapWithOccupancyZones() {
    this.map1.setSource('occupancyZonesSource', this.occupancyZones);
  }

  public initData() {
    this.selectedFeatures = [];
  }

  public useDefaultTool() {
    this.map1.interactionMode = '';
  }

  public startAddOccupancyZone() {
    this.map1.useTool(
      'geometry-draw-tool',
      "Indiquer la zone d'occupation du permis. N'inclus pas l'espace pour le stationnement",
      (feature: Feature) => {
        this.selectedFeatures = feature;
        this.addOccupancyZone(feature);
        this.refreshMapWithOccupancyZones();
      },
      { mode: 'draw_polygon' }
    );
  }

  public editSelected() {
    this.map1.useTool(
      'geometry-draw-tool',
      'Éditer la forme',
      (feature: Feature) => {
        // On reçoit un feature de l'outil d'édition.
        this.selectedFeatures = feature;

        // On récupère le feature originial de la source de données et on met à jour ses données
        const previousFeature: Feature = this.occupancyZones.features.find(
          x => x.properties.id === feature.properties.id
        );
        if (previousFeature) {
          previousFeature.properties = feature.properties;
          previousFeature.geometry = feature.geometry;
        }
        this.refreshMapWithOccupancyZones();
      },
      { mode: 'simple_select', feature: this.map1.getSelectedContentSingle() }
    );
  }

  public selectionnerOccupancyZone() {
    this.map1.useTool(
      'simpleSelection',
      'Cliquer sur la carte',
      (feature: Feature) => {
        this.selectedFeatures = feature;
        this.useDefaultTool();
      },
      { queryableLayers: ['occupancyZones'] }
    );
  }

  public selectionnerOccupancyZoneMultiple() {
    this.map1.useTool(
      'multipleSelection',
      'Choisissez une ou plusieurs zone.',
      (e: any) => {
        this.selectedFeatures = e;
        this.useDefaultTool();
      },
      { queryableLayers: ['occupancyZones'] }
    );
  }

  public selectMultiple() {
    this.map1.useTool(
      'geometry-draw-tool',
      'Ajouter un polygone afin de selectionner les actifs',
      (feature: Feature) => {
        this.selectedFeatures = feature;
        this.getSelectedFeatures(feature);
        this.useDefaultTool();
      },
      { mode: 'draw_polygon', controls: [DrawControls.Trash] }
    );
  }

  public selectRoadSections() {
    this.map1.useTool(
      'multipleSelection',
      'Choisissez des tronçons',
      (e: any) => {
        this.selectedFeatures = this.addOccupancyZone(e);
        this.useDefaultTool();
      },
      { queryableLayers: ['roadSections'] }
    );
  }

  public selectPavement() {
    const preSelectedFeatures = null;
    const unselectableFeatures = null;

    this.map1.useTool(
      'multipleSelection',
      'Choisissez des surfaces',
      (e: any) => {
        this.selectedFeatures = e;
        this.useDefaultTool();
      },
      {
        queryableLayers: ['pavementSections', 'intersections', 'sidewalks'],
        preSelectedFeatures,
        unselectableFeatures,
        itemClickedCallback: (changed: any) => {
          // tslint:disable-next-line: no-console
          console.log('Voici ce qui a changé', changed);
        }
      }
    );
  }

  public selectSingleParking() {
    this.map1.useTool(
      'simpleSelection',
      'Cliquez sur des parcomètres des bornes de paiement pour les sélectionner',
      (e: any) => {
        this.selectedFeatures = e;
        this.useDefaultTool();
      },
      { queryableLayers: ['bornesDePaiement', 'parcometres'] }
    );
  }

  public selectParking() {
    const preSelectedFeatures = {};
    const unselectableFeatures = {};
    // tslint:disable-next-line: no-string-literal
    preSelectedFeatures['parcometres'] = [];
    // tslint:disable-next-line: no-string-literal
    preSelectedFeatures['parcometres'].push({
      type: 'Point',
      coordinates: [],
      properties: {
        id: 'L801'
      }
    });
    // tslint:disable-next-line: no-string-literal
    unselectableFeatures['parcometres'] = [];
    // tslint:disable-next-line: no-string-literal
    unselectableFeatures['parcometres'].push({
      type: 'Point',
      coordinates: [],
      properties: {
        id: 'L809'
      }
    });
    this.map1.useTool(
      'multipleSelection',
      'Cliquez sur des parcomètres des bornes de paiement pour les sélectionner',
      (e: any) => {
        this.selectedFeatures = e;
        this.useDefaultTool();
      },
      {
        queryableLayers: ['bornesDePaiement', 'parcometres'],
        preSelectedFeatures,
        unselectableFeatures,
        itemClickedCallback: changed => {
          // tslint:disable-next-line: no-console
          console.log('Voici ce qui a changé', changed);
        }
      }
    );
  }

  public useTransformTool() {
    this.map1.useTool(
      'transform-tool',
      'Faite pivoter la form',
      (e: any) => {
        this.selectedFeatures = e;
        this.useDefaultTool();
      },
      { queryableLayers: ['ovniReports'] }
    );
  }

  public togglePermitTheme() {
    const currentTheme = this.map1.getCurrentTheme('permits');
    this.map1.setCurrentTheme('permits', currentTheme === 'default' ? 'yellow' : 'default');
  }

  /**
   * Add a feature to the occupancy zone
   * @param feature feature from creation-tool
   */
  public addOccupancyZone(feature: Feature) {
    const occupancy: Feature = {
      id: '',
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        id: new Date().getTime().toString()
      }
    };
    this.occupancyZones.features.push(occupancy);
    return feature;
  }

  /**
   * Get the selected features on specific layers from the drawned geometry
   * @param e
   */
  public getSelectedFeatures(feature: Feature) {
    // The custoQueryableLayers have to be defined in the host application.
    // for exmaple in the configuration files
    const customQueryableLayers = ['parcometres', 'bornesDePaiement'];
    if (feature) {
      const result: { [key: string]: Feature[] } = this.map1.intersect(feature.geometry, customQueryableLayers);
      this.selectedFeatures = result;

      Object.keys(result).forEach(key => {
        const ids = result[key].map(x => x.properties.id.toString());
        this.map1.highlight(key, ids);
      });
    }
  }
}

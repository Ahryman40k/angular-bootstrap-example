import { IMapConfig } from '../../../../gis-components-lib/src/public-api';

import { customMapLayers } from './custom-layers';
import { customMapSources } from './custom-style-sources';

import { environment } from '../../environments/environment';

export const mapConfig = {
  production: false,
  mainMapConfig: {
    mapOptions: {
      container: 'map0',
      zoom: 17,
      minZoom: 10,
      maxZoom: 25,
      maxBounds: [[-74.15, 45], [-73.05, 46]],
      center: [-73.5542257, 45.497429]
    },
    mapStyleDefinition: [
      // 'greyBasemap',
      // 'colorBasemap',
      'streetMarking',

      // 'buildings',
      'roadSections',
      'pavementSections',
      'intersections',

      'sidewalks',

      {
        layerName: 'permits',
        visible: false,
        theme: 'yellow'
      },
      {
        layerName: 'zoningWaste',
        visible: false
      },
      {
        layerName: 'fireHydrants',
        visible: false
      },
      {
        layerName: 'streetTrees',
        visible: false
      },
      // {
      //   layerName: 'pi2016PotableWater',
      //   visible: false
      // },
      // {
      //   layerName: 'pi2016RainWater',
      //   visible: false
      // },
      // {
      //   layerName: 'pi2016RoadNetwork',
      //   visible: false
      // },
      // {
      //   layerName: 'pi2016RoadNodes',
      //   visible: false
      // },
      // {
      //   layerName: 'pi2016RoadSections',
      //   visible: false
      // },
      // {
      //   layerName: 'pi2016WasteWater',
      //   visible: false
      // },
      // {
      //   layerName: 'egouts',
      //   visible: true
      // },

      // 'interventionPlan2016',
      // 'pi2016PotableWater',
      // 'pi2016RainWater',
      // 'pi2016RoadNetwork',
      // 'pi2016RoadNodes',
      // 'pi2016RoadSections',
      // 'pi2016WasteWater',

      /* Signalisations et entraves */
      {
        layerName: 'arretInterdit',
        visible: false
      },
      {
        layerName: 'bornesDePaiement',
        visible: true
      },
      {
        layerName: 'parcometres',
        visible: true
      },
      {
        layerName: 'poteaux',
        visible: false
      },
      {
        layerName: 'villeArrondissementsOfficiels',
        visible: false
      },
      {
        layerName: 'boroughs',
        visible: false
      },

      // Source Custom
      // 'ovniReports',
      'occupancyZones',

      // Nécessaire si on utilise les outils
      'tools',

      // On veut afficher le nom des par dessus tous les objets....
      'basemapLabels'
    ],
    baseUrl: environment.demoBaseUrl,
    // spriteName: 'geotrafic',
    customMapSources,
    customMapLayers,
    // La fonction ci-dessous sera appelée à chaque fois qu'une couche sécurisée est demandée.
    // On ajoute une en-tête http d'autorisation avec le jeton d'accès
    authRequestCallback: (url: string, resourceType: mapboxgl.ResourceType): any => {
      // For more info, see https://docs.mapbox.com/mapbox-gl-js/api/ look for transformRequest
      return {
        url,
        headers: { Authorization: 'Bearer ' + 'b417a3f2-9dc6-4afb-bcc4-e9eb17a5e24c' }
      };
    }
  } as IMapConfig
};

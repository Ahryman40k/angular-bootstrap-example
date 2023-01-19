import { ISources } from '../../../../gis-components-lib/src/public-api';
import { environment } from '../../environments/environment';

const miniMapSource: ISources = {
  minimap: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [] as any
    }
  }
};

export const miniMapConfig = {
  mapOptions: {
    container: 'map2',
    zoom: 13,
    minZoom: 7,
    maxZoom: 18,
    maxBounds: [[-74.15, 45], [-73.05, 46]],
    center: [-73.5542257, 45.497429]
  },
  mapStyleDefinition: ['colorBasemap', 'streetTrees', 'basemapLabels', 'minimap'],
  baseUrl: environment.demoBaseUrl,
  customMapSources: miniMapSource,
  customMapLayers: {
    minimap: [
      {
        id: 'minimap-line',
        type: 'line',
        source: 'minimap',
        filter: ['all', ['==', '$type', 'Polygon']],
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#D9414D',
          'line-width': {
            base: 1.55,
            stops: [[12, 1.35], [14, 5], [18, 35]]
          }
        }
      },
      {
        id: 'minimap',
        type: 'fill',
        source: 'minimap',
        filter: ['all', ['==', '$type', 'Polygon']],
        paint: {
          'fill-color': '#D9414D',
          'fill-opacity': 0.25
        }
      }
    ]
  }
};

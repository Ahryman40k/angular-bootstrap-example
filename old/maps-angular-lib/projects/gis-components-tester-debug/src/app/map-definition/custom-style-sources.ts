import { ISources } from '../../../../gis-components-lib/src/public-api';

export const customMapSources: ISources = {
  ovniReportsSource: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [] as any
    }
  },
  occupancyZonesSource: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [] as any
    }
  }
};

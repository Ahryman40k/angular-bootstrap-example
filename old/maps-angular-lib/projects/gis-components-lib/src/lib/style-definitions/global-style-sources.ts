import { ISources } from '../models/sources';
const geomaticPlatform = '/api/it-platforms/geomatic/vector-tiles/maps/v1';
const securedGeomaticPlatform = '/api/it-platforms/geomatic/vector-tiles/secured/maps/v1';
const tilesFile = 'tiles.json';

export const globalMapSources: ISources = {
  basemap: {
    type: 'vector',
    url: geomaticPlatform + '/basemap/' + tilesFile
  },
  'occupancy-permits': {
    type: 'vector',
    url: geomaticPlatform + '/occupancy-permits/' + tilesFile
  },
  zoning: {
    type: 'vector',
    url: geomaticPlatform + '/zoning/' + tilesFile
  },
  roads: {
    type: 'vector',
    url: geomaticPlatform + '/road-entities/' + tilesFile
  },
  'water-assets': {
    type: 'vector',
    url: geomaticPlatform + '/water-assets/' + tilesFile
  },
  'PI-2016': {
    type: 'vector',
    url: securedGeomaticPlatform + '/plan-intervention-2016/' + tilesFile
  },
  horticulture: {
    type: 'vector',
    url: geomaticPlatform + '/horticulture/' + tilesFile
  },
  'basemap-light': {
    type: 'vector',
    url: geomaticPlatform + '/basemap-light/' + tilesFile
  },
  marking: {
    type: 'vector',
    url: geomaticPlatform + '/pavement-marking/' + tilesFile
  },
  'signalisation-entraves': {
    type: 'vector',
    url: geomaticPlatform + '/signalisation-et-entraves/' + tilesFile
  },
  'decoupages-administratifs': {
    type: 'vector',
    url: geomaticPlatform + '/decoupages-administratifs/' + tilesFile
  },
  'cities-boroughs': {
    type: 'vector',
    url: '/api/it-platforms/geomatic/vector-tiles/maps/v2/cities-boroughs/' + tilesFile
  },
  egouts: {
    type: 'vector',
    url: securedGeomaticPlatform + '/egouts/' + tilesFile
  },
  tools: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [] as any
    }
  }
};

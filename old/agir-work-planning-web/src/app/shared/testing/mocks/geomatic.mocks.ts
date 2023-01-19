const crsName = 'urn:ogc:def:crs:EPSG::4326';
const borough = 'CÃ´te-des-Neiges - Notre-Dame-de-GrÃ¢ce';
const saintLaurent = 'Saint-Laurent';
const fireHydrants = 'fire-hydrants';
export const geomaticMocks = {
  pointFeature: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'fire-hydrants.609',
        geometry: { type: 'Point', coordinates: [-73.677737, 45.499254] },
        geometry_name: 'geom',
        properties: {
          id: 200813,
          no: 5025627,
          makeModel: 'ModÃ¨le Ã  corriger - Ã  valider',
          owner: 'VDM',
          valve: null,
          juridiction: 'LOCALE'
        }
      }
    ],
    totalFeatures: 1,
    numberMatched: 1,
    numberReturned: 1,
    timeStamp: '2019-06-11T12:14:26.502Z',
    crs: { type: 'name', properties: { name: crsName } }
  },
  emptyFeatures: {
    type: 'FeatureCollection',
    features: [],
    totalFeatures: 0,
    numberMatched: 0,
    numberReturned: 0,
    timeStamp: '2019-06-11T12:14:26.502Z',
    crs: { type: 'name', properties: { name: crsName } }
  },
  lineFeature: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'road-sections.40921',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-8196252.076939, 5699017.859635],
            [-8196416.824333, 5698756.407089]
          ]
        },
        geometry_name: 'geom',
        properties: {
          id: 1300248,
          name: 'avenue Isabella ',
          shortName: 'Isabella',
          fromName: 'avenue Victoria ',
          fromShortName: 'Victoria',
          toName: 'rue Lemieux ',
          toShortName: 'Lemieux',
          scanDirection: 1,
          classification: 0,
          cityName: 'MontrÃ©al',
          cityNameLeft: 'MontrÃ©al',
          cityNameRight: 'MontrÃ©al',
          cityId: 'MTL',
          cityIdLeft: 'MTL',
          cityIdRight: 'MTL',
          borough,
          boroughLeft: borough,
          boroughRight: borough,
          boroughId: 34,
          boroughIdLeft: 34,
          boroughIdRight: 34
        }
      }
    ],
    totalFeatures: 1,
    numberMatched: 1,
    numberReturned: 1,
    timeStamp: '2019-05-31T17:38:14.080Z',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::3857' } }
  },
  nearby: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'pavement-sections.37855',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.654601, 45.526137],
              [-73.654495, 45.526324],
              [-73.654227, 45.526803],
              [-73.654165, 45.526914],
              [-73.65402, 45.527159],
              [-73.65402, 45.527159],
              [-73.654093, 45.527183],
              [-73.654141, 45.527098],
              [-73.65419, 45.527016],
              [-73.654212, 45.526977],
              [-73.654246, 45.526923],
              [-73.654283, 45.526859],
              [-73.654329, 45.526782],
              [-73.654385, 45.526687],
              [-73.654428, 45.526614],
              [-73.654469, 45.526544],
              [-73.654514, 45.526468],
              [-73.654554, 45.526402],
              [-73.654617, 45.526296],
              [-73.65466, 45.526223],
              [-73.654695, 45.526165],
              [-73.654728, 45.526108],
              [-73.654758, 45.526057],
              [-73.654773, 45.526032],
              [-73.654793, 45.525999],
              [-73.654829, 45.525937],
              [-73.654733, 45.52591],
              [-73.654731, 45.525909],
              [-73.654601, 45.526137]
            ]
          ]
        },
        geometry_name: 'geom',
        properties: {
          id: '37769',
          roadId: '1607694',
          pavementMaterialRef: 'Asphalte',
          thmGeo: '1',
          area: '1063.52',
          estimatedLength: '146.947',
          estimatedWidth: '7.237'
        }
      }
    ],
    totalFeatures: 1,
    numberMatched: 1,
    numberReturned: 1,
    timeStamp: '2019-06-10T01:05:35.255Z',
    crs: { type: 'name', properties: { name: crsName } }
  },
  intersect: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'road-sections.22704',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-73.654367, 45.526523],
            [-73.654835, 45.52582],
            [-73.654923, 45.525691],
            [-73.655023, 45.52557],
            [-73.655115, 45.525506],
            [-73.65537, 45.525384],
            [-73.655479, 45.525345],
            [-73.655601, 45.525331],
            [-73.655769, 45.525308]
          ]
        },
        geometry_name: 'geom',
        properties: {
          id: 1607691,
          name: 'rue Gince ',
          shortName: 'Gince',
          fromName: 'rue De Beauharnois Ouest ',
          fromShortName: 'De Beauharnois',
          toName: 'boulevard Lebeau ',
          toShortName: 'Lebeau',
          scanDirection: 1,
          classification: 0,
          cityName: 'MontrÃ©al',
          cityNameLeft: 'MontrÃ©al',
          cityNameRight: 'MontrÃ©al',
          cityId: 'MTL',
          cityIdLeft: 'MTL',
          cityIdRight: 'MTL',
          borough: saintLaurent,
          boroughLeft: saintLaurent,
          boroughRight: saintLaurent,
          boroughId: 15,
          boroughIdLeft: 15,
          boroughIdRight: 15
        }
      }
    ],
    totalFeatures: 1,
    numberMatched: 1,
    numberReturned: 1,
    timeStamp: '2019-06-10T01:10:50.135Z',
    crs: { type: 'name', properties: { name: crsName } }
  },
  selectionContentMock: {
    logicLayerId: 'fireHydrants',
    features: [
      {
        geometry: { type: 'Point', coordinates: [-73.65702085196972, 45.519486391841724] },
        type: 'Feature',
        properties: {
          id: 201983,
          juridiction: 'LOCALE',
          makeModel: 'Modèle à corriger - à valider',
          no: 5026797,
          owner: 'VDM',
          valve: 0
        },
        id: 4698,
        layer: {
          id: fireHydrants,
          type: 'symbol',
          source: 'water-assets',
          'source-layer': fireHydrants,
          minzoom: 13,
          layout: {
            'icon-image': 'fire-hydrant-15',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-pitch-alignment': 'auto',
            'icon-keep-upright': true
          }
        },
        source: 'water-assets',
        sourceLayer: fireHydrants,
        state: {}
      }
    ]
  }
};

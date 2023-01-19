import { IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IGetFeatureResponse } from '@villemontreal/core-utils-geo-nodejs-lib';

export const iConfigurationGeometryMock = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.543299, 45.605579],
      [-73.54332, 45.605523],
      [-73.543351, 45.605541],
      [-73.543929, 45.605689],
      [-73.543959, 45.605688],
      [-73.54398, 45.605681],
      [-73.544062, 45.605702],
      [-73.54403, 45.605763],
      [-73.544116, 45.605784],
      [-73.544145, 45.605723],
      [-73.544155, 45.605736],
      [-73.544182, 45.605751],
      [-73.544758, 45.605897],
      [-73.544792, 45.6059],
      [-73.544821, 45.605893],
      [-73.544756, 45.606023],
      [-73.544743, 45.606006],
      [-73.54471, 45.60599],
      [-73.544136, 45.605844],
      [-73.544088, 45.605845],
      [-73.543907, 45.605804],
      [-73.54389, 45.605787],
      [-73.543868, 45.605776],
      [-73.543309, 45.605632],
      [-73.54328, 45.605631],
      [-73.543299, 45.605579]
    ]
  ]
} as IGeometry;

export const iConfigurationGetFeatureResponseMock = ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'road-sections.24655',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.543199, 45.605551],
          [-73.544031, 45.605766]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1614100,
        name: 'avenue Portage ',
        shortName: 'Portage',
        fromName: 'avenue Chénier ',
        fromShortName: 'Chénier',
        toName: 'avenue du Mail ',
        toShortName: 'Mail',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Anjou',
        boroughLeft: 'Anjou',
        boroughRight: 'Anjou',
        boroughId: 9,
        boroughIdLeft: 9,
        boroughIdRight: 9
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.24716',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.544031, 45.605766],
          [-73.543911, 45.605979],
          [-73.543754, 45.606229],
          [-73.543651, 45.606389],
          [-73.54354, 45.606542],
          [-73.54344, 45.606677],
          [-73.543186, 45.606976],
          [-73.54314, 45.607027]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1614189,
        name: 'avenue du Mail ',
        shortName: 'Mail',
        fromName: 'avenue Portage ',
        fromShortName: 'Portage',
        toName: 'boulevard Roi-René ',
        toShortName: 'Roi-René',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Anjou',
        boroughLeft: 'Anjou',
        boroughRight: 'Anjou',
        boroughId: 9,
        boroughIdLeft: 9,
        boroughIdRight: 9
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26836',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.544031, 45.605766],
          [-73.544857, 45.605978]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1614099,
        name: 'avenue Portage ',
        shortName: 'Portage',
        fromName: 'avenue du Mail ',
        fromShortName: 'Mail',
        toName: 'avenue Curé-Clermont ',
        toShortName: 'Curé-Clermont',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Anjou',
        boroughLeft: 'Anjou',
        boroughRight: 'Anjou',
        boroughId: 9,
        boroughIdLeft: 9,
        boroughIdRight: 9
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26842',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.544534, 45.604323],
          [-73.544511, 45.604377],
          [-73.544474, 45.604537],
          [-73.544431, 45.604715],
          [-73.544396, 45.604848],
          [-73.544371, 45.604931],
          [-73.544288, 45.605175],
          [-73.544226, 45.605341],
          [-73.544168, 45.605474],
          [-73.544031, 45.605766]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1614183,
        name: 'avenue du Mail ',
        shortName: 'Mail',
        fromName: 'boulevard Joseph-Renaud ',
        fromShortName: 'Joseph-Renaud',
        toName: 'avenue Portage ',
        toShortName: 'Portage',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Anjou',
        boroughLeft: 'Anjou',
        boroughRight: 'Anjou',
        boroughId: 9,
        boroughIdLeft: 9,
        boroughIdRight: 9
      }
    }
  ],
  totalFeatures: 4,
  numberMatched: 4,
  numberReturned: 4,
  timeStamp: '2020-09-03T14:58:22.274Z',
  crs: {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:EPSG::4326'
    }
  }
} as unknown) as IGetFeatureResponse;

export const uConfigurationGeometryMock = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.552628, 45.609519],
      [-73.552665, 45.609463],
      [-73.55268, 45.60948],
      [-73.5527, 45.609492],
      [-73.554499, 45.610274],
      [-73.554524, 45.610281],
      [-73.554553, 45.610281],
      [-73.554458, 45.610385],
      [-73.554449, 45.610371],
      [-73.554434, 45.61036],
      [-73.55264, 45.60958],
      [-73.55261, 45.609574],
      [-73.55257, 45.609581],
      [-73.55254, 45.609601],
      [-73.552225, 45.610028],
      [-73.55222, 45.610044],
      [-73.552223, 45.610062],
      [-73.552234, 45.610078],
      [-73.552251, 45.61009],
      [-73.554007, 45.610853],
      [-73.554052, 45.610858],
      [-73.553969, 45.610953],
      [-73.552175, 45.610172],
      [-73.552135, 45.610148],
      [-73.55211, 45.610125],
      [-73.552085, 45.610083],
      [-73.552078, 45.610053],
      [-73.552083, 45.610009],
      [-73.552096, 45.609983],
      [-73.552197, 45.609854],
      [-73.552441, 45.609521],
      [-73.552517, 45.609548],
      [-73.552551, 45.609493],
      [-73.552628, 45.609519]
    ]
  ]
} as IGeometry;

export const uConfigurationGetFeatureResponseMock = ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'road-sections.24681',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.552546, 45.60949],
          [-73.552627, 45.60952],
          [-73.552643, 45.609526],
          [-73.554587, 45.61037]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1614303,
        name: 'avenue Argenton ',
        shortName: 'Argenton',
        fromName: 'avenue de Fougeray ',
        fromShortName: 'Fougeray',
        toName: 'avenue de Peterborough ',
        toShortName: 'Peterborough',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Anjou',
        boroughLeft: 'Anjou',
        boroughRight: 'Anjou',
        boroughId: 9,
        boroughIdLeft: 9,
        boroughIdRight: 9
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.29311',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.5522, 45.610124],
          [-73.554079, 45.610944]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 4006306,
        name: 'avenue de Fougeray ',
        shortName: 'Fougeray',
        fromName: 'avenue de Fougeray ',
        fromShortName: 'Fougeray',
        toName: 'avenue de Fougeray ',
        toShortName: 'Fougeray',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Anjou',
        boroughLeft: 'Anjou',
        boroughRight: 'Anjou',
        boroughId: 9,
        boroughIdLeft: 9,
        boroughIdRight: 9
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.29670',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.552546, 45.60949],
          [-73.552161, 45.610005],
          [-73.552154, 45.610019],
          [-73.552152, 45.610033],
          [-73.552151, 45.610049],
          [-73.552153, 45.610073],
          [-73.55216, 45.610087],
          [-73.552168, 45.610098],
          [-73.552177, 45.610108],
          [-73.5522, 45.610124]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 4006305,
        name: 'avenue de Fougeray ',
        shortName: 'Fougeray',
        fromName: 'avenue Argenton ',
        fromShortName: 'Argenton',
        toName: 'avenue de Fougeray ',
        toShortName: 'Fougeray',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Anjou',
        boroughLeft: 'Anjou',
        boroughRight: 'Anjou',
        boroughId: 9,
        boroughIdLeft: 9,
        boroughIdRight: 9
      }
    }
  ],
  totalFeatures: 3,
  numberMatched: 3,
  numberReturned: 3,
  timeStamp: '2020-09-02T20:00:15.852Z',
  crs: {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:EPSG::4326'
    }
  }
} as unknown) as IGetFeatureResponse;

export const tConfigurationGeometryMock = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.540505, 45.587252],
      [-73.540454, 45.587334],
      [-73.540446, 45.587336],
      [-73.540326, 45.587539],
      [-73.540175, 45.587795],
      [-73.54018, 45.587802],
      [-73.540094, 45.587948],
      [-73.539946, 45.587896],
      [-73.54001, 45.587773],
      [-73.540037, 45.587761],
      [-73.540055, 45.587743],
      [-73.540317, 45.587299],
      [-73.540323, 45.58728],
      [-73.54032, 45.587261],
      [-73.540303, 45.58724],
      [-73.540288, 45.587231],
      [-73.53656, 45.586008],
      [-73.536538, 45.586004],
      [-73.536504, 45.586008],
      [-73.536347, 45.585957],
      [-73.536424, 45.585837],
      [-73.536588, 45.585894],
      [-73.536609, 45.585914],
      [-73.536625, 45.585921],
      [-73.540342, 45.587141],
      [-73.540386, 45.587138],
      [-73.540412, 45.587125],
      [-73.540423, 45.587114],
      [-73.540689, 45.586665],
      [-73.540699, 45.586639],
      [-73.540694, 45.586621],
      [-73.540722, 45.586562],
      [-73.54088, 45.586616],
      [-73.540832, 45.586701],
      [-73.540824, 45.586699],
      [-73.540817, 45.586703],
      [-73.540548, 45.587162],
      [-73.540555, 45.587171],
      [-73.540505, 45.587252]
    ]
  ]
} as IGeometry;

export const tConfigurationGetFeatureResponseMock = ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'road-sections.26548',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.54006, 45.587861],
          [-73.5402, 45.58791]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 4003705,
        name: 'rue Beauclerk ',
        shortName: 'Beauclerk',
        fromName: 'rue Sherbrooke Est ',
        fromShortName: 'Sherbrooke',
        toName: 'rue Sherbrooke Est ',
        toShortName: 'Sherbrooke',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26549',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.540434, 45.587227],
          [-73.540575, 45.587275]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 4003706,
        name: 'avenue Émile-Legrand ',
        shortName: 'Émile-Legrand',
        fromName: 'rue Sherbrooke Est ',
        fromShortName: 'Sherbrooke',
        toName: 'rue Sherbrooke Est ',
        toShortName: 'Sherbrooke',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26664',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.536879, 45.585302],
          [-73.536839, 45.585363],
          [-73.536504, 45.585865],
          [-73.536466, 45.585923]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1440752,
        name: 'rue de Marseille ',
        shortName: 'Marseille',
        fromName: 'rue Lyall ',
        fromShortName: 'Lyall',
        toName: 'avenue Émile-Legrand ',
        toShortName: 'Émile-Legrand',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26665',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.536466, 45.585923],
          [-73.536426, 45.585983],
          [-73.53609, 45.586485],
          [-73.536052, 45.586544]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1440753,
        name: 'rue de Marseille ',
        shortName: 'Marseille',
        fromName: 'avenue Émile-Legrand ',
        fromShortName: 'Émile-Legrand',
        toName: 'rue Beauclerk ',
        toShortName: 'Beauclerk',
        scanDirection: 0,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26783',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.53246, 45.584606],
          [-73.532552, 45.584635],
          [-73.536386, 45.585896],
          [-73.536466, 45.585923]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1440439,
        name: 'avenue Émile-Legrand ',
        shortName: 'Émile-Legrand',
        fromName: 'avenue Pierre-De Coubertin ',
        fromShortName: 'Pierre-De Coubertin',
        toName: 'rue de Marseille ',
        toShortName: 'Marseille',
        scanDirection: -1,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26784',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.536466, 45.585923],
          [-73.536547, 45.58595],
          [-73.540434, 45.587227]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1440440,
        name: 'avenue Émile-Legrand ',
        shortName: 'Émile-Legrand',
        fromName: 'rue de Marseille ',
        fromShortName: 'Marseille',
        toName: 'rue Sherbrooke Est ',
        toShortName: 'Sherbrooke',
        scanDirection: -1,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26940',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.54006, 45.587861],
          [-73.539567, 45.588705]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1441195,
        name: 'rue Sherbrooke Est ',
        shortName: 'Sherbrooke',
        fromName: 'rue Beauclerk ',
        fromShortName: 'Beauclerk',
        toName: 'rue Radisson ',
        toShortName: 'Radisson',
        scanDirection: 1,
        classification: 7,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26941',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.540434, 45.587227],
          [-73.54006, 45.587861]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1441196,
        name: 'rue Sherbrooke Est ',
        shortName: 'Sherbrooke',
        fromName: 'avenue Émile-Legrand ',
        fromShortName: 'Émile-Legrand',
        toName: 'rue Beauclerk ',
        toShortName: 'Beauclerk',
        scanDirection: 1,
        classification: 7,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.26942',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.540807, 45.586589],
          [-73.540434, 45.587227]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1441197,
        name: 'rue Sherbrooke Est ',
        shortName: 'Sherbrooke',
        fromName: 'rue Lyall ',
        fromShortName: 'Lyall',
        toName: 'avenue Émile-Legrand ',
        toShortName: 'Émile-Legrand',
        scanDirection: 1,
        classification: 7,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'road-sections.27090',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.536052, 45.586544],
          [-73.536133, 45.58657],
          [-73.54006, 45.587861]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1440034,
        name: 'rue Beauclerk ',
        shortName: 'Beauclerk',
        fromName: 'rue de Marseille ',
        fromShortName: 'Marseille',
        toName: 'rue Sherbrooke Est ',
        toShortName: 'Sherbrooke',
        scanDirection: 1,
        classification: 0,
        cityName: 'Montréal',
        cityNameLeft: 'Montréal',
        cityNameRight: 'Montréal',
        cityId: 'MTL',
        cityIdLeft: 'MTL',
        cityIdRight: 'MTL',
        borough: 'Mercier - Hochelaga-Maisonneuve',
        boroughLeft: 'Mercier - Hochelaga-Maisonneuve',
        boroughRight: 'Mercier - Hochelaga-Maisonneuve',
        boroughId: 22,
        boroughIdLeft: 22,
        boroughIdRight: 22
      }
    },
    {
      type: 'Feature',
      id: 'reseau-arteriel.7609',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.54006, 45.587861],
          [-73.539567, 45.588705]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1441195
      }
    },
    {
      type: 'Feature',
      id: 'reseau-arteriel.7610',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.540434, 45.587227],
          [-73.54006, 45.587861]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1441196
      }
    },
    {
      type: 'Feature',
      id: 'reseau-arteriel.7611',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.540807, 45.586589],
          [-73.540434, 45.587227]
        ]
      },
      geometry_name: 'geom',
      properties: {
        id: 1441197
      }
    }
  ],
  totalFeatures: 13,
  numberMatched: 13,
  numberReturned: 13,
  timeStamp: '2020-09-02T20:38:59.946Z',
  crs: {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:EPSG::4326'
    }
  }
} as unknown) as IGetFeatureResponse;

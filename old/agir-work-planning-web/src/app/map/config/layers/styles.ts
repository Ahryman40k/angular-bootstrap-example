import { Expression, LineLayout } from 'mapbox-gl';

import { FilterId } from './filter-enum';

const mtlColors = {
  action: '#097d6c',
  green: '#075B4F',
  lighterGreen: '#0cb097'
};

export const criteriaColor = {
  navyBlue: '#253494',
  royalBlue: '#2C7FB8',
  lightBlue: '#41B6C4',
  green: '#A1DAB4',
  yellow: '#FFFFCC'
};

export const patternStyle = {
  pattern: 'pattern',
  fuchsiaPattern: 'fuchsia-pattern'
};

export const mapStyleConfigColors = {
  mtlColors,
  aqua: '#00fefe',
  black: '#000000',
  darkerBlue: '#020267',
  darkBlue: '#003399',
  blueDeepSky: '#009ee0',
  blueViolet: '#8a2be2',
  lightSteelBlue: '#c4c4f8',
  darkRed: '#980101',
  darkPurple: '#222e54',
  darkKhaki: '#c4ab78',
  darkerGrayBlack: '#4A4A4A',
  linkWater: '#CED4DA',
  darkerGray: '#ADB5BD',
  dimGray: '#6C6B75',
  darkGray: '#787878',
  lighterGray: '#d9d9d9',
  lightGray: '#C4C4C4',
  green: '#3da920',
  lightGreen: '#a3c3b3',
  darkSeaGreen: '#73c773',
  highlight: '#0CB097',
  hover: '#FFFFFF',
  lightBlue: '#003399',
  lightPurple: '#4872F0',
  magenta: '#ff5eb4',
  orange: '#FF8000',
  pink: '#FA6495',
  purple: '#373871',
  red: '#FE0B0B',
  fuchsia: '#9E008F',
  sky: '#5caeff',
  white: '#FFFFFF',
  yellow: '#FFB833'
};

export const mapZoom = {
  assetsZoom: 17.5,
  boroughMaxZoom: 14,
  boroughMinZoom: 12.5
};

export const mapStyleConfig = {
  colors: mapStyleConfigColors,
  boroughs: {
    color: '#003399',
    innerColor: mapStyleConfigColors.lightBlue,
    lineDash: [2, 3],
    opacity: 0.8,
    minZoom: mapZoom.boroughMinZoom,
    maxZoom: mapZoom.boroughMaxZoom
  },
  boroughCount: {
    minZoom: 1,
    maxZoom: mapZoom.boroughMinZoom
  },
  fill: {
    opacity: {
      primary: 0.3,
      secondary: 0.2
    }
  },
  border: {
    opacity: {
      primary: 1,
      secondary: 0.5
    }
  },
  intervention: {
    zoom: 14,
    zoomCreation: 1,
    color: ['case', ['get', 'decisionRequired'], mapStyleConfigColors.yellow, mapStyleConfigColors.pink] as Expression,
    lineWidth: 8,
    halo: {
      opacity: 1
    },
    area: {
      opacity: 0.3
    },
    pins: {
      zoom: mapZoom.boroughMinZoom
    }
  },
  selectionRadius: {
    area: {
      opacity: 0.05
    }
  },
  publicDomain: {
    lineWidth: 2,
    zoom: mapZoom.assetsZoom,
    legalCadastre: {
      color: mapStyleConfigColors.darkBlue,
      lineWidth: 3
    },
    lotNumber: {
      color: mapStyleConfigColors.darkBlue
    }
  },
  yearlyPlan: {
    lineWidth: 2,
    zoom: mapZoom.assetsZoom,
    drinkingWater: {
      lineColor: mapStyleConfigColors.blueViolet,
      lineWidth: 3,
      dashArray: [1, 0.5]
    },
    wasteWaters: {
      lineColor: mapStyleConfigColors.blueViolet,
      lineWidth: 3,
      dashArray: [1, 0.5]
    },
    rainyWaters: {
      lineColor: mapStyleConfigColors.blueViolet,
      lineWidth: 3,
      zoom: mapZoom.assetsZoom,
      dashArray: [1, 0.5]
    },
    unifiedNodes: {
      color: mapStyleConfigColors.blueDeepSky,
      strokeColor: mapStyleConfigColors.blueDeepSky,
      strokeWidth: 2
    },
    road: {
      lineColor: mapStyleConfigColors.red,
      lineWidth: 3
    }
  },
  transport: {
    lineWidth: 2,
    zoom: mapZoom.assetsZoom,
    busLine: {
      color: mapStyleConfigColors.blueDeepSky,
      lineWidth: 3
    },
    undergroundLine: {
      propertyKey: 'numLig',
      keyValue: {
        '1': mapStyleConfigColors.green,
        '2': mapStyleConfigColors.orange,
        '4': mapStyleConfigColors.yellow,
        '5': mapStyleConfigColors.darkBlue
      },
      lineWidth: 3,
      zoom: mapZoom.assetsZoom,
      color: mapStyleConfigColors.yellow
    },
    metroStation: {
      zoom: mapZoom.assetsZoom
    },
    remStation: {
      zoom: mapZoom.assetsZoom
    }
  },
  asset: {
    lineWidth: 2,
    zoom: mapZoom.assetsZoom,
    alleys: {
      color: mapStyleConfigColors.dimGray,
      lineWidth: 12
    },
    aqueducts: {
      idKey: FilterId.noGeoSegment,
      lineColor: mapStyleConfigColors.lightPurple,
      lineWidth: 4,
      hover: {
        lineGapWidth: 3
      },
      valveChamber: {
        color: mapStyleConfigColors.lightSteelBlue,
        lineWidth: 2
      }
    },
    aqueductAccessory: {
      icons: {
        default: 'accessoires-aqueducs',
        highlight: 'accessoire_aqueduc_s',
        hover: 'accessoire_aqueduc_h'
      },
      idKey: FilterId.noGeoAccessory
    },
    barrel: {
      color: mapStyleConfigColors.lightGray,
      lineColor: mapStyleConfigColors.darkGray,
      lineWidth: 3,
      opacity: 0.9,
      idKey: FilterId.id
    },
    bikePaths: {
      color: '#aaa9ad',
      lineWidth: 12,
      opacity: 0.9
    },
    busShelter: {
      zoom: mapZoom.assetsZoom,
      idKey: FilterId.id,
      propertyKey: 'proprietaire',
      iconPostFixes: {
        highlight: '_s',
        hover: '_h'
      },
      iconKeys: {
        QUEBECOR: 'abribus',
        PRIVE: 'abribus',
        VILLE: 'abribus_ville',
        STM: 'abribus_stm'
      }
    },
    cable: {
      lineColor: mapStyleConfigColors.lightPurple,
      lineWidth: 3,
      idKey: FilterId.id
    },
    csem: {
      color: mapStyleConfigColors.lightPurple,
      lineWidth: 4,
      opacity: 0.3,
      strokeColor: mapStyleConfigColors.darkPurple,
      strokeWidth: 2
    },
    gas: {
      color: '#FF9900',
      colorBorder: '#0000cc',
      lineBorder: 6,
      lineWidth: 3
    },
    greenSpace: {
      color: mapStyleConfigColors.darkSeaGreen,
      lineColor: mapStyleConfigColors.darkGray,
      lineWidth: 3,
      opacity: 0.9,
      idKey: FilterId.id
    },
    leadGround: {
      color: mapStyleConfigColors.lighterGray,
      lineColor: mapStyleConfigColors.darkGray,
      lineWidth: 3,
      opacity: 0.9,
      idKey: FilterId.id
    },
    mobilityAxis: {
      lineColor: mapStyleConfigColors.orange,
      lineWidth: 3,
      idKey: FilterId.id,
      minZoom: 10.4
    },
    roadway: {
      color: mapStyleConfigColors.dimGray,
      outlineColor: '#756A6C',
      lineWidth: 4,
      opacity: 0.9
    },
    sewerDrop: {
      icons: {
        default: 'chute_egout',
        highlight: 'chute_egout_s',
        hover: 'chute_egout_h'
      },
      idKey: FilterId.id
    },
    sewer: {
      idKey: FilterId.noGeoSegment,
      lineColor: mapStyleConfigColors.lightGray,
      lineWidth: 2,
      hover: {
        lineGapWidth: 3
      },
      chambers: {
        color: mapStyleConfigColors.darkKhaki
      }
    },
    sewerManhole: {
      color: mapStyleConfigColors.darkPurple,
      circleRadius: 6
    },
    shoppingStreet: {
      lineColor: mapStyleConfigColors.darkBlue,
      lineWidth: 3,
      idKey: FilterId.id
    },
    sidewalk: {
      color: '#DBD8D2',
      opacity: 0.6,
      lineWidth: 4
    },
    streetTree: {
      iconPostFixes: {
        highlight: '_s',
        hover: '_h'
      },
      iconKeys: {
        C: 'pine_tree',
        F: 'tree',
        P: 'street_tree_p',
        VI: 'street_tree_vi',
        VA: 'street_tree_va',
        VP: 'street_tree_vp'
      },
      propertyKey: 'empEtat',
      idKey: FilterId.id
    },

    track: {
      lineColor: mapStyleConfigColors.black,
      lineWidth: 3,
      idKey: FilterId.id,
      patternImages: {
        default: 'track',
        highlight: 'track_s'
      }
    },
    trafficLight: {
      icons: {
        default: 'feux_circulation',
        highlight: 'feux_circulation_s',
        hover: 'feux_circulation_h'
      },
      idKey: FilterId.id
    },
    water: {
      zoom: 15.8
    },
    watercoursesDitches: {
      lineColor: mapStyleConfigColors.darkBlue,
      lineWidth: 3,
      zoom: mapZoom.assetsZoom,
      propertyKey: 'type',
      ditche: {
        propertyValue: 'fossé',
        lineColor: mapStyleConfigColors.aqua
      },
      river: {
        propertyValue: 'rivière',
        lineColor: mapStyleConfigColors.darkBlue
      },
      stream: {
        propertyValue: 'ruisseau',
        lineColor: mapStyleConfigColors.darkBlue
      },
      streamCanal: {
        propertyValue: 'ruisseau-canal',
        lineColor: mapStyleConfigColors.darkBlue,
        strokeColor: mapStyleConfigColors.darkBlue,
        dashArray: [1, 0.5],
        dashArrayColor: mapStyleConfigColors.dimGray
      }
    },
    electricalTerminal: {
      zoom: mapZoom.assetsZoom
    },
    hqLine: {
      lineColor: mapStyleConfigColors.orange,
      idKey: FilterId.id,
      propertyKey: 'type',
      keyValue: {
        aérien: mapStyleConfigColors.darkerBlue,
        souterrain: mapStyleConfigColors.orange
      },
      lineWidth: 3,
      zoom: mapZoom.assetsZoom
    },
    hqSubstation: {
      idKey: FilterId.id,
      icons: {
        default: 'substation',
        highlight: 'substation_s',
        hover: 'substation_h'
      },
      zoom: mapZoom.assetsZoom
    },
    pylon: {
      idKey: FilterId.id,
      icons: {
        default: 'pylone',
        highlight: 'pylone s',
        hover: 'pylone h'
      },
      zoom: mapZoom.assetsZoom
    },
    poles: {
      zoom: mapZoom.assetsZoom
    },
    area: {
      color: mapStyleConfigColors.lightGray,
      outlineColor: mapStyleConfigColors.black,
      lineWidth: 4,
      opacity: 0.2
    },
    sensitiveSite: {
      zoom: mapZoom.assetsZoom,
      idKey: FilterId.id,
      propertyKey: 'sensible',
      iconPostFixes: {
        highlight: '_s',
        hover: '_h'
      },
      iconKeys: {
        "Chute à l'égout": '',
        'Centre de réadaptation en alcoolisme et autres toxicomanies (CRPAT)': 'inst_sante',
        'Centre de réadaptation en déficience intellectuelle (CRDI)': 'inst_sante',
        'Centre de réadaptation en déficience physique (CRDP)': 'inst_sante',
        "Centre de réadaptation pour les jeunes en difficulté d'adaptation (CRJDA)": 'inst_sante'
      }
    },
    intLogical: {
      zoom: mapZoom.assetsZoom,
      idKey: FilterId.id,
      propertyKey: 'nomValeur',
      iconPostFixes: {
        highlight: '_s',
        hover: '_h'
      },
      iconKeys: {
        'Feu avec contrôleur': 'feuaveccont',
        'Feu sans contrôleur': 'feusanscont',
        'Intersection sans feu': 'intsansfeu'
      }
    },
    waterPoint: {
      icons: {
        default: 'pointeau',
        highlight: 'pointeau_s',
        hover: 'pointeau_h'
      },
      idKey: FilterId.id
    }
  },
  topology: {
    lineWidth: 6,
    zoom: mapZoom.assetsZoom,
    highway: {
      color: mapStyleConfigColors.red,
      lineWidth: 12
    },
    roadNetworkArterial: {
      lineColor: mapStyleConfigColors.darkBlue,
      lineWidth: 4,
      idKey: FilterId.id
    },
    revisionRoadNetworks: {
      color: mapStyleConfigColors.orange,
      opacity: 0.4
    },
    roadNetworkNodes: {
      color: mapStyleConfigColors.lightGray,
      strokeColor: mapStyleConfigColors.darkGray,
      strokeWidth: 2
    },
    unifiedSections: {
      color: mapStyleConfigColors.lightPurple,
      lineWidth: 6
    },
    flowDirection: {
      color: mapStyleConfigColors.black,
      zoom: mapZoom.assetsZoom,
      opacity: 0.4
    }
  },
  projectPins: {
    minZoom: mapZoom.boroughMinZoom,
    maxZoom: 0,
    cluster: false,
    clusterMaxZoom: 14
  },
  projectArea: {
    minZoom: 14,
    halo: {
      opacity: 1
    },
    area: {
      opacity: 0.3
    }
  },
  layouts: {
    'line-rounded': {
      'line-cap': 'round',
      'line-join': 'round',
      'line-round-limit': 0
    } as LineLayout
  },
  pins: {
    opacity: ['case', ['get', '_highlighted'], 1, 0.25] as Expression
  }
};

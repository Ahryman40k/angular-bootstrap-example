/**
 * LayerManagerGroupIds must match Taxonomy code under TaxonomyGroup: "mapAssetLogicLayer".
 */
export enum LayerManagerGroupIds {
  AQUEDUCTS = 'aqueductSegment',
  ALLEYS = 'alley',
  AQUEDUCT_ACCESSORY = 'aqueductAccessory',
  AQUEDUCT_ENTRANCE_SEGMENTS = 'aqueductEntranceSegment',
  AQUEDUCT_JOINS = 'aqueductJoin',
  AQUEDUCT_VALVE_CHAMBERS = 'aqueductValveChamber',
  AQUEDUCT_VALVES = 'aqueductValve',
  WATER_ENTRANCE_SERVICE = 'waterServiceEntrance',

  BIKE_PATHS = 'bikePath',
  CSEM = 'csem',
  CSEM_MASSIVES = 'csemMassive',
  CSEM_STRUCTURES = 'csemStructure',
  ENERGY = 'energy',
  FIRE_HYDRANTS = 'fireHydrant',
  FLOW_DIRECTION = 'flowDirection',
  GAS = 'gas',
  GREEN_SPACE = 'greenSpace',
  HIGHWAYS = 'highway',
  ILOTS = 'ilots',
  INTERSECTIONS = 'intersections',
  LEAD_GROUND = 'leadGround',
  MOBILITY = 'mobility',
  MOBILITY_AXIS = 'mobilityAxis',
  REVISION_ROAD_NETWORKS = 'revisionRoadNetwork',
  ROAD_NETWORK_ARTERIAL = 'roadNetworkArterial',
  ROAD_NETWORK_NODES = 'roadNetworkNode',
  SEWERS_ACCESSOIRIES = 'sewerAccessory',
  SEWER_CHAMBERS = 'sewerChamber',
  SEWER_DROP = 'sewerDrop',
  SEWER_JOINS = 'sewerJoin',
  SEWER_MANHOLE = 'sewerManhole',
  SEWER_SUMPS = 'sewerSump',
  SEWERS = 'sewerSegment',
  SHOPPING_STREET = 'shoppingStreet',
  TRANSPORT = 'transport',
  BUS = 'bus',
  BUS_STOP = 'busStop',
  BUS_LINE = 'busLine',
  SUBWAY = 'subway',
  UNDERGROUND_LINE = 'undergroundLine',
  METRO_STATION = 'metroStation',
  REM = 'rem',
  REM_STATION = 'remStation',
  UNIFIED_SECTIONS = 'unifiedSection',

  // HYdrography
  HYDROGRAPHY = 'hydrography',
  WATERCOURSES_DITCHES = 'watercoursesDitches',

  // Snow
  SNOW = 'snow',
  SENSITIVE_SITE = 'sensitiveSite',

  // Territory
  PUBLIC_DOMAIN = 'publicDomain',
  LEGAL_CADASTRE = 'legalCadastre',
  LOT_NUMBER = 'lotNumber',

  BUILDINGS_LOCATIONS = 'buildingsLocations',
  WATER_POINT = 'waterPoint',

  ANALYSIS_ELEMENTS = 'analysisElements',
  INTERVENTION_PLAN_2016 = 'interventionPlan2016',
  DRINKING_WATER = 'drinkingWater',
  WASTE_WATERS = 'wasteWaters',
  RAINY_WATERS = 'rainyWaters',
  UNIFIED_NODES = 'unifiedNodes',
  ROAD = 'road',

  // roadway
  ROADWAYS = 'roadway',
  SIDEWALK = 'sidewalk',
  AREA = 'area',

  SIGNALIZATION = 'signalization',
  TERMINALS = 'terminals',
  ELECTRICAL_TERMINAL = 'electricalTerminal',
  POLES = 'poles',
  INT_LOGICAL = 'intLogical',
  TRAFFIC_LIGHT = 'trafficLight',

  // lightning
  LIGHTNING = 'lightning',
  BARREL = 'barrel',
  CABLE = 'cable',

  // railway
  RAILWAY = 'railway',
  TRACK = 'track',

  // hydro
  HYDRO = 'hydro',
  HYDRO_LINE = 'hqLine',
  HYDRO_SUBSTATION = 'hqSubstation',
  PYLON = 'pylon',

  // furniture
  FURNITURE = 'furniture',
  BUS_SHELTER = 'busShelter',

  // Horticulture
  HORTICULTURE = 'horticulture',
  STREET_TREE = 'streetTree'
}

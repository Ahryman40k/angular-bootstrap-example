export enum AssetLayerGroupIds {
  ALLEYS = 'alley',
  AQUEDUCT_ENTRANCE_SEGMENTS = 'aqueductEntranceSegment',
  AQUEDUCT_JOINS = 'aqueductJoin',
  AQUEDUCT_VALVE_CHAMBERS = 'aqueductValveChamber',
  AQUEDUCT_VALVES = 'aqueductValve',
  AQUEDUCTS = 'aqueductSegment',
  BIKE_PATHS = 'bikePath',
  CSEM_MASSIVES = 'csemMassive',
  CSEM_STRUCTURES = 'csemStructure',
  FIRE_HYDRANTS = 'fireHydrant',
  GAS = 'gas',
  HIGHWAYS = 'highway',
  ROADWAYS = 'roadway',
  SEWER_CHAMBERS = 'sewerChamber',
  SEWER_JOINS = 'sewerJoin',
  SEWER_MANHOLE = 'sewerManhole',
  SEWER_SUMPS = 'sewerSump',
  SEWERS = 'sewerSegment',
  SIDEWALK = 'sidewalk'
}

export enum RoadwayIds {
  ROADWAY_ISLANDS = 'roadway-islands',
  ROADWAY_INTERSECTION = 'roadway-intersection'
}

const keys = Object.keys(AssetLayerGroupIds);
export const assetLayerGroupIds = keys.map(v => AssetLayerGroupIds[v]);

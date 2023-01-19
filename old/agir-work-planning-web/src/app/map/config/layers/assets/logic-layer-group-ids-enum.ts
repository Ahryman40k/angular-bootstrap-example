export enum LogicLayerGroupIds {
  HIGHWAYS = 'highways',
  ROAD_NETWORK_ARTERIAL = 'roadNetworkArterial',
  ROAD_NETWORK_NODES = 'roadNetworkNodes',
  ROADWAYS = 'roadways',
  UNIFIED_SECTIONS = 'unifiedSections'
}

const keys = Object.keys(LogicLayerGroupIds);
export const logicLayerGroupIds = keys.map(v => LogicLayerGroupIds[v]);

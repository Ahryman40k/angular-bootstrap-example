export enum LayerManagerSubGroupIds {
  AQUEDUCTS = 'aqueductSegment',
  BUS = 'bus',
  BUILDINGS_LOCATIONS = 'buildingsLocations',
  CIVIL_SECURITY = 'civilSecurity',
  CSEM = 'csem',
  EGOUTS = 'sewerSegment',
  FURNITURE = 'furniture',
  GAS = 'gas',
  HORTICULTURE = 'horticulture',
  HYDRO = 'hydro',
  HYDROGRAPHY = 'hydrography',
  INTERVENTION_PLAN_2016 = 'interventionPlan2016',
  LIGHTNING = 'lightning',
  MOBILITY = 'mobility',
  POLES = 'poles',
  PUBLIC_DOMAIN = 'publicDomain',
  RAILWAY = 'railway',
  REM = 'rem',
  ROADWAYS = 'roadway',
  SNOW = 'snow',
  SUBWAY = 'subway',
  TERMINALS = 'terminals',
  TRANSPORT = 'transport'
}

export type LayerManagerSubGroupIdsType =
  | LayerManagerSubGroupIds.AQUEDUCTS
  | LayerManagerSubGroupIds.BUS
  | LayerManagerSubGroupIds.BUILDINGS_LOCATIONS
  | LayerManagerSubGroupIds.CIVIL_SECURITY
  | LayerManagerSubGroupIds.CSEM
  | LayerManagerSubGroupIds.EGOUTS
  | LayerManagerSubGroupIds.FURNITURE
  | LayerManagerSubGroupIds.GAS
  | LayerManagerSubGroupIds.HORTICULTURE
  | LayerManagerSubGroupIds.HYDRO
  | LayerManagerSubGroupIds.HYDROGRAPHY
  | LayerManagerSubGroupIds.INTERVENTION_PLAN_2016
  | LayerManagerSubGroupIds.LIGHTNING
  | LayerManagerSubGroupIds.MOBILITY
  | LayerManagerSubGroupIds.PUBLIC_DOMAIN
  | LayerManagerSubGroupIds.POLES
  | LayerManagerSubGroupIds.RAILWAY
  | LayerManagerSubGroupIds.REM
  | LayerManagerSubGroupIds.ROADWAYS
  | LayerManagerSubGroupIds.SUBWAY
  | LayerManagerSubGroupIds.SNOW
  | LayerManagerSubGroupIds.TERMINALS
  | LayerManagerSubGroupIds.TRANSPORT;

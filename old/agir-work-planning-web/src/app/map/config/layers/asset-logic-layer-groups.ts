import { flatMap, mapValues } from 'lodash';
import { Layer } from 'mapbox-gl';

import { unifiedSections as unifiedSection } from '../layers/yearly-plans/unified-sections';
import { legalCadastre, lotNumber } from './administration/public-domain';
import { alleys as alley } from './assets/alleys';
import {
  aqueductAccessory,
  aqueductEntranceSegments as aqueductEntranceSegment,
  aqueductJoins as aqueductJoin,
  aqueductSegment,
  aqueductValveChambers as aqueductValveChamber,
  aqueductValves as aqueductValve,
  waterServiceEntrance
} from './assets/aqueducts';
import { electricalTerminal } from './assets/charging-stations';
import { csemMassives as csemMassive, csemStructures as csemStructure } from './assets/csem';
import { fireHydrants as fireHydrant } from './assets/fire-hydrants';
import { gas } from './assets/gas';
import { greenSpace } from './assets/green-spaces';
import { hqLine, hqSubstation, pylon } from './assets/hydro';
import { watercoursesDitches } from './assets/hydrography';
import { leadGround } from './assets/lead-ground';
import { barrel, cable, trafficLight } from './assets/lightning';
import { intLogical, poles } from './assets/poles';
import { track } from './assets/railway';
import { area, roadways as roadway, sidewalk } from './assets/roadways-sidewalk';
import {
  sewerAccessory,
  sewerChambers as sewerChamber,
  sewerJoins as sewerJoin,
  sewerManhole,
  sewers as sewerSegment,
  sewerSumps as sewerSump
} from './assets/sewers';
import { shoppingStreet } from './assets/shopping-street';
import { sensitiveSite, sewerDrop } from './assets/snow';
import { streetTree } from './assets/street-trees';
import { waterPoint } from './assets/water-point';
import { flowDirection } from './logic-layers/flow-direction';
import { highways as highway } from './logic-layers/highways';
import { mobilityAxis } from './logic-layers/mobility-axis';
import { bikePaths as bikePath } from './road-network/bike-paths';
import { revisionRoadNetworks as revisionRoadNetwork } from './road-network/revision-road-networks';
import { roadNetworkArterial, roadNetworkNodes as roadNetworkNode } from './road-network/road-network';
import { busLine, busStop } from './transport/bus';
import { busShelter } from './transport/busShelter';
import { remStation } from './transport/rem';
import { metroStation, undergroundLine } from './transport/subway';
import { drinkingWater, rainyWaters, road, unifiedNodes, wasteWaters } from './yearly-plans/interventionPlan';

/**
 * Assets layer like 'aqueductValves' must match "code": "aqueductValves"
 * most match code in the mongoDB taxonomy collection group:'mapAssetLogicLayer'.
 *
 * The order of the layers will be define by the 'displayOrder' in the taxonomy group:'mapAssetLogicLayer'.
 */
export const assetLogicLayerGroups: { [key: string]: Layer[] } = {
  alley,
  aqueductAccessory,
  aqueductEntranceSegment,
  aqueductJoin,
  aqueductSegment,
  aqueductValveChamber,
  aqueductValve,
  area,
  barrel,
  busStop,
  busLine,
  busShelter,
  cable,
  electricalTerminal,
  legalCadastre,
  lotNumber,
  bikePath,
  csemMassive,
  csemStructure,
  fireHydrant,
  gas,
  greenSpace,
  flowDirection,
  highway,
  leadGround,
  mobilityAxis,
  hqLine,
  hqSubstation,
  pylon,
  intLogical,
  poles,
  rainyWaters,
  revisionRoadNetwork,
  road,
  roadNetworkNode,
  roadway,
  remStation,
  sensitiveSite,
  sewerAccessory,
  sewerChamber,
  sewerDrop,
  sewerJoin,
  sewerManhole,
  sewerSegment,
  sewerSump,
  shoppingStreet,
  sidewalk,
  streetTree,
  undergroundLine,
  metroStation,
  roadNetworkArterial,
  track,
  trafficLight,
  unifiedNodes,
  unifiedSection,
  drinkingWater,
  wasteWaters,
  waterPoint,
  watercoursesDitches,
  waterServiceEntrance
};

export const assetLayerIds = flatMap(mapValues(assetLogicLayerGroups, layers => layers.map(layer => layer.id)));
export const assetSourceLayerIds = flatMap(
  mapValues(assetLogicLayerGroups, layers => layers.map(layer => layer['source-layer']))
);

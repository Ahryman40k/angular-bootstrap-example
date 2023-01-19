import { ILayerGroup } from '../../../../gis-components-lib/src/public-api';

import { occupancyZoneLayers } from './layers/occupancy-permits-layer';
import { ovniReportsLayers } from './layers/ovni-reports-layer';

export const customMapLayers: ILayerGroup = {
  occupancyZones: occupancyZoneLayers,
  ovniReports: ovniReportsLayers
};

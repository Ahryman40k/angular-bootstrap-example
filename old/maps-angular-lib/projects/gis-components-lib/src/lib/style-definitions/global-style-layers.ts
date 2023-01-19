import { Layer } from 'mapbox-gl';

import { basemapLabels } from './basemaps/basemap-labels';
import { colorBasemap } from './basemaps/color-basemap';
import { greyBasemap } from './basemaps/grey-basemap';
import { streetMarking } from './basemaps/street-marking-basemap';
import { buildings } from './layers/buildings';
import { boroughs } from './layers/cities-boroughs';
import { villeArrondissementsOfficiels } from './layers/decoupage-administratif';
import { egouts } from './layers/egouts';
import { fireHydrants } from './layers/fire-hydrants';

import {
  pi2016PotableWater,
  pi2016RainWater,
  pi2016RoadNetwork,
  pi2016RoadNodes,
  pi2016RoadSections,
  pi2016WasteWater
} from './layers/intervention-plan-2016';
import { arretInterdit, bornesDePaiement, parcometres, poteaux } from './layers/signalisation-entrave';

import { permitsDefault, permitsJaune } from './layers/occupancy-permits';
import { roadSections } from './layers/road-sections';
import { streetTrees } from './layers/street-trees';
import { intersections, pavementSections, sidewalks } from './layers/surfaces';
import { tools } from './layers/tools';
import { zoningWaste } from './layers/zoning-waste';

import { IThemeMapbox } from '../models/theme-of-layer';

export const globalMapLayers: { [key: string]: Layer[] | IThemeMapbox[] } = {
  // Basemap
  greyBasemap: greyBasemap as Layer[],
  colorBasemap,
  basemapLabels,
  streetMarking,

  // La couche des permis expose plusieurs thématiques
  permits: [
    {
      themeId: 'default',
      name: 'Défaut',
      layers: permitsDefault
    },
    {
      themeId: 'yellow',
      name: 'Jaune',
      layers: permitsJaune
    }
  ] as IThemeMapbox[],
  fireHydrants,
  streetTrees,
  zoningWaste,
  buildings,
  roadSections,

  // Surfaces
  pavementSections,
  intersections,
  sidewalks,

  // Plan d'interventions 2016
  pi2016PotableWater,
  pi2016RainWater,
  pi2016RoadNetwork,
  pi2016RoadNodes,
  pi2016RoadSections,
  pi2016WasteWater,

  // Signalisation et entraves
  arretInterdit,
  bornesDePaiement,
  parcometres,
  poteaux,

  // Decoupage administratifs
  villeArrondissementsOfficiels,

  // cities and boroughs
  boroughs,
  // Egouts
  egouts,

  // Tools
  tools
};

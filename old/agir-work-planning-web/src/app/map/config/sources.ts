import { ISources } from '@villemontreal/maps-angular-lib';

import { MapLayersSources } from './layers/map-enums';

const geomaticPlatform = '/api/it-platforms/geomatic/vector-tiles/maps/v1';
const geomaticPlatformSecured = '/api/it-platforms/geomatic/vector-tiles/secured/maps/v1';
const tilesFile = 'tiles.json';

export const mapSourcesSecured = [
  MapLayersSources.AQUEDUCS,
  MapLayersSources.CSEM,
  MapLayersSources.EAU_INSPECTION_PERMIS,
  MapLayersSources.ECLAIRAGE,
  MapLayersSources.EGOUTS,
  MapLayersSources.GAZ,
  MapLayersSources.HYDRO_QUEBEC,
  MapLayersSources.PLAN_INTERVENTION_2016,
  MapLayersSources.SECURITE_CIVILE
];

const assetsSources: ISources = {
  [MapLayersSources.AQUEDUCS]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.AQUEDUCS}/${tilesFile}`
  },
  [MapLayersSources.BORNES_RECHARGES]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.BORNES_RECHARGES}/${tilesFile}`
  },
  [MapLayersSources.CADASTRE_QUEBEC]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.CADASTRE_QUEBEC}/${tilesFile}`
  },
  [MapLayersSources.CSEM]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.CSEM}/${tilesFile}`
  },
  [MapLayersSources.EAU_INSPECTION_PERMIS]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.EAU_INSPECTION_PERMIS}/${tilesFile}`
  },
  [MapLayersSources.ECLAIRAGE]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.ECLAIRAGE}/${tilesFile}`
  },
  [MapLayersSources.EGOUTS]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.EGOUTS}/${tilesFile}`
  },
  [MapLayersSources.ESPACES_VERTS]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.ESPACES_VERTS}/${tilesFile}`
  },
  [MapLayersSources.GAZ]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.GAZ}/${tilesFile}`
  },
  [MapLayersSources.HORTICULTURE]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.HORTICULTURE}/${tilesFile}`
  },
  [MapLayersSources.HYDRO_QUEBEC]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.HYDRO_QUEBEC}/${tilesFile}`
  },
  [MapLayersSources.NEIGE]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.NEIGE}/${tilesFile}`
  },
  [MapLayersSources.RESEAU_ROUTIER]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.RESEAU_ROUTIER}/${tilesFile}`
  },
  [MapLayersSources.RESEAU_FERROVIAIRE]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.RESEAU_FERROVIAIRE}/${tilesFile}`
  },
  [MapLayersSources.RESEAU_HYDROGRAPHIQUE]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.RESEAU_HYDROGRAPHIQUE}/${tilesFile}`
  },
  [MapLayersSources.SECURITE_CIVILE]: {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.SECURITE_CIVILE}/${tilesFile}`
  },
  [MapLayersSources.SIGNALISATION_ENTRAVES]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.SIGNALISATION_ENTRAVES}/${tilesFile}`
  },
  [MapLayersSources.TRANSPORT_COMMUN]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.TRANSPORT_COMMUN}/${tilesFile}`
  },
  [MapLayersSources.VOIRIE]: {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.VOIRIE}/${tilesFile}`
  }
};

export const customMapSources: ISources = {
  ...assetsSources,
  'decoupages-administratifs': {
    type: 'vector',
    url: `${geomaticPlatform}/${MapLayersSources.DECOUPAGES_ADMINISTRATIFS}/${tilesFile}`
  },
  'plan-intervention-2016': {
    type: 'vector',
    url: `${geomaticPlatformSecured}/${MapLayersSources.PLAN_INTERVENTION_2016}/${tilesFile}`
  },
  'assets-pins': createGeoJsonSource(),
  'addresses-pins': createGeoJsonSource(),
  'count-by-borough': createGeoJsonSource(),
  'count-by-city': createGeoJsonSource(),
  'decision-required-pins': createGeoJsonSource(),
  'decision-required-not-wished-pins': createGeoJsonSource(),
  'decision-not-required-waiting-pins': createGeoJsonSource(),
  'dynamic-selection-radius': createGeoJsonSource(),
  'future-project-areas': createGeoJsonSource(),
  'future-rtu-project-areas': createGeoJsonSource(),
  'future-project-pins': createGeoJsonSource(),
  'future-rtu-project-pins': createGeoJsonSource(),
  'future-project-pins-highlighted': createGeoJsonSource(),
  'intervention-areas-secondary-decision-required': createGeoJsonSource(),
  'intervention-areas-secondary': createGeoJsonSource(),
  'intervention-areas': createGeoJsonSource(),
  'intervention-creation-areas': createGeoJsonSource(),
  'intervention-creation-halo': createGeoJsonSource(),
  'intervention-halo': createGeoJsonSource(),
  'intervention-pins': createGeoJsonSource(),
  'intervention-canceled-pins': createGeoJsonSource(),
  'intervention-accepted-pins': createGeoJsonSource(),
  'intervention-refused-pins': createGeoJsonSource(),
  'multiple-years-project-areas': createGeoJsonSource(),
  'past-project-areas': createGeoJsonSource(),
  'past-rtu-project-areas': createGeoJsonSource(),
  'past-project-pins': createGeoJsonSource(),
  'canceled-project-pins': createGeoJsonSource(),
  'planned-project-pins': createGeoJsonSource(),
  'postponed-project-pins': createGeoJsonSource(),
  'final-ordered-project-pins': createGeoJsonSource(),
  'replanned-project-pins': createGeoJsonSource(),
  'programmed-project-pins': createGeoJsonSource(),
  'past-rtu-project-pins': createGeoJsonSource(),
  'past-project-pins-highlighted': createGeoJsonSource(),
  'preliminary-ordered-project-pins': createGeoJsonSource(),
  'present-project-areas': createGeoJsonSource(),
  'present-planned-project-areas': createGeoJsonSource(),
  'present-postponed-project-areas': createGeoJsonSource(),
  'present-replanned-project-areas': createGeoJsonSource(),
  'multiple-years-planned-project-areas': createGeoJsonSource(),
  'multiple-years-postponed-project-areas': createGeoJsonSource(),
  'multiple-years-replanned-project-areas': createGeoJsonSource(),
  'past-planned-project-areas': createGeoJsonSource(),
  'future-planned-project-areas': createGeoJsonSource(),
  'present-rtu-project-areas': createGeoJsonSource(),
  'present-project-pins': createGeoJsonSource(),
  'present-rtu-project-pins': createGeoJsonSource(),
  'present-project-pins-highlighted': createGeoJsonSource(),
  'project-creation-areas': createGeoJsonSource(),
  'project-tmp-areas': createGeoJsonSource(),
  'object-pins': createGeoJsonSource(),
  'road-section-highlight': createGeoJsonSource(),
  'road-section-hover': createGeoJsonSource(),
  'circle-comparison': createGeoJsonSource(),
  tools: createGeoJsonSource()
};

function createGeoJsonSource(): any {
  return {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [] as any
    },
    cluster: false
  };
}

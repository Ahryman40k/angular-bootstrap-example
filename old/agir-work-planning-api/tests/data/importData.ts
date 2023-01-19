import { Feature, LineString, MultiLineString, Point } from '@turf/turf';
import { IBicProject, IFeature, IGeometry, IShpProperty, ProjectStatus } from '@villemontreal/agir-work-planning-lib';

import { appUtils } from '../../src/utils/utils';

export function getShpProperty(): Feature<Point, IShpProperty>[] {
  const feat: Feature<Point, IShpProperty> = {
    geometry: {
      type: 'Point',
      coordinates: [-73.5672965960457, 45.49417413760267]
    },
    type: 'Feature',
    properties: {
      ID: '',
      NUM_REF: '',
      NOM: '',
      DESCR: '',
      PARTENAIRE: '',
      STATUT: null,
      TYPE: '',
      PHASE: '',
      PROB_REALI: '',
      INTERVNT: '',
      DT_SAISI: '',
      DT_DEBUT: '',
      DT_FIN: '',
      LOCALIS: '',
      projectId: '41434'
    }
  };
  return [feat];
}

export function getLineString(): LineString {
  return {
    type: 'LineString',
    coordinates: [
      [-73.56224964347537, 45.47921123498679],
      [-73.56298950128745, 45.47869860058386]
    ]
  };
}

export function getMultiLineString(): MultiLineString {
  return {
    type: 'MultiLineString',
    coordinates: [
      [
        [-73.55161970134819, 45.50812764660597],
        [-73.55215584413145, 45.50824768498107]
      ],
      [
        [-73.55379560216446, 45.50555772745773],
        [-73.55364193890476, 45.5058185831077],
        [-73.5533267087659, 45.50621467942572],
        [-73.55301523581132, 45.50659626764193],
        [-73.55279751602296, 45.50691292405264],
        [-73.55323424956266, 45.50708477122836],
        [-73.55355564546656, 45.507219984288355],
        [-73.55449692675164, 45.50764388675439]
      ],
      [
        [-73.55279751602296, 45.50691292405264],
        [-73.55248941767799, 45.507532346557305]
      ],
      [
        [-73.55080072866862, 45.50962562097396],
        [-73.55097988488782, 45.5096286969055],
        [-73.55144661688257, 45.50974815134236],
        [-73.55140244432665, 45.50988171677314],
        [-73.55127956550827, 45.510454908304524],
        [-73.55112197916351, 45.51113161498303]
      ]
    ]
  };
}

export function getPoint(): Point {
  return {
    type: 'Point',
    coordinates: [-73.5672965960457, 45.49417413760267]
  };
}

export function getPolygon(): any {
  return {
    type: 'Polygon' as any,
    coordinates: [
      [
        [-73.672062, 45.523886],
        [-73.671977, 45.524017],
        [-73.67191, 45.524111],
        [-73.671862, 45.524169],
        [-73.671838, 45.524202],
        [-73.671637, 45.524517],
        [-73.671636, 45.524519],
        [-73.671688, 45.524534],
        [-73.671817, 45.524322],
        [-73.671884, 45.524217],
        [-73.67191, 45.524185],
        [-73.671966, 45.524129],
        [-73.672006, 45.524082],
        [-73.672039, 45.524037],
        [-73.672093, 45.523954],
        [-73.672148, 45.523868],
        [-73.67216, 45.523861],
        [-73.672175, 45.523857],
        [-73.672093, 45.523839],
        [-73.672062, 45.523886]
      ]
    ]
  };
}

export function getInvalidPoint(): any {
  return { type: 'PointInvalid', coordinates: [-1, '3, 3', 1] };
}

export function getInvalidPolygon(): any {
  return {
    type: 'Polygon' as any,
    coordinates: [
      [
        [-1, 1],
        [-2, 1],
        [-3, 1],
        [-1, 1]
      ]
    ]
  };
}

export function getInvalidMultiLineString(): MultiLineString {
  return {
    type: 'MultiLineString',
    coordinates: [
      [
        [-1, 1],
        [-2, 1],
        [-3, 1],
        [-1, 1]
      ],
      [
        [-1, 1],
        [-2, 1],
        [-3, 1],
        [-1, 1]
      ]
    ]
  };
}

export function getInvalidLineString(): LineString {
  return {
    type: 'LineString',
    coordinates: [
      [-1, 1],
      [1, -1]
    ]
  };
}

export function getBicProject(): IBicProject {
  const currentYear = appUtils.getCurrentYear();
  const endYear = currentYear + 3;
  const bicProject: IBicProject = {
    ANNEE_ACTUELLE: currentYear.toString(),
    ANNEE_DEBUT: currentYear.toString(),
    ANNEE_FIN: endYear.toString(),
    ANNEE_PROGRAMATION: currentYear,
    ANNEE_REVISEE: currentYear - 1,
    ARRONDISSEMENT_AGIR: 'VM',
    CATEGORIE_PROJET: 'PARACHEVEMENT',
    CLASSIFICATION: 'PI',
    COMMENTAIRE_INTERVENTION: '',
    COMMENTAIRES_DI_BIC:
      '\n*2. Info Travaux *:\r\n- ARROND: Travaux de saillies allongées bordant le théâtre; intégrés au projet',
    COTE_GLOBALE: 2,
    COTE_PRIORITE_GLOBAL: 2,
    DESC_TYPE_TRAVAUX_TRC: 'Saillies ',
    DIVISION_REQUERANT_INITIAL: 'borough',
    ESTIMATION_BUDG_GLOBAL: '619491,5',
    ETAT_PROJET: 'Report',
    EXECUTANT_AGIR: 'di',
    ID_ARRONDISSEMENT: 19,
    ID_EXECUTANT: '9',
    ID_PROJET: '109139767550822007120143031960031106678',
    ID_TYPE_TRAVAUX_TRC: '152693299256416066048342546752478294219',
    LONGUEUR_GLOBAL: 0.123,
    LONGUEUR_INTERV_REQUERANT: 0,
    NO_PROJET: '41511',
    NOM_ARRONDISSEMENT: 'VILLE-MARIE',
    NOM_VOIE: 'Coupal (rue)',
    PROGRAMME: 'Programme ??',
    PROJET_REQUERANT: 'ARR',
    PROPRIETAIRE_ACTIF: 'borough',
    REQUERANT_AGIR: 'borough',
    REQUERANT_INITIAL: 'LY, KIM-HUOT',
    STATUT_INTERVENTION: 'integrated',
    STATUT_PROJET: ProjectStatus.programmed,
    TYPE_ACTIF_AGIR: 'amenagement',
    TYPE_INTERVENTION: 'initialNeed',
    TYPE_PROJET: 'integrated',
    TYPE_RESEAU: 'Local',
    TYPE_TRAVAUX_AGIR: 'amenagement',
    VOIE_A: 'Dufresne (rue)',
    VOIE_DE: 'Fullum (rue)',
    PROJET_NOM_VOIE: 'Sherbrooke (rue)',
    PROJET_VOIE_A: 'Ontario (rue)',
    PROJET_VOIE_DE: 'Crestson (rue)',
    BUDGET_ANNEE_1: 619000,
    BUDGET_ANNEE_2: 0,
    BUDGET_ANNEE_3: 0
  };
  return bicProject as any;
}

export function getBicProjectFeature(geometry?: IGeometry): IFeature {
  const feature: IFeature = {
    type: 'Feature',
    properties: {
      DESCR:
        "_EXE: DI - 415110\n(initialement même soumission qu'Iberville PI 19.107; 285401)\nProjet reporté en 2020 (initialement en 2019 avec soumission Iberville)\n\nDRE: Recon EG/AQ sec\nRecon chaussée par Service de l'Eau\nARROND: Travaux de saillies intégrés au proje",
      DT_DEBUT: '2020-05-01T04:00:00.000Z',
      DT_FIN: '2020-12-31T05:00:00.000Z',
      DT_SAISI: '2017-07-25T04:00:00.000Z',
      ID: '0920191002',
      INTERVNT: 'Mélissa Fachinetti',
      LOCALIS: 'Sur Coupal entre Fullum et Dufresne',
      NOM: '_41511 - Coupal entre Fullum et Dufresne',
      NUM_REF: '20191002',
      PARTENAIRE: 'Ville-Centre',
      PHASE: 'Avant projet',
      PROB_REALI: null,
      projectId: '41511',
      STATUT: 'Actif',
      TYPE: 'Reconstruction EGA'
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-73.55430135907622, 45.53004573489297],
        [-73.55373358365098, 45.530607970651275],
        [-73.55370824965966, 45.53081264186881],
        [-73.5536504573342, 45.53087969800576],
        [-73.55343822700053, 45.53112596633208]
      ]
    }
  };
  if (geometry) {
    feature.geometry = geometry;
  }
  return feature;
}

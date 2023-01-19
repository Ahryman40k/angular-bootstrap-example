import {
  ErrorCodes,
  IGeometry,
  IRtuExportLog,
  IRtuImportLog,
  IRtuProject,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { IFeature } from '@villemontreal/core-utils-geo-nodejs-lib';
import { assert } from 'chai';
import { cloneDeep } from 'lodash';

import { userMocks } from '../../../../tests/data/userMocks';
import { mergeProperties } from '../../../../tests/utils/testHelper';
import { IInfoRtuProject } from '../../../shared/rtuImport/infoRtuProject';
import { Audit } from '../../audit/audit';
import { IRtuContactProjectProps, RtuContactProject } from '../models/rtuContactProject';
import { IRtuImportErrorProps, RtuImportError } from '../models/rtuImportError';
import { IRtuImportLogProps, RtuImportLog, RtuImportStatus } from '../models/rtuImportLog';
import { IRtuProjectProps, RtuProject } from '../models/rtuProject';
import { IRtuProjectErrorProps, RtuProjectError } from '../models/rtuProjectError';

export interface IRankAndLog {
  rank: number;
  log: Partial<IRtuImportLogProps>;
}

export const BAD_DATE_FORMAT = 'XXX';
export const FROM_DATE_RTU_PROJECT = '2016-08-10';
export const TO_DATE_RTU_PROJECT = '2016-11-12';
export const REMOVE_GEOMETRY = ('REMOVE_GEOMETRY' as unknown) as IGeometry;

export const infoRtuPartnerPartnerIds = ['06', '08', '46', '48'];
export const infoRtuPartnerBoroughIds = [
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28'
];
export const infoRtuPartnerCityIds = ['29', '30', '31', '32', '33', '34', '35', '37', '38', '39', '41', '42', '43'];

export const rtuProjectsInvalidInputSearchTests = [
  {
    description: 'invalid fromDateStart',
    requestError: {
      fromDateStart: BAD_DATE_FORMAT
    },
    expectedErrors: [
      {
        succeeded: false,
        target: 'fromDateStart',
        code: ErrorCodes.InvalidInput,
        message: `Date is invalid, should be YYYY-MM-DDTHH:mm:ss.sssZ. Got ${BAD_DATE_FORMAT}`
      }
    ]
  },
  {
    description: 'invalid fromDateEnd',
    requestError: {
      fromDateEnd: BAD_DATE_FORMAT
    },
    expectedErrors: [
      {
        succeeded: false,
        target: 'fromDateEnd',
        code: ErrorCodes.InvalidInput,
        message: `Date is invalid, should be YYYY-MM-DDTHH:mm:ss.sssZ. Got ${BAD_DATE_FORMAT}`
      }
    ]
  },
  {
    description: 'invalid toDateStart',
    requestError: {
      toDateStart: BAD_DATE_FORMAT
    },
    expectedErrors: [
      {
        succeeded: false,
        target: 'toDateStart',
        code: ErrorCodes.InvalidInput,
        message: `Date is invalid, should be YYYY-MM-DDTHH:mm:ss.sssZ. Got ${BAD_DATE_FORMAT}`
      }
    ]
  },
  {
    description: 'invalid toDateEnd',
    requestError: {
      toDateEnd: BAD_DATE_FORMAT
    },
    expectedErrors: [
      {
        succeeded: false,
        target: 'toDateEnd',
        code: ErrorCodes.InvalidInput,
        message: `Date is invalid, should be YYYY-MM-DDTHH:mm:ss.sssZ. Got ${BAD_DATE_FORMAT}`
      }
    ]
  },
  {
    description: 'invalid bbox',
    requestError: {
      bbox: '-73.57118752198984,45.467047507449024'
    },
    expectedErrors: [
      {
        succeeded: false,
        target: 'bbox',
        code: ErrorCodes.InvalidInput,
        message: `bbox must have four positions`
      }
    ]
  }
];
export const rtuProjectsForbiddenSearchTests = [
  {
    description: 'external guest search',
    user: userMocks.externalGuest,
    requestError: {
      partnerId: undefined
    },
    expectedErrors: [
      {
        succeeded: false,
        target: 'partnerId',
        code: ErrorCodes.BusinessRule,
        message: `You are not allowed to view rtu projects with partner category`
      }
    ]
  },
  {
    description: 'planner search',
    user: userMocks.planner,
    requestError: {
      partnerId: infoRtuPartnerPartnerIds[1]
    },
    expectedErrors: [
      {
        succeeded: false,
        target: 'partnerId',
        code: ErrorCodes.BusinessRule,
        message: `You are not allowed to view rtu projects with partner category`
      }
    ]
  }
];
const rtuProjectName = "PIQA Centre Jardin - partie de l'étude 20140607";
const rtuProjectDuration = '6 semaines';
const rtuProjectType = 'Modifications au réseau de conduits souterrains';

const infoRtuProject: IInfoRtuProject = {
  id: '0420150983',
  name: rtuProjectName,
  description: null,
  productionPb: '75',
  conflict: null,
  duration: rtuProjectDuration,
  district: 'Sud-Ouest',
  idOrganization: '04',
  nomOrganization: null,
  noReference: '20150983',
  coordinate: {
    x: -73.56208038330078,
    y: 45.48292541503906
  },
  contact: {
    id: '0401008',
    officeId: '0401',
    num: '008',
    phone: '5143846840',
    cell: null,
    phoneExtensionNumber: '285',
    fax: null,
    email: 'msalgues@csem.qc.ca',
    prefix: 'Mme',
    name: 'Marlène Salgues',
    title: 'Chargée de projets - ingénieure',
    typeNotfc: null,
    paget: null,
    profile: 'FFFFFFFOO',
    globalRole: 'R',
    idInterim: null,
    inAutoNotification: null,
    inDiffusion: 'O',
    areaName: null,
    role: null,
    partnerType: null,
    partnerId: null
  },
  status: {
    name: 'AC',
    description: 'Actif'
  },
  type: {
    value: rtuProjectType,
    partnerId: '04',
    definition: rtuProjectType
  },
  phase: {
    value: 'Réalisation',
    definition: 'Réalisation'
  },
  dateStart: 1439179200000,
  dateEnd: 1447304400000,
  dateEntry: 1436760000000,
  dateModification: 1438228800000,
  places: [
    {
      text: null,
      type: 'INTERVAL',
      sections: null,
      intersection: null,
      interval: {
        geometries: [
          '{"type":"LineString","coordinates":[[-73.5620763359711,45.482905997877864],[-73.56296321231514,45.48236137543931]]}'
        ]
      },
      polygon: null,
      address: null,
      geoJsonGeometry: null
    }
  ],
  cancellationReason: null,
  localization: 'Sur Centre entre Shearer et Jardin',
  rueSur: 'Centre',
  rueDe: 'Shearer',
  rueA: 'Jardin',
  hasEditPermission: true
};

const rtuProjectContactProps: IRtuContactProjectProps = {
  officeId: '0401',
  num: '008',
  prefix: 'Mme',
  name: 'Marlène Salgues',
  title: 'Chargée de projets - ingénieure',
  email: 'msalgues@csem.qc.ca',
  phone: '5143846840',
  phoneExtensionNumber: '285',
  cell: null,
  fax: null,
  typeNotfc: null,
  paget: null,
  profile: 'FFFFFFFOO',
  globalRole: 'R',
  idInterim: null,
  inAutoNotification: null,
  inDiffusion: null,
  areaName: null,
  role: null,
  partnerType: null,
  partnerId: null
};

const audit: Audit = Audit.fromCreateContext();
export const geometrieProject = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.5629217810358, 45.4823282097113],
      [-73.562956801103, 45.4823175603157],
      [-73.562992600413, 45.4823224471605],
      [-73.5630191410944, 45.4823416051582],
      [-73.5630255615714, 45.4823556482439],
      [-73.5630236918781, 45.4823734061447],
      [-73.5630046435945, 45.4823945411478],
      [-73.5621177672504, 45.4829391632657],
      [-73.5620942408768, 45.4829481804864],
      [-73.5620611674874, 45.4829487640999],
      [-73.5620218587324, 45.4829280178515],
      [-73.5620139867149, 45.4829117250173],
      [-73.5620154635949, 45.4828949600603],
      [-73.5620349046918, 45.4828728324705],
      [-73.5629217810358, 45.4823282097113]
    ]
  ]
} as IGeometry;
const rtuProjectProps: IRtuProjectProps = {
  audit,
  name: rtuProjectName,
  description: null,
  areaId: 'SO',
  partnerId: '04',
  noReference: '20150983',
  geometryPin: [-73.56208038330078, 45.48292541503906],
  geometry: geometrieProject,
  status: 'AC',
  type: rtuProjectType,
  phase: 'execution',
  dateStart: new Date(infoRtuProject.dateStart).toISOString(),
  dateEnd: new Date(infoRtuProject.dateEnd).toISOString(),
  dateEntry: new Date(infoRtuProject.dateEntry).toISOString(),
  dateModification: new Date(infoRtuProject.dateModification).toISOString(),
  cancellationReason: null,
  productionPb: '75',
  conflict: null,
  duration: rtuProjectDuration,
  localization: rtuProjectDuration,
  streetName: rtuProjectDuration,
  streetFrom: rtuProjectDuration,
  streetTo: rtuProjectDuration,
  contact: RtuContactProject.create(rtuProjectContactProps, '0401008').getValue()
};

const rtuImportLogProps: IRtuImportLogProps = {
  status: RtuImportStatus.SUCCESSFUL,
  audit,
  startDateTime: new Date().toISOString(),
  endDateTime: new Date(new Date().getTime() + 10000).toISOString()
};

export function getInfoRtuProject(props?: Partial<IInfoRtuProject>): IInfoRtuProject {
  return mergeProperties(infoRtuProject, props);
}

const taxonomy: ITaxonomy = {
  group: TaxonomyGroup.infoRtuPartner,
  code: '04',
  label: {
    en: 'CSEM',
    fr: 'CSEM'
  }
};
export const boroughFeatures: IFeature[] = [
  {
    type: 'Feature',
    id: 'arrondissements.16',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.629082, 45.448391],
          [-73.628814, 45.44829],
          [-73.627599, 45.449503],
          [-73.626998, 45.450143],
          [-73.626311, 45.450752],
          [-73.625551, 45.451317],
          [-73.622795, 45.453262],
          [-73.622324, 45.45359],
          [-73.622071, 45.453743],
          [-73.621498, 45.454106],
          [-73.620828, 45.454487],
          [-73.620114, 45.454826],
          [-73.613607, 45.457695],
          [-73.612102, 45.456952],
          [-73.606823, 45.454547],
          [-73.606596, 45.453902],
          [-73.60479, 45.448835],
          [-73.604783, 45.44871],
          [-73.604808, 45.448586],
          [-73.604855, 45.448478],
          [-73.604953, 45.448306],
          [-73.605072, 45.44814],
          [-73.605212, 45.447982],
          [-73.60537, 45.447833],
          [-73.605546, 45.447695],
          [-73.606887, 45.446492],
          [-73.609474, 45.444221],
          [-73.609775, 45.443934],
          [-73.610039, 45.44363],
          [-73.610264, 45.443311],
          [-73.61045, 45.442979],
          [-73.610593, 45.442637],
          [-73.6118, 45.43945],
          [-73.599397, 45.437485],
          [-73.594669, 45.44319],
          [-73.593577, 45.444291],
          [-73.592906, 45.444951],
          [-73.592213, 45.445644],
          [-73.592132, 45.445632],
          [-73.59062, 45.447628],
          [-73.590518, 45.447761],
          [-73.589542, 45.447976],
          [-73.587302, 45.450197],
          [-73.586897, 45.450564],
          [-73.586684, 45.450736],
          [-73.58652, 45.450858],
          [-73.58575, 45.451432],
          [-73.584187, 45.452513],
          [-73.584002, 45.452651],
          [-73.58329, 45.453266],
          [-73.583015, 45.45353],
          [-73.582709, 45.453845],
          [-73.582261, 45.45432],
          [-73.581897, 45.454789],
          [-73.581528, 45.455333],
          [-73.581249, 45.455811],
          [-73.581026, 45.456253],
          [-73.580841, 45.45668],
          [-73.580717, 45.457048],
          [-73.5805, 45.457929],
          [-73.580415, 45.458442],
          [-73.580383, 45.458699],
          [-73.580327, 45.459208],
          [-73.580317, 45.460074],
          [-73.580414, 45.460936],
          [-73.580696, 45.461901],
          [-73.58083, 45.462374],
          [-73.580959, 45.462919],
          [-73.58107, 45.464048],
          [-73.581077, 45.464512],
          [-73.581045, 45.464996],
          [-73.581001, 45.465376],
          [-73.580956, 45.46578],
          [-73.580925, 45.466022],
          [-73.580686, 45.466562],
          [-73.578868, 45.466481],
          [-73.578769, 45.467574],
          [-73.577701, 45.467526],
          [-73.577442, 45.467798],
          [-73.575954, 45.467731],
          [-73.576063, 45.466527],
          [-73.572645, 45.466382],
          [-73.572584, 45.466377],
          [-73.572553, 45.466377],
          [-73.572523, 45.46638],
          [-73.572493, 45.466384],
          [-73.572435, 45.466398],
          [-73.572407, 45.466407],
          [-73.572381, 45.466419],
          [-73.572356, 45.466431],
          [-73.572312, 45.466461],
          [-73.572293, 45.466478],
          [-73.572276, 45.466496],
          [-73.572261, 45.466515],
          [-73.572239, 45.466555],
          [-73.572231, 45.466576],
          [-73.572227, 45.466597],
          [-73.572225, 45.466619],
          [-73.572004, 45.468855],
          [-73.571868, 45.470273],
          [-73.57172, 45.472271],
          [-73.571407, 45.472509],
          [-73.571704, 45.472834],
          [-73.57184, 45.473102],
          [-73.572345, 45.474103],
          [-73.572114, 45.474161],
          [-73.570829, 45.474419],
          [-73.570516, 45.474474],
          [-73.570197, 45.47451],
          [-73.569875, 45.474527],
          [-73.569552, 45.474523],
          [-73.569231, 45.4745],
          [-73.568914, 45.474457],
          [-73.568603, 45.474395],
          [-73.568302, 45.474314],
          [-73.568011, 45.474214],
          [-73.565117, 45.473107],
          [-73.562977, 45.472291],
          [-73.563085, 45.472152],
          [-73.560973, 45.47134],
          [-73.559741, 45.470884],
          [-73.556435, 45.469712],
          [-73.553877, 45.468804],
          [-73.553432, 45.468856],
          [-73.552937, 45.468943],
          [-73.552456, 45.469061],
          [-73.55199, 45.469207],
          [-73.551779, 45.469302],
          [-73.550878, 45.469758],
          [-73.550037, 45.470267],
          [-73.549262, 45.470825],
          [-73.546021, 45.473118],
          [-73.542847, 45.474898],
          [-73.54206, 45.475346],
          [-73.540931, 45.475866],
          [-73.539167, 45.47647],
          [-73.538909, 45.476535],
          [-73.538445, 45.476594],
          [-73.538163, 45.4766],
          [-73.537774, 45.476594],
          [-73.537384, 45.476559],
          [-73.536838, 45.476504],
          [-73.536116, 45.476426],
          [-73.535551, 45.476354],
          [-73.535398, 45.476326],
          [-73.534905, 45.476238],
          [-73.534184, 45.476081],
          [-73.529036, 45.474914],
          [-73.528214, 45.480468],
          [-73.527734, 45.483834],
          [-73.527475, 45.485808],
          [-73.527349, 45.486847],
          [-73.527288, 45.48752],
          [-73.527273, 45.487704],
          [-73.527208, 45.488298],
          [-73.527182, 45.488909],
          [-73.527167, 45.489785],
          [-73.527176, 45.490234],
          [-73.527202, 45.490688],
          [-73.527242, 45.491189],
          [-73.527314, 45.491666],
          [-73.527429, 45.492304],
          [-73.529726, 45.491524],
          [-73.535406, 45.489591],
          [-73.539913, 45.488053],
          [-73.540251, 45.488185],
          [-73.540604, 45.488295],
          [-73.540969, 45.488384],
          [-73.541257, 45.488436],
          [-73.549313, 45.489991],
          [-73.549486, 45.490028],
          [-73.549668, 45.490073],
          [-73.5499, 45.490136],
          [-73.550089, 45.490192],
          [-73.550267, 45.490251],
          [-73.550481, 45.490327],
          [-73.550689, 45.490408],
          [-73.550851, 45.490478],
          [-73.550968, 45.490528],
          [-73.551138, 45.490609],
          [-73.551345, 45.490715],
          [-73.551516, 45.490808],
          [-73.551767, 45.490956],
          [-73.551989, 45.491107],
          [-73.55275, 45.49166],
          [-73.553445, 45.492459],
          [-73.553822, 45.493028],
          [-73.554279, 45.494171],
          [-73.554642, 45.494919],
          [-73.555098, 45.49544],
          [-73.555638, 45.495852],
          [-73.556069, 45.496066],
          [-73.558656, 45.497065],
          [-73.559546, 45.497437],
          [-73.561382, 45.498317],
          [-73.562343, 45.496473],
          [-73.563093, 45.495251],
          [-73.563839, 45.494157],
          [-73.564501, 45.493265],
          [-73.567179, 45.490093],
          [-73.568733, 45.490853],
          [-73.572628, 45.492723],
          [-73.573023, 45.492903],
          [-73.574876, 45.491561],
          [-73.576184, 45.490554],
          [-73.577016, 45.489984],
          [-73.578276, 45.488995],
          [-73.578823, 45.488509],
          [-73.580321, 45.487503],
          [-73.580773, 45.487201],
          [-73.581536, 45.486744],
          [-73.580644, 45.485585],
          [-73.584273, 45.483066],
          [-73.585125, 45.482232],
          [-73.586149, 45.482704],
          [-73.586572, 45.482413],
          [-73.589375, 45.480434],
          [-73.590874, 45.479403],
          [-73.591711, 45.478818],
          [-73.5927, 45.478139],
          [-73.593769, 45.477401],
          [-73.595136, 45.476445],
          [-73.59646, 45.473418],
          [-73.597938, 45.472579],
          [-73.597992, 45.472567],
          [-73.598884, 45.472091],
          [-73.599089, 45.471882],
          [-73.599376, 45.47173],
          [-73.600728, 45.470534],
          [-73.601272, 45.470055],
          [-73.601804, 45.469635],
          [-73.60259, 45.469053],
          [-73.603169, 45.469104],
          [-73.604715, 45.468184],
          [-73.605628, 45.467604],
          [-73.605846, 45.467288],
          [-73.606607, 45.467055],
          [-73.607201, 45.466664],
          [-73.608266, 45.466289],
          [-73.611607, 45.464765],
          [-73.611816, 45.464918],
          [-73.612063, 45.464859],
          [-73.612118, 45.464887],
          [-73.615179, 45.463519],
          [-73.618228, 45.462231],
          [-73.619793, 45.461676],
          [-73.619961, 45.461751],
          [-73.624325, 45.45866],
          [-73.626205, 45.457492],
          [-73.628543, 45.455396],
          [-73.628534, 45.455346],
          [-73.63146, 45.452759],
          [-73.634663, 45.451094],
          [-73.635305, 45.450772],
          [-73.632029, 45.449501],
          [-73.629082, 45.448391]
        ]
      ]
    },
    geometry_name: 'geom',
    properties: {
      id: 185219,
      nomUnique: '15',
      nomArrond: 'Le Sud-Ouest',
      rrvaNumArrPti: '21',
      dateDebut: '2011-11-22T00:00:00',
      dateFin: ''
    }
  }
];
export function getTaxonomy(props?: Partial<ITaxonomy>): ITaxonomy {
  return mergeProperties(taxonomy, props);
}
const rtuImportErrorProps: IRtuImportErrorProps = {
  code: ErrorCodes.MissingValue,
  target: '',
  values: undefined
};

export function getRtuImportErrorProps(props?: Partial<IRtuImportErrorProps>): IRtuImportErrorProps {
  return mergeProperties(rtuImportErrorProps, props);
}

export function getRtuImportError(props?: Partial<IRtuImportErrorProps>, id?: string): RtuImportError {
  const result = RtuImportError.create(getRtuImportErrorProps(props), id);
  return result.getValue();
}

const rtuProjectErrorProps: IRtuProjectErrorProps = {
  projectId: '0420150983',
  projectNoReference: '20150983',
  projectName: rtuProjectName,
  streetName: 'Centre',
  streetFrom: 'Shearer',
  streetTo: 'Jardin',
  errorDetails: []
};

export function getRtuProjectErrorProps(props?: Partial<IRtuProjectErrorProps>): IRtuProjectErrorProps {
  return mergeProperties(rtuProjectErrorProps, props);
}

export function getRtuProjectError(props?: Partial<IRtuProjectErrorProps>, id?: string): RtuProjectError {
  const result = RtuProjectError.create(getRtuProjectErrorProps(props), id);
  return result.getValue();
}

export function assertRtuProjectError(savedRtuProjectError: RtuProjectError, expectedRtuProjectError: RtuProjectError) {
  assert.strictEqual(savedRtuProjectError.projectId, expectedRtuProjectError.projectId);
  assert.strictEqual(savedRtuProjectError.projectNoReference, expectedRtuProjectError.projectNoReference);
  assert.strictEqual(savedRtuProjectError.projectName, expectedRtuProjectError.projectName);
  for (const [i, errorDetail] of savedRtuProjectError.errorDetails.entries()) {
    assert.strictEqual(errorDetail.code, expectedRtuProjectError.errorDetails[i].code);
    assert.strictEqual(errorDetail.target, expectedRtuProjectError.errorDetails[i].target);
    assert.deepEqual(errorDetail.values, expectedRtuProjectError.errorDetails[i].values);
  }
}

export function assertRtuProject(savedRtuProject: RtuProject, expectedRtuProject: RtuProject) {
  const expectedRtuProjectClone = cloneDeep(expectedRtuProject);
  const savedRtuProjectClone = cloneDeep(savedRtuProject);
  ['audit', 'dateEnd', 'dateStart', 'dateEntry', 'dateModification'].forEach(keyName => {
    delete savedRtuProjectClone.props[keyName];
    delete expectedRtuProjectClone.props[keyName];
  });
  assert.deepEqual(savedRtuProjectClone, expectedRtuProjectClone);
}

export function assertDtoRtuProject(savedRtuProject: IRtuProject, expectedRtuProject: IRtuProject, message?: string) {
  const savedRtuProjectClone = cloneDeep(savedRtuProject);
  const expectedRtuProjectClone = cloneDeep(expectedRtuProject);
  delete savedRtuProjectClone.audit;
  delete expectedRtuProjectClone.audit;
  assert.deepEqual(savedRtuProjectClone, expectedRtuProjectClone, message);
}

export function assertDtoRtuImportLog(actual: IRtuImportLog, expected: IRtuImportLog) {
  assert.strictEqual(actual.id, expected.id);
  assert.strictEqual(actual.status, expected.status);
  assert.strictEqual(actual.startDateTime, expected.startDateTime);
  assert.strictEqual(actual.endDateTime, expected.endDateTime);
  assert.strictEqual(actual.errorDescription, expected.errorDescription);
  assert.deepEqual(actual.failedProjects, expected.failedProjects);
}

export function assertDtoRtuExportLog(actual: IRtuExportLog, expected: IRtuExportLog) {
  assert.strictEqual(actual.id, expected.id);
  assert.strictEqual(actual.status, expected.status);
  assert.strictEqual(actual.startDateTime, expected.startDateTime);
  assert.strictEqual(actual.endDateTime, expected.endDateTime);
  assert.strictEqual(actual.errorDescription, expected.errorDescription);
  assert.deepEqual(actual.projects, expected.projects);
}

export function getRtuProjectProps(props?: Partial<IRtuProjectProps>): IRtuProjectProps {
  const newRtuProjectProps = mergeProperties(rtuProjectProps, props);
  if (props?.geometry) {
    newRtuProjectProps.geometry = props.geometry;
  }
  if (props?.geometry === REMOVE_GEOMETRY) {
    delete newRtuProjectProps.geometry;
  }
  return newRtuProjectProps;
}

export function getRtuProject(props?: Partial<IRtuProjectProps>, id?: string): RtuProject {
  const result = RtuProject.create(getRtuProjectProps(props), id ?? '0420150983');
  return result.getValue();
}

export function getRtuImportLogProps(props?: Partial<IRtuImportLogProps>): IRtuImportLogProps {
  return mergeProperties(rtuImportLogProps, props);
}

export function getRtuImportLog(props?: Partial<IRtuImportLogProps>, id?: string): RtuImportLog {
  const result = RtuImportLog.create(getRtuImportLogProps(props), id);
  return result.getValue();
}

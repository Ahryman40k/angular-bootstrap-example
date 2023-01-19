import {
  AssetType,
  BoroughCode,
  ExternalReferenceType,
  IEnrichedIntervention,
  InterventionDecisionType,
  InterventionStatus,
  InterventionType,
  MedalType,
  ProjectType,
  RoadNetworkType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { userMocks } from '../../../../../../tests/data/userMocks';
import {
  EXECUTOR_DEEU,
  EXECUTOR_DEP,
  PROGRAM_TYPE_PAR,
  REQUESTOR_BELL,
  REQUESTOR_DRE,
  WORK_TYPE_ABANDON,
  WORK_TYPE_REHABILITATION
} from '../../../../../shared/taxonomies/constants';

export const partiallyEnrichedInterventions: Partial<IEnrichedIntervention>[] = [
  {
    boroughId: BoroughCode.VM,
    status: InterventionStatus.accepted,
    interventionName: 'intervention1',
    programId: 'par',
    estimate: {
      allowance: 4000,
      burnedDown: 4000,
      balance: 4000
    },
    interventionYear: 2022,
    planificationYear: 2022,
    contact: 'Contact1',
    decisionRequired: true
  },
  {
    boroughId: BoroughCode.VM,
    status: InterventionStatus.integrated,
    interventionName: 'intervention2',
    programId: 'sae',
    estimate: {
      allowance: 1000,
      burnedDown: 1000,
      balance: 1000
    },
    interventionYear: 2022,
    planificationYear: 2022,
    contact: 'Contact2',
    decisionRequired: false
  },
  {
    boroughId: BoroughCode.ANJ,
    status: InterventionStatus.integrated,
    interventionName: 'intervention3',
    programId: 'null',
    estimate: {
      allowance: 0,
      burnedDown: 0,
      balance: 0
    },
    interventionYear: 2022,
    planificationYear: 2022,
    contact: 'Contact3',
    decisionRequired: false
  },
  {
    // Mandatory fields intervention
    interventionName: 'intervention4',
    interventionYear: 2023,
    planificationYear: 2023,
    executorId: EXECUTOR_DEP,
    interventionTypeId: InterventionType.initialNeed,
    workTypeId: WORK_TYPE_ABANDON,
    requestorId: REQUESTOR_BELL,
    boroughId: BoroughCode.OUT,
    assets: [],
    estimate: {},
    audit: {}
  },
  {
    // Intervention with values for all selectable fields
    boroughId: BoroughCode.PMR,
    status: InterventionStatus.accepted,
    interventionName: 'intervention5',
    estimate: {
      allowance: 203,
      burnedDown: 10,
      balance: 7
    },
    interventionYear: 2024,
    planificationYear: 2025,
    executorId: EXECUTOR_DEEU,
    decisions: [
      {
        id: '791335445',
        previousPlanificationYear: 2024,
        typeId: InterventionDecisionType.postponed,
        targetYear: 2025,
        text: 'Postponed text',
        audit: {}
      },
      {
        id: '64646148',
        typeId: InterventionDecisionType.accepted,
        text: 'Accepted text',
        audit: {
          createdAt: '2022-12-12T13:12:12.000Z',
          createdBy: {
            displayName: userMocks.admin.displayName,
            userName: userMocks.admin.userName
          }
        }
      },
      {
        id: '64646143',
        typeId: InterventionDecisionType.accepted,
        text: 'Accepted text older',
        audit: {
          createdAt: '2022-12-11T13:12:12.000Z',
          createdBy: {
            displayName: userMocks.admin.displayName,
            userName: userMocks.admin.userName
          }
        }
      },
      {
        id: '68178145',
        typeId: InterventionDecisionType.refused,
        refusalReasonId: 'mobility',
        text: 'refused XD',
        audit: {
          createdAt: '2022-12-12T13:12:12.000Z',
          createdBy: {
            displayName: userMocks.admin.displayName,
            userName: userMocks.admin.userName
          }
        }
      },
      {
        id: '68178145',
        typeId: InterventionDecisionType.revisionRequest,
        text: 'revision',
        audit: {
          createdAt: '2022-12-11T13:12:12.000Z',
          createdBy: {
            displayName: userMocks.admin.displayName,
            userName: userMocks.admin.userName
          }
        }
      },
      {
        id: '68178146',
        typeId: InterventionDecisionType.refused,
        refusalReasonId: 'mobility',
        text: 'and refused again',
        audit: {
          createdAt: '2022-12-12T14:12:12.000Z',
          createdBy: {
            displayName: userMocks.admin.displayName,
            userName: userMocks.admin.userName
          }
        }
      }
    ],
    interventionTypeId: InterventionType.initialNeed,
    workTypeId: WORK_TYPE_REHABILITATION,
    programId: PROGRAM_TYPE_PAR,
    assets: [
      {
        id: 'test-asset-1',
        typeId: AssetType['roadway-intersection'],
        ownerId: REQUESTOR_DRE,
        length: {
          value: 13,
          unit: 'm'
        }
      },
      {
        id: 'test-asset-2',
        typeId: AssetType['roadway-intersection'],
        ownerId: REQUESTOR_DRE,
        length: {
          value: 16.4,
          unit: 'ft'
        }
      }
    ],
    project: {
      id: 'id test de projet',
      typeId: ProjectType.integrated
    },
    requestorId: REQUESTOR_BELL,
    streetName: 'Cest la rue',
    streetFrom: 'Cest la rue de',
    streetTo: 'Cest la rue a',
    decisionRequired: true,
    medalId: MedalType.gold,
    contact: 'Le contact',
    roadNetworkTypeId: RoadNetworkType.arterial,
    externalReferenceIds: [
      { value: 'extref1', type: ExternalReferenceType.nexoReferenceNumber },
      { value: 'extref2', type: ExternalReferenceType.infoRtuId }
    ],
    audit: {
      createdAt: '2022-12-12T13:12:12.000Z',
      createdBy: {
        displayName: userMocks.admin.displayName,
        userName: userMocks.admin.userName
      }
    }
  }
];

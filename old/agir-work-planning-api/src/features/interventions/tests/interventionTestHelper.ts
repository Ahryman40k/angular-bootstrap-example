import {
  BoroughCode,
  IEnrichedIntervention,
  InterventionType,
  IPlainIntervention,
  RoadNetworkType
} from '@villemontreal/agir-work-planning-lib';
import { InterventionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { IRestrictionTestData } from '../../../shared/restrictions/tests/restrictionsValidator.test';
import {
  BASE_USER_RESTRICTIONS,
  DEFAULT_BOROUGH,
  DEFAULT_EXECUTOR,
  DEFAULT_REQUESTOR,
  OTHER_BOROUGH,
  OTHER_EXECUTOR,
  OTHER_REQUESTOR
} from '../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { EXECUTOR_DI, REQUESTOR_DRE, WORK_TYPE_RECONSTRUCTION } from '../../../shared/taxonomies/constants';
import { appUtils } from '../../../utils/utils';
import { getAssetProps } from '../../asset/tests/assetTestHelper';
import { getAudit } from '../../audit/test/auditTestHelper';
import { IInterventionProps, Intervention } from '../models/intervention';
import { IPlainInterventionProps, PlainIntervention } from '../models/plainIntervention';
import { interventionRepository } from '../mongo/interventionRepository';

export async function createIntervention(intervention: IEnrichedIntervention): Promise<IEnrichedIntervention> {
  return (await interventionRepository.save(intervention)).getValue();
}

// interventions.
const plainIntervention: IPlainIntervention = {
  interventionName: 'interventionName',
  interventionTypeId: InterventionType.initialNeed,
  workTypeId: WORK_TYPE_RECONSTRUCTION,
  requestorId: REQUESTOR_DRE,
  executorId: EXECUTOR_DI,
  boroughId: BoroughCode.VM,
  interventionYear: appUtils.getCurrentYear(),
  planificationYear: appUtils.getCurrentYear(),
  estimate: 10,
  status: InterventionStatus.accepted,
  contact: 'test',
  assets: [getAssetProps()],
  interventionArea: {
    isEdited: false,
    geometry: {
      type: 'Point',
      coordinates: [-73.557921, 45.492239]
    },
    geometryPin: [-73.557921, 45.492239]
  },
  roadSections: {
    type: 'FeatureCollection',
    features: [
      {
        geometry: {
          type: 'LineString',
          coordinates: [
            [-73.553554, 45.49549],
            [-73.554326, 45.495778]
          ]
        },
        properties: {
          id: 1030565,
          name: 'rue Duke',
          fromName: 'rue Wellington',
          toName: 'rue De la commune',
          scanDirection: 1,
          classification: 0
        },
        type: 'Feature',
        id: '32670'
      },
      {
        geometry: {
          type: 'LineString',
          coordinates: [
            [-73.55561256408691, 45.49636066013693],
            [-73.55552673339844, 45.49687204682633]
          ]
        },
        properties: {
          id: 1030565,
          name: 'rue Wellington',
          fromName: 'rue Prince',
          toName: 'rue Duke',
          scanDirection: 1,
          classification: 0
        },
        type: 'Feature',
        id: '32670'
      }
    ]
  }
};

const interventionProps: IInterventionProps = {
  ...getPlainInterventionProps(),
  audit: getAudit(),
  estimate: { allowance: 10, burnedDown: 0, balance: 10 }, // this variable exists in plainIntervention like number.
  roadNetworkTypeId: RoadNetworkType.local
};
export function getPlainInterventionProps(plain?: Partial<IPlainInterventionProps>): IPlainInterventionProps {
  return mergeProperties(plainIntervention, plain);
}

export function getPlainIntervention(
  props?: Partial<IPlainInterventionProps>
): PlainIntervention<IPlainInterventionProps> {
  return PlainIntervention.create(getPlainInterventionProps(props)).getValue();
}

export function getInterventionProps(props?: Partial<IInterventionProps>): IInterventionProps {
  return mergeProperties(interventionProps, {
    ...props
  });
}

export function getIntervention(props?: Partial<IInterventionProps>, id?: string): Intervention<IInterventionProps> {
  return Intervention.create(getInterventionProps(props), id).getValue();
}
// TODO: to return a Result<Intervention> we must update interventionRepository.
export async function createAndSaveIntervention(props?: Partial<IInterventionProps>): Promise<IEnrichedIntervention> {
  const intervention = getIntervention(getInterventionProps(props));
  return (await interventionRepository.save(intervention)).getValue();
}

// scenarios to test userRestrictions

export const interventionRestrictionsData: IRestrictionTestData<IPlainIntervention>[] = [
  {
    scenario: 'Positive should not return Forbidden when all restrictions are correct',
    props: { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR, requestorId: DEFAULT_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS
  },
  {
    // user have no restrictions
    scenario: 'Positive should not return Forbidden when user have no restrictions',
    props: { boroughId: OTHER_BOROUGH, executorId: OTHER_EXECUTOR, requestorId: OTHER_REQUESTOR },
    useRestrictions: {}
  },
  {
    // BOROUGH is different
    scenario: "Negative- should return Forbidden when BOROUGH restriction doesn't include intervention boroughId",
    props: { boroughId: OTHER_BOROUGH, executorId: DEFAULT_EXECUTOR, requestorId: DEFAULT_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // EXECUTOR is different
    scenario: "Negative- should return Forbidden when EXECUTOR restriction doesn't include intervention executorId",
    props: { boroughId: DEFAULT_BOROUGH, executorId: OTHER_EXECUTOR, requestorId: DEFAULT_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // REQUESTOR is different
    scenario: "Negative- should return Forbidden when REQUESTOR restriction doesn't include intervention requestorId",
    props: { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR, requestorId: OTHER_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  }
];
export const updateInterventionRestrictionsData: IRestrictionTestData<IPlainIntervention>[] = [
  {
    scenario: 'Negative- should return Forbidden when all restrictions are correct but update props are not',
    updateProps: { boroughId: OTHER_BOROUGH, executorId: OTHER_EXECUTOR, requestorId: OTHER_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    props: { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR, requestorId: DEFAULT_REQUESTOR },
    expectForbidden: true
  },
  ...interventionRestrictionsData
];

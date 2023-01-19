import {
  IEnrichedIntervention,
  IEnrichedProject,
  IRequirement,
  IUuid,
  RequirementTargetType,
  SubmissionRequirementSubtype,
  SubmissionRequirementType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isEmpty } from 'lodash';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
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
import { assertAudit, getAudit } from '../../audit/test/auditTestHelper';
import { createAndSaveIntervention } from '../../interventions/tests/interventionTestHelper';
import { createAndSaveProject } from '../../projects/tests/projectTestHelper';
import { IPlainRequirementProps } from '../models/plainRequirement';
import { Requirement } from '../models/requirement';
import { IRequirementItemProps, RequirementItem } from '../models/requirementItem';
import { IUpdateRequirementCommandProps } from '../useCases/updateRequirement/updateRequirementCommand';

const plainRequirementProps: IPlainRequirementProps = {
  items: [],
  typeId: undefined,
  subtypeId: undefined,
  text: 'test'
};
export async function getPlainRequirementProps(
  plainRequirement?: Partial<IPlainRequirementProps>
): Promise<IPlainRequirementProps> {
  if (isEmpty(plainRequirementProps.items)) {
    plainRequirementProps.items = [
      {
        id: 'I99999',
        type: RequirementTargetType.intervention
      }
    ];
  }

  const props: IPlainRequirementProps = {
    ...plainRequirementProps,
    typeId: SubmissionRequirementType.WORK,
    subtypeId: SubmissionRequirementSubtype.REHAB_EG_BEFORE_PCPR
  };
  return mergeProperties(props, plainRequirement);
}

export async function getUpdateRequirementProps(
  id: IUuid,
  plainRequirement?: Partial<IPlainRequirementProps>
): Promise<IUpdateRequirementCommandProps> {
  return {
    ...(await getPlainRequirementProps(plainRequirement)),
    id
  };
}

export function getRequirementItem(requirementItemProps: IRequirementItemProps): RequirementItem {
  return RequirementItem.create(requirementItemProps).getValue();
}

export async function getRequirement(plainRequirement?: Partial<IPlainRequirementProps>): Promise<Requirement> {
  const plainProps = await getPlainRequirementProps(plainRequirement);
  const requirementItems: RequirementItem[] = plainProps.items.map(item => getRequirementItem(item));
  return Requirement.create({
    ...plainProps,
    items: requirementItems,
    audit: getAudit()
  }).getValue();
}

export function getUnprocessableStatusRequirementItemTest(
  entity: IEnrichedProject | IEnrichedIntervention,
  targetType: RequirementTargetType
): any {
  return {
    requestError: {
      items: [{ id: entity.id, type: targetType }]
    },
    expectedErrors: [
      {
        succeeded: false,
        target: `Item ${entity.id} has a wrong status ${entity.status}`,
        code: ErrorCode.FORBIDDEN,
        message: `${entity.status} is a forbidden value`
      }
    ]
  };
}

export function assertRequirement(actual: IRequirement, expected: Partial<IRequirement>) {
  assert.strictEqual(actual.text, expected.text);
  assert.strictEqual(actual.typeId, expected.typeId);
  assert.strictEqual(actual.subtypeId, expected.subtypeId);

  assert.isTrue(
    actual.items.every(item => {
      return expected.items.some(exRequirementItem => exRequirementItem.id === item.id);
    })
  );
  assertAudit(actual.audit);
}

// items with valid restrictions  values
export const P_01 = 'P23213';
export const I_01 = 'I23213';
// items with different restrictions values
export const I_02 = 'I23214';
export const P_02 = 'P23214';
// create items to test user Restrictions
export async function createRequirementItems(): Promise<string[]> {
  return (
    await Promise.all([
      createAndSaveIntervention({
        id: I_01,
        boroughId: DEFAULT_BOROUGH,
        executorId: DEFAULT_EXECUTOR,
        requestorId: DEFAULT_REQUESTOR
      }),
      createAndSaveIntervention({
        id: I_02,
        boroughId: OTHER_BOROUGH,
        executorId: OTHER_EXECUTOR,
        requestorId: OTHER_REQUESTOR
      }),
      createAndSaveProject({
        id: P_01,
        boroughId: DEFAULT_BOROUGH,
        executorId: DEFAULT_EXECUTOR
      }),
      createAndSaveProject({
        id: P_02,
        boroughId: OTHER_BOROUGH,
        executorId: OTHER_EXECUTOR
      })
    ])
  ).map(el => el.id);
}

// scenarios to test userRestrictions
export const requirementRestrictionsData: IRestrictionTestData<IPlainRequirementProps>[] = [
  {
    scenario: 'Positive should not return Forbidden when all restrictions are correct',
    props: {
      items: [
        { id: I_01, type: RequirementTargetType.intervention },
        { id: P_01, type: RequirementTargetType.project }
      ]
    },
    useRestrictions: BASE_USER_RESTRICTIONS
  },
  {
    // user have no restrictions
    scenario: 'Positive should not return Forbidden when user have no restrictions',
    props: {
      items: [
        { id: I_01, type: RequirementTargetType.intervention },
        { id: P_01, type: RequirementTargetType.project }
      ]
    },
    useRestrictions: {}
  },
  {
    // BOROUGH is different for the intervention
    scenario: "Negative- should return Forbidden when BOROUGH restriction doesn't include intervention boroughId",
    props: { items: [{ id: I_02, type: RequirementTargetType.intervention }] },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // BOROUGH is different for the project
    scenario: "Negative- should return Forbidden when BOROUGH restriction doesn't include project boroughId",
    props: { items: [{ id: P_02, type: RequirementTargetType.project }] },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // BOROUGH is different for the project and intervention
    scenario:
      "Negative- should return Forbidden when BOROUGH restriction doesn't include project and intervention boroughId",
    props: {
      items: [
        { id: I_02, type: RequirementTargetType.intervention },
        { id: P_02, type: RequirementTargetType.project }
      ]
    },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // EXECUTOR is different for the intervention
    scenario: "Negative- should return Forbidden when EXECUTOR restriction doesn't include intervention executorId",
    props: { items: [{ id: I_02, type: RequirementTargetType.intervention }] },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // EXECUTOR is different for the project
    scenario: "Negative- should return Forbidden when EXECUTOR restriction doesn't include project executorId",
    props: { items: [{ id: P_02, type: RequirementTargetType.project }] },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // EXECUTOR is different for the project and intervention
    scenario:
      "Negative- should return Forbidden when EXECUTOR restriction doesn't include project and intervention executorId",
    props: {
      items: [
        { id: I_02, type: RequirementTargetType.intervention },
        { id: P_02, type: RequirementTargetType.project }
      ]
    },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // REQUESTOR is different for the intervention
    scenario: "Negative- should return Forbidden when REQUESTOR restriction doesn't include intervention requestorId",
    props: {
      items: [
        { id: I_02, type: RequirementTargetType.intervention },
        { id: P_01, type: RequirementTargetType.project }
      ]
    },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  }
];
// scenarios to test PUT controller
// for PUT we should test existing data and data from request body
export const updateRequirementRestrictionsTestData: IRestrictionTestData<IPlainRequirementProps>[] = [
  {
    scenario: 'Negative- should return Forbidden when existing props are correct and PUT requestBody is incorrect',
    // existing values are correct
    props: {
      items: [
        { id: I_01, type: RequirementTargetType.intervention },
        { id: P_01, type: RequirementTargetType.project }
      ]
    },
    // values from request body are incorrect
    updateProps: {
      items: [
        { id: I_02, type: RequirementTargetType.intervention },
        { id: P_02, type: RequirementTargetType.project }
      ]
    },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  ...requirementRestrictionsData
];

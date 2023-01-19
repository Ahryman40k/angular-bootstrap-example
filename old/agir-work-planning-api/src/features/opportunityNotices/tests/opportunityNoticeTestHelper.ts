import {
  IEnrichedOpportunityNotice,
  IEnrichedOpportunityNoticeResponse,
  IPlainNote,
  IPlainOpportunityNotice,
  IPlainOpportunityNoticeResponse,
  OpportunityNoticeResponsePlanningDecision,
  OpportunityNoticeResponseRequestorDecision,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib';
import { IPlainProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { configs } from '../../../../config/configs';
import { mergeProperties, NOT_FOUND_PROJECT_ID } from '../../../../tests/utils/testHelper';
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
import { enumValues } from '../../../utils/enumUtils';
import { TimeUnits } from '../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../utils/moment/momentUtils';
import { getInitialAsset } from '../../asset/tests/assetTestHelper';
import { assertAudit, getAudit, getDateUnitsAgo } from '../../audit/test/auditTestHelper';
import { IOpportunityNoticeProps, OpportunityNotice } from '../models/opportunityNotice';
import { IOpportunityNoticeResponseProps, OpportunityNoticeResponse } from '../models/opportunityNoticeResponse';
import { IPlainOpportunityNoticeProps } from '../models/plainOpportunityNotice';
import { IPlainOpportunityNoticeResponseProps } from '../models/plainOpportunityNoticeResponse';
import { opportunityNoticeRepository } from '../mongo/opportunityNoticeRepository';
import { assertOpportunityNoticeNotes, getEnrichedNote, getPlainNote } from './opportunityNoticeNotesTestHelper';

export const CONTACT_INFO = 'opportunityNoticeCreatedSevenDaysOld';
export const NUMBER_OF_OPPORTUNITY_BY_PROJECT = 10;
export const NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO = 2;
// add one day to avoid failure on summer/winter time
export const DAYS_AGO = configs.rules.opportunityNotice.outdatedInDays + 1;

const plainOpportunityNotice: IPlainOpportunityNoticeProps = {
  assets: [getInitialAsset()],
  contactInfo: undefined,
  followUpMethod: 'email',
  maxIterations: 1,
  notes: [getPlainNote()],
  object: 'object',
  projectId: NOT_FOUND_PROJECT_ID,
  requestorId: 'bell'
};

export async function createAndSaveOpportunityNotice(props?: Partial<IOpportunityNoticeProps>) {
  const opportunityNotice: OpportunityNotice = OpportunityNotice.create(getOpportunityNoticeProps(props)).getValue();
  return (await opportunityNoticeRepository.save(opportunityNotice)).getValue();
}

export function getPlainOpportunityNoticeProps(plain?: Partial<IPlainOpportunityNotice>): IPlainOpportunityNoticeProps {
  return mergeProperties(plainOpportunityNotice, plain);
}

export function getOpportunityNoticeProps(plain?: Partial<IPlainOpportunityNotice>): IOpportunityNoticeProps {
  const plainOpportunityNoticeProps = mergeProperties(plainOpportunityNotice, plain);
  return {
    ...plainOpportunityNoticeProps,
    notes: plainOpportunityNoticeProps.notes.map((note: IPlainNote) => getEnrichedNote(note.text)),
    audit: getAudit()
  };
}

const enrichedOpportunityNotice: IEnrichedOpportunityNotice = {
  ...getOpportunityNoticeProps(),
  status: OpportunityNoticeStatus.new,
  audit: getAudit()
};

export function getOpportunityNotice(props?: Partial<IEnrichedOpportunityNotice>): OpportunityNotice {
  const result = OpportunityNotice.create(getEnrichedOpportunityNotice(props));
  return result.getValue();
}

export function getEnrichedOpportunityNotice(enriched?: Partial<IEnrichedOpportunityNotice>): IOpportunityNoticeProps {
  return mergeProperties(enrichedOpportunityNotice, enriched);
}

export function assertOpportunityNotice(
  actual: IEnrichedOpportunityNotice,
  expected: Partial<IEnrichedOpportunityNotice>
) {
  const opportunityNoticeStatuses = enumValues(OpportunityNoticeStatus);

  assert.strictEqual(actual.projectId, expected.projectId);
  assert.strictEqual(actual.followUpMethod, expected.followUpMethod);
  assert.strictEqual(actual.maxIterations, expected.maxIterations);
  assert.strictEqual(actual.object, expected.object);
  assert.strictEqual(actual.requestorId, expected.requestorId);
  assert.isTrue(opportunityNoticeStatuses.includes(actual.status), `opportunity notice status ${actual.status}`);
  assertOpportunityNoticeNotes(actual.notes, expected.notes);
  assertAudit(actual.audit);
}

export function assertOpportunityNoticeExpandedAssets(actual: IEnrichedOpportunityNotice) {
  assert.isNotEmpty(actual.assets);
  assert.isTrue(actual.assets.every(asset => asset.hasOwnProperty('properties')));
  assert.isTrue(actual.assets.every(asset => asset.properties.hasOwnProperty('installationDate')));
}

const plainOpportunityNoticeResponse: IPlainOpportunityNoticeResponseProps = {
  requestorDecision: OpportunityNoticeResponseRequestorDecision.analyzing,
  requestorDecisionNote: 'une requestorDecisionNote',
  requestorDecisionDate: MomentUtils.now().toISOString(),
  planningDecisionNote: 'une planningDecisionNote',
  planningDecision: OpportunityNoticeResponsePlanningDecision.rejected
};

export function getPlainOpportunityNoticeResponse(
  plain?: Partial<IPlainOpportunityNoticeResponse>
): IPlainOpportunityNoticeResponse {
  return mergeProperties(plainOpportunityNoticeResponse, plain);
}

export function getOpportunityNoticeResponseProps(
  plain?: Partial<IPlainOpportunityNoticeResponse>
): IOpportunityNoticeResponseProps {
  const plainOpportunityNoticeResponseProps = mergeProperties(plainOpportunityNoticeResponse, plain);
  return {
    ...plainOpportunityNoticeResponseProps,
    audit: getAudit()
  };
}

export function getOpportunityNoticeResponse(props?: Partial<IEnrichedOpportunityNoticeResponse>) {
  return OpportunityNoticeResponse.create(getOpportunityNoticeResponseProps(props)).getValue();
}

export function assertOpportunityNoticeResponse(
  actual: IEnrichedOpportunityNoticeResponse,
  expected: Partial<IEnrichedOpportunityNoticeResponse>
) {
  const opportunityNoticeResponsePlanningDecision = enumValues(OpportunityNoticeResponsePlanningDecision);
  const opportunityNoticeResponseRequestorDecision = enumValues(OpportunityNoticeResponseRequestorDecision);
  assert.strictEqual(actual.planningDecisionNote, expected.planningDecisionNote);
  assert.strictEqual(actual.requestorDecisionNote, expected.requestorDecisionNote);
  assert.isTrue(
    opportunityNoticeResponsePlanningDecision.includes(actual.planningDecision),
    `opportunity notice response planning decision ${actual.planningDecision}`
  );
  assert.isTrue(
    opportunityNoticeResponseRequestorDecision.includes(actual.requestorDecision),
    `opportunity notice response requestor decision ${actual.requestorDecision}`
  );
  assertAudit(actual.audit);
}

export async function createOpportunityNoticesForTest(
  incomingProps: Partial<IEnrichedOpportunityNotice>,
  numberOfOpportunityNotice: number,
  daysAgo?: number
): Promise<OpportunityNotice[]> {
  const opportunityNotices: OpportunityNotice[] = [];
  const partialOpportunityNotice: Partial<IEnrichedOpportunityNotice> = {};
  if (daysAgo) {
    partialOpportunityNotice.audit = getAudit({ createdAt: getDateUnitsAgo(daysAgo, TimeUnits.DAY) });
    partialOpportunityNotice.contactInfo = CONTACT_INFO;
  }
  for (let i = 0; i < numberOfOpportunityNotice; i++) {
    const newOpportunityNotice = getOpportunityNotice({
      ...partialOpportunityNotice,
      ...incomingProps
    });
    opportunityNotices.push((await opportunityNoticeRepository.save(newOpportunityNotice)).getValue());
  }
  return opportunityNotices;
}

export function assertOpportunityNoticesStatus(opportunityNotices: IEnrichedOpportunityNotice[], contactInfo: string) {
  for (const found of opportunityNotices) {
    if (found.contactInfo === contactInfo) {
      assert.strictEqual(found.status, OpportunityNoticeStatus.inProgress);
    } else {
      assert.strictEqual(found.status, OpportunityNoticeStatus.new);
    }
  }
}

// scenarios to test userRestrictions
// provide props from both IPlainProject&IPlainOpportunityNotice
// boroughId & executorId for project
// requestorId for opportunityNotice
export const opportunityNoticeRestrictionsData: IRestrictionTestData<IPlainProject & IPlainOpportunityNotice>[] = [
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
    scenario: "Negative- should return Forbidden when BOROUGH restriction doesn't include project boroughId",
    props: { boroughId: OTHER_BOROUGH, executorId: DEFAULT_EXECUTOR, requestorId: DEFAULT_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // EXECUTOR is different
    scenario: "Negative- should return Forbidden when EXECUTOR restriction doesn't include project executorId",
    props: { boroughId: DEFAULT_BOROUGH, executorId: OTHER_EXECUTOR, requestorId: DEFAULT_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // REQUESTOR is different
    scenario:
      "Negative- should return Forbidden when REQUESTOR restriction doesn't include opportunityNotice requestorId",
    props: { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR, requestorId: OTHER_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  }
];
export const updateOpportunityNoticeRestrictionsData: IRestrictionTestData<
  IPlainProject & IPlainOpportunityNotice
>[] = [
  {
    scenario: 'Negative- should return Forbidden when all restrictions are correct but update props are not',
    props: { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR, requestorId: DEFAULT_REQUESTOR },
    updateProps: { boroughId: OTHER_BOROUGH, executorId: OTHER_EXECUTOR, requestorId: OTHER_REQUESTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  ...opportunityNoticeRestrictionsData
];

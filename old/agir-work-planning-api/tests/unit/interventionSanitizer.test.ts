import { IEnrichedIntervention, InterventionStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { after } from 'mocha';

import { interventionSanitizer } from '../../src/sanitizers/interventionSanitizer';
import { IRestrictionTestData } from '../../src/shared/restrictions/tests/restrictionsValidator.test';
import {
  BASE_USER_RESTRICTIONS,
  DEFAULT_REQUESTOR,
  OTHER_REQUESTOR
} from '../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { getEnrichedCompleteIntervention } from '../data/interventionData';
import { userMocks } from '../data/userMocks';
import { integrationAfter } from '../integration/_init.test';
import { userMocker } from '../utils/userUtils';

describe('Intervention Sanitizer', () => {
  after(async () => {
    await integrationAfter();
  });

  describe('User restrictions', () => {
    const propertiesToRemove: (keyof IEnrichedIntervention)[] = ['estimate'];

    const restrictionsTestData: IRestrictionTestData<{ requestorId: string; status: InterventionStatus }>[] = [
      {
        scenario: 'Positive should not remove properties when user is satisfying restrictions and status is wished',
        props: { requestorId: DEFAULT_REQUESTOR, status: InterventionStatus.wished },
        useRestrictions: BASE_USER_RESTRICTIONS
      },
      {
        scenario: 'Positive should not remove properties when user is satisfying restrictions and status is not wished',
        props: { requestorId: DEFAULT_REQUESTOR, status: InterventionStatus.accepted },
        useRestrictions: BASE_USER_RESTRICTIONS
      },
      {
        // user have no restrictions
        scenario: 'Positive should not remove properties when user have no restrictions and status is wished',
        props: { requestorId: OTHER_REQUESTOR, status: InterventionStatus.wished },
        useRestrictions: {}
      },
      {
        // REQUESTOR is different but status is not wished
        scenario:
          'Positive- should not remove properties when user is not satisfying restrictions and status is not wished',
        props: { requestorId: OTHER_REQUESTOR, status: InterventionStatus.accepted },
        useRestrictions: BASE_USER_RESTRICTIONS
      },
      {
        // REQUESTOR is different and status is wished
        scenario: 'Negative- should remove properties when user is not satisfying restrictions and status is wished',
        props: { requestorId: OTHER_REQUESTOR, status: InterventionStatus.wished },
        useRestrictions: BASE_USER_RESTRICTIONS,
        expectForbidden: true
      }
    ];

    restrictionsTestData.forEach(test => {
      it(test.scenario, () => {
        userMocker.mock(userMocks.admin);
        userMocker.mockRestrictions(test.useRestrictions);
        const intervention = getEnrichedCompleteIntervention(test.props);
        propertiesToRemove.forEach(property => {
          assert.isDefined(intervention[property]);
        });
        interventionSanitizer.sanitize(intervention);
        propertiesToRemove.forEach(property => {
          test.expectForbidden ? assert.isUndefined(intervention[property]) : assert.isDefined(intervention[property]);
        });
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });
});

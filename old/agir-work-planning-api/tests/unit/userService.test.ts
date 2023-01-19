import { User } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import sinon = require('sinon');
import { userService } from '../../src/services/userService';
import { IRestriction } from '../../src/shared/restrictions/userRestriction';

interface ITest {
  restrictions: IRestriction[];
  expectedRestrictions: IRestriction;
  scenario: string;
}

describe('User service', () => {
  const sandbox = sinon.createSandbox();
  after(() => {
    sandbox.restore();
  });
  describe('test get restrictions from current user', () => {
    beforeEach(() => {
      sandbox.restore();
    });
    const tests: ITest[] = [
      {
        restrictions: [
          { BOROUGH: ['1'], EXECUTOR: ['1'], REQUESTOR: ['1'] },
          { BOROUGH: ['2'], EXECUTOR: ['2'], REQUESTOR: ['2'] }
        ],
        expectedRestrictions: { BOROUGH: ['1', '2'], EXECUTOR: ['1', '2'], REQUESTOR: ['1', '2'] },
        scenario: 'Should merge restrictions when we have multiple'
      },
      {
        restrictions: [
          { BOROUGH: ['1'], EXECUTOR: ['1'], REQUESTOR: ['1'] },
          { BOROUGH: ['1', '2'], EXECUTOR: ['1', '2'], REQUESTOR: ['1', '2'] }
        ],
        expectedRestrictions: { BOROUGH: ['1', '2'], EXECUTOR: ['1', '2'], REQUESTOR: ['1', '2'] },
        scenario: 'Should merge restrictions and remove duplicating'
      },
      {
        restrictions: [
          { BOROUGH: ['1'], EXECUTOR: ['1'], REQUESTOR: ['1'] },
          { BOROUGH: ['1', '2'], EXECUTOR: ['1', '2'], REQUESTOR: ['1', '2'] },
          {},
          undefined
        ],
        expectedRestrictions: { BOROUGH: ['1', '2'], EXECUTOR: ['1', '2'], REQUESTOR: ['1', '2'] },
        scenario: 'Should merge restrictions when some restriction are undefined or empty'
      }
    ];
    tests.forEach(test => {
      it(test.scenario, () => {
        const mockCurrentUser: Partial<User> = {
          customData: test.restrictions.map(el => {
            return { restrictions: el };
          })
        };
        sinon.stub(userService, 'currentUser').get(() => mockCurrentUser);
        assert.deepEqual(userService.restrictions, test.expectedRestrictions);
      });
    });
  });
});

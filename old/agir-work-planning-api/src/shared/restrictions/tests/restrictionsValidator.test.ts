import { BoroughCode } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import sinon = require('sinon');

import { userService } from '../../../services/userService';
import { EXECUTOR_DI, REQUESTOR_BELL } from '../../taxonomies/constants';
import { RestrictionsValidator } from '../restrictionsValidator';
import { IRestriction, RestrictionType } from '../userRestriction';

interface ITest {
  restrictions: IRestriction;
  userRestrictions: IRestriction;
  types: RestrictionType[];
  isFailure: boolean;
  description: string;
}
// use this interface to test controllers and use cases
// T can be IEnrichedIntervention, IEnrichedProject, ...
export interface IRestrictionTestData<T> {
  scenario: string;
  props: Partial<T>;
  // used to test validation for many props
  multipleProps?: Partial<T>[];
  useRestrictions: IRestriction;
  // use these props to test put request body
  updateProps?: Partial<T>;
  // test if expected is HttpStatusCodes.FORBIDDEN or othe value
  // keep default value when expected status is different to HttpStatusCodes.FORBIDDEN
  expectForbidden?: boolean;
}

describe('Restrictions validator', () => {
  const sandbox = sinon.createSandbox();
  after(() => {
    sandbox.restore();
  });
  const tests: ITest[] = [
    {
      restrictions: { BOROUGH: [BoroughCode.AC], EXECUTOR: [EXECUTOR_DI], REQUESTOR: [REQUESTOR_BELL] },
      userRestrictions: undefined,
      types: [RestrictionType.BOROUGH],
      isFailure: false,
      description: 'should return ok when userRestrictions is undefined'
    },
    {
      restrictions: { BOROUGH: [BoroughCode.ANJ] },
      userRestrictions: { BOROUGH: [BoroughCode.AC] },
      types: [RestrictionType.EXECUTOR],
      isFailure: false,
      description: 'should return ok when user have no restriction on specific type (EXECUTOR) '
    },
    {
      restrictions: { BOROUGH: null },
      userRestrictions: { BOROUGH: [BoroughCode.AC] },
      types: [RestrictionType.BOROUGH],
      isFailure: true,
      description: 'should return failure when restrictions for specific type is null'
    },
    {
      restrictions: { BOROUGH: [BoroughCode.AC, BoroughCode.ANJ] },
      userRestrictions: { BOROUGH: [BoroughCode.AC] },
      types: [RestrictionType.BOROUGH],
      isFailure: true,
      description: 'should return failure when restrictions not include into userRestrictions'
    },
    {
      restrictions: { BOROUGH: [BoroughCode.AC] },
      userRestrictions: { BOROUGH: [BoroughCode.AC, BoroughCode.ANJ] },
      types: [RestrictionType.BOROUGH],
      isFailure: false,
      description: 'should return ok when restrictions are include into userRestrictions'
    },
    {
      restrictions: { BOROUGH: ['AC_)=AC'] },
      userRestrictions: { BOROUGH: ['AC-)=3-(*AC'] },
      types: [RestrictionType.BOROUGH],
      isFailure: false,
      description: 'should map restrictions and return ok when restrictions contain special caracters'
    }
  ];
  tests.forEach(test => {
    it(test.description, () => {
      sinon.stub(userService, 'restrictions').get(() => test.userRestrictions);
      const result = RestrictionsValidator.validate(test.types, test.restrictions);
      assert.equal(result.isFailure, test.isFailure);
    });
  });
});

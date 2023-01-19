import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { BoroughCode } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isArray } from 'lodash';
import superagent = require('superagent');

import { userMocker } from '../../../../tests/utils/userUtils';
import { UseCase } from '../../domain/useCases/useCase';
import { ForbiddenError } from '../../domainErrors/forbiddenError';
import { UseCaseError } from '../../logic/useCaseError';
import { EXECUTOR_BOROUGH, EXECUTOR_DI, REQUESTOR_BOROUGH, REQUESTOR_DRE } from '../../taxonomies/constants';
import { IRestriction } from '../userRestriction';
import { IRestrictionTestData } from './restrictionsValidator.test';

const RESTRICTION_ERROR_MESSAGE = 'user have restriction';
// use this method when we want to assert result coming from controller
export function assertRestrictions(expectForbidden: boolean, response: superagent.Response) {
  if (expectForbidden) {
    assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
    assert.isTrue(response.body.error.message.includes(RESTRICTION_ERROR_MESSAGE));
  } else if (response.status === HttpStatusCodes.FORBIDDEN) {
    // if we have forbidden we assert that is not due to user restriction
    assert.isFalse(response.body.error.message.includes(RESTRICTION_ERROR_MESSAGE));
  }
}

// use this method when we want to assert result coming from useCase
export async function assertUseCaseRestrictions<I, O>(
  test: IRestrictionTestData<any>,
  useCase: UseCase<I, O>,
  props: I
) {
  // mock user restrictions
  userMocker.mockRestrictions(test.useRestrictions);
  const result = await useCase.execute(props);
  if (test.expectForbidden) {
    assert.isTrue(result.isLeft());
    assert.isTrue(result.value.constructor === ForbiddenError);
    const error: UseCaseError = result.value.error as UseCaseError;
    const message = isArray(error.message) ? error.message : [error.message];
    assert.isTrue(message.some(el => el.includes(RESTRICTION_ERROR_MESSAGE)));
  } else if (result.isLeft()) {
    const error: UseCaseError = result.value.error as UseCaseError;
    const message = isArray(error.message) ? error.message : [error.message];
    // if we have forbidden we assert that is not due to user restriction
    assert.isFalse(message.some(el => el.includes(RESTRICTION_ERROR_MESSAGE)));
  }
  // remove user restrictions
  userMocker.mockRestrictions({});
}
// use these value to test positive case (should not return forbidden)
export const DEFAULT_BOROUGH = BoroughCode.AC;
export const DEFAULT_EXECUTOR = EXECUTOR_BOROUGH;
export const DEFAULT_REQUESTOR = REQUESTOR_BOROUGH;
// values different to DEFAULT
// use these values to test negative case (should return forbidden)
export const OTHER_BOROUGH = BoroughCode.ANJ;
export const OTHER_EXECUTOR = EXECUTOR_DI;
export const OTHER_REQUESTOR = REQUESTOR_DRE;
// set BASE_USER_RESTRICTIONS with default values
export const BASE_USER_RESTRICTIONS: IRestriction = {
  BOROUGH: [DEFAULT_BOROUGH],
  EXECUTOR: [DEFAULT_EXECUTOR],
  REQUESTOR: [DEFAULT_REQUESTOR]
};

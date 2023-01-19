import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isArray } from 'lodash';

import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { IRtuProjectFindOptionsProps } from '../../models/rtuProjectFindOptions';
import { rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { countByRtuProjectUseCase } from '../../useCases/countByRtuProject/countByRtuProjectUseCase';
import {
  getRtuProject,
  infoRtuPartnerCityIds,
  infoRtuPartnerPartnerIds,
  rtuProjectsForbiddenSearchTests,
  rtuProjectsInvalidInputSearchTests
} from '../rtuProjectTestHelper';

const POINT_CLAIRE_ID = 'PC';
// tslint:disable:max-func-body-length
describe(`CountByRtuProjectUseCase`, () => {
  function assetRtuCountBy(actual: ICountBy, expected: ICountBy): void {
    assert.strictEqual(actual.count, expected.count);
    assert.strictEqual(actual.id, expected.id);
  }

  describe(`Positive`, () => {
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      const rtuProjects = [
        getRtuProject({ areaId: POINT_CLAIRE_ID }, '1'),
        getRtuProject({ areaId: POINT_CLAIRE_ID, partnerId: infoRtuPartnerPartnerIds[0] }, '2'),
        getRtuProject({ areaId: POINT_CLAIRE_ID, partnerId: infoRtuPartnerPartnerIds[0] }, '3'),
        getRtuProject({ areaId: POINT_CLAIRE_ID, partnerId: infoRtuPartnerCityIds[0] }, '4'),
        getRtuProject({ areaId: POINT_CLAIRE_ID }, '5')
      ];
      await rtuProjectRepository.saveBulk(rtuProjects);
    });
    afterEach(async () => {
      userMocker.reset();
      await destroyDBTests();
    });

    it(`should return rtu project count when provided with area id`, async () => {
      const countByRtuProjectCommand: IRtuProjectFindOptionsProps = {
        criterias: {
          areaId: POINT_CLAIRE_ID
        },
        countBy: 'areaId'
      };
      const result = await countByRtuProjectUseCase.execute(countByRtuProjectCommand);
      assert.isTrue(result.isRight());
      assetRtuCountBy(result.value.getValue()[0], { count: 5, id: POINT_CLAIRE_ID });
    });

    it(`should return rtu project count when provided with area id and partner id`, async () => {
      const countByRtuProjectCommand: IRtuProjectFindOptionsProps = {
        criterias: {
          areaId: POINT_CLAIRE_ID,
          partnerId: infoRtuPartnerPartnerIds[0]
        },
        countBy: 'areaId'
      };
      const result = await countByRtuProjectUseCase.execute(countByRtuProjectCommand);
      assert.isTrue(result.isRight());
      assetRtuCountBy(result.value.getValue()[0], { count: 2, id: POINT_CLAIRE_ID });
    });

    it(`should return rtu project count with area id and partner id when planner has no rtu partner read permission`, async () => {
      userMocker.mock(userMocks.planner);
      const countByRtuProjectCommand: IRtuProjectFindOptionsProps = {
        criterias: {
          areaId: POINT_CLAIRE_ID,
          partnerId: infoRtuPartnerCityIds[0]
        },
        countBy: 'areaId'
      };
      const result = await countByRtuProjectUseCase.execute(countByRtuProjectCommand);
      assert.isTrue(result.isRight());
      assetRtuCountBy(result.value.getValue()[0], { count: 1, id: POINT_CLAIRE_ID });
    });

    it(`should return empty array when invalid areaId`, async () => {
      const countByRtuProjectCommand: IRtuProjectFindOptionsProps = {
        criterias: {
          areaId: 'asdf'
        },
        countBy: 'areaId'
      };
      const result = await countByRtuProjectUseCase.execute(countByRtuProjectCommand);
      assert.isTrue(result.isRight());
      assert.deepEqual(result.value.getValue(), []);
    });

    it(`should return a list of countBy when no criterias are provided`, async () => {
      const countByRtuProjectCommand: IRtuProjectFindOptionsProps = {
        criterias: {},
        countBy: 'areaId'
      };
      const result = await countByRtuProjectUseCase.execute(countByRtuProjectCommand);
      assert.isTrue(result.isRight());
      assert.isTrue(isArray(result.value.getValue()));
      assert.strictEqual(result.value.getValue().find((countBy: ICountBy) => countBy.id === POINT_CLAIRE_ID).count, 5);
    });

    it(`should return empty array when no countBy argument is provided`, async () => {
      const countByRtuProjectCommand: any = {
        criterias: {
          areaId: 'asdf'
        }
      };
      const result = await countByRtuProjectUseCase.execute(countByRtuProjectCommand);
      assert.isTrue(result.isRight());
      assert.deepEqual(result.value.getValue(), []);
    });
  });
  describe(`Negative`, () => {
    beforeEach(() => {
      userMocker.mock(userMocks.pilot);
    });
    afterEach(async () => {
      await destroyDBTests();
      userMocker.reset();
    });

    rtuProjectsInvalidInputSearchTests.forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const searchRtuProjectQuery: IRtuProjectFindOptionsProps = {
          criterias: { ...test.requestError },
          limit: 10,
          offset: 0
        };
        const result = await countByRtuProjectUseCase.execute(searchRtuProjectQuery);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    rtuProjectsForbiddenSearchTests.forEach(test => {
      it(`should return forbidden error when ${test.description} `, async () => {
        const searchRtuProjectQuery: IRtuProjectFindOptionsProps = {
          criterias: { ...test.requestError },
          limit: 10,
          offset: 0
        };
        userMocker.mock(test.user);
        const result = await countByRtuProjectUseCase.execute(searchRtuProjectQuery);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, ForbiddenError, 'should be ForbiddenError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });
});

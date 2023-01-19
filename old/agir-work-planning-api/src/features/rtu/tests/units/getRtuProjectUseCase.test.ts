import { ErrorCodes, IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests, mergeProperties } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { rtuProjectMapperDTO } from '../../mappers/rtuProjectMapperDTO';
import { rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { getRtuProjectUseCase } from '../../useCases/getRtuProject/getRtuProjectUseCase';
import { assertDtoRtuProject, getRtuProject } from '../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`GetRtuProjectUseCase`, () => {
  beforeEach(async () => {
    userMocker.mock(userMocks.pilot);
    await rtuProjectRepository.save(getRtuProject());
  });
  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    [
      {
        description: 'missing rtu project id',
        requestError: {
          id: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.MissingValue,
            message: `id is null or undefined`
          }
        ]
      },
      {
        description: 'invalid rtu project id',
        requestError: {
          id: ''
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: `id is empty`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const getRtuProjectCommand: IByIdCommandProps = {
          id: ''
        };
        const result = await getRtuProjectUseCase.execute(mergeProperties(getRtuProjectCommand, test.requestError));
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = result.value.error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  it(`should return errors when forbidden user ask a partner rtu project`, async () => {
    userMocker.mock(userMocks.externalGuest);

    const getRtuProjectCommand: IByIdCommandProps = {
      id: '0420150983'
    };
    const result = await getRtuProjectUseCase.execute(getRtuProjectCommand);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, ForbiddenError, 'should be ForbiddenError');
    const failures: IGuardResult[] = result.value.error.error;
    assertFailures(
      [failures],
      [
        {
          code: ErrorCodes.BusinessRule,
          message: 'You are not allowed to view rtu projects with partner category',
          succeeded: false,
          target: 'partnerId'
        }
      ]
    );
  });

  it(`should return notFoundError when given rtu project id do not exists`, async () => {
    const getRtuProjectCommand: IByIdCommandProps = {
      id: 'XXX'
    };
    const result = await getRtuProjectUseCase.execute(getRtuProjectCommand);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
  });

  describe(`with a pre-populated database`, () => {
    const project1 = getRtuProject();
    let project1Dto: IRtuProject = null;
    beforeEach(async () => {
      await rtuProjectRepository.save(project1);
      project1Dto = await rtuProjectMapperDTO.getFromModel(project1);
    });

    it(`should retrieve rtu project by id`, async () => {
      const existingRtuProject = await rtuProjectRepository.findById(project1.id);
      assert.isDefined(existingRtuProject);

      const getRtuProjectCommand: IByIdCommandProps = {
        id: project1.id
      };
      const result = await getRtuProjectUseCase.execute(getRtuProjectCommand);
      assert.isTrue(result.isRight());
      const rtuProjectFound = result.value.getValue() as IRtuProject;
      assertDtoRtuProject(rtuProjectFound, project1Dto);
    });
  });
});

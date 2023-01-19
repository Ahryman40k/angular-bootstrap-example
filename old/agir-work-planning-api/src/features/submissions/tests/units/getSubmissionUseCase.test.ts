import { ErrorCodes, ISubmission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { assertFailures, destroyDBTests, INVALID_UUID } from '../../../../../tests/utils/testHelper';
import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { Submission } from '../../models/submission';
import { submissionRepository } from '../../mongo/submissionRepository';
import { getSubmissionUseCase } from '../../useCases/getSubmission/getSubmissionUseCase';
import { assertSubmissions, createAndSaveSubmission } from '../submissionTestHelper';

// tslint:disable:max-func-body-length
describe(`GetSubmissionUseCase`, () => {
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    [
      {
        description: 'missing submissionNUmber',
        requestError: {
          submissionNumber: undefined
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
        description: 'invalid submissionNumber',
        requestError: {
          submissionNumber: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: `id has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const getSubmissionCommand: IByIdCommandProps = {
          id: test.requestError.submissionNumber
        };
        const result = await getSubmissionUseCase.execute(getSubmissionCommand);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = result.value.error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  it(`should return notFoundError when given submissionNumber do not exists`, async () => {
    const notFoundSubmissionNumber = `500150`;
    const getSubmissionCommand: IByIdCommandProps = {
      id: notFoundSubmissionNumber
    };
    const result = await getSubmissionUseCase.execute(getSubmissionCommand);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
  });

  describe(`with a pre-populated database`, () => {
    let currentSubmission: Submission;
    beforeEach(async () => {
      currentSubmission = await createAndSaveSubmission();
    });

    it(`should retrieve submission by submissionNumber`, async () => {
      const submissionInDatabase = await submissionMapperDTO.getFromModel(
        await submissionRepository.findById(currentSubmission.submissionNumber)
      );
      assert.isDefined(submissionInDatabase);

      const getSubmissionCommand: IByIdCommandProps = {
        id: currentSubmission.submissionNumber
      };
      const result = await getSubmissionUseCase.execute(getSubmissionCommand);
      assert.isTrue(result.isRight());
      const foundSubmission = result.value.getValue() as ISubmission;
      assertSubmissions(foundSubmission, submissionInDatabase);
    });
  });
});

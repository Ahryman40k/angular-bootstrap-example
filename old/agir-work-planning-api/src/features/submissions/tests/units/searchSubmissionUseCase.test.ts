import { ErrorCodes, ISubmission, SubmissionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import {
  assertFailures,
  destroyDBTests,
  INVALID_PROJECT_ID,
  INVALID_UUID,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { IPaginatedResult } from '../../../../utils/utils';
import { Submission } from '../../models/submission';
import { ISubmissionFindPaginatedOptionsProps } from '../../models/submissionFindPaginatedOptions';
import { submissionRepository } from '../../mongo/submissionRepository';
import { searchSubmissionUseCase } from '../../useCases/searchSubmission/searchSubmissionUseCase';
import { getSubmission } from '../submissionTestHelper';

// ==========================================
// Disabling some linting rules is OK in test files.
// tslint:disable:max-func-body-length
// ==========================================

describe(`searchSubmissionUseCase`, () => {
  describe(`Negative`, () => {
    [
      {
        description: 'submissionNumber is not valid',
        requestError: {
          submissionNumber: ['20001']
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'submissionNumber[0]',
            code: ErrorCodes.InvalidInput,
            message: `submissionNumber[0] has a bad format`
          }
        ]
      },
      {
        description: 'drmNumber is not valid',
        requestError: {
          drmNumber: ['20001']
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'drmNumber[0]',
            code: ErrorCodes.InvalidInput,
            message: `drmNumber[0] has a bad format`
          }
        ]
      },
      {
        description: 'programBookId is not valid',
        requestError: {
          programBookId: [INVALID_UUID]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'programBookId[0]',
            code: ErrorCodes.InvalidInput,
            message: `programBookId[0] has a bad format`
          }
        ]
      },
      {
        description: 'projectIds is not valid',
        requestError: {
          projectIds: [INVALID_PROJECT_ID]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectIds[0]',
            code: ErrorCodes.InvalidInput,
            message: `projectIds[0] has a bad format`
          }
        ]
      },
      {
        description: 'status is not valid',
        requestError: {
          status: ['wrongStatus']
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'status[0]',
            code: ErrorCodes.InvalidInput,
            message: `status[0] isn't oneOf the correct values in [\"${SubmissionStatus.VALID}\",\"${SubmissionStatus.INVALID}\"]. Got "wrongStatus".`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const searchSubmissionQuery: ISubmissionFindPaginatedOptionsProps = {
          criterias: { ...test.requestError },
          limit: 10,
          offset: 0
        };
        const result = await searchSubmissionUseCase.execute(searchSubmissionQuery);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`Positive`, () => {
    const DRM_NUMBER_1 = `5001`;
    const DRM_NUMBER_2 = `6001`;
    const SUBMISSION_NUMBER_1 = `${DRM_NUMBER_1}01`;
    const SUBMISSION_NUMBER_2 = `${DRM_NUMBER_1}02`;
    const SUBMISSION_NUMBER_3 = `${DRM_NUMBER_2}03`;
    const SUBMISSION_NUMBER_4 = `${DRM_NUMBER_2}04`;
    const PROGRAMBOOK_ID_1 = NOT_FOUND_UUID;
    const PROGRAMBOOK_ID_2 = '61b0fe82e5c785d78dbc8723';
    let submissions: Submission[];

    afterEach(async () => {
      await destroyDBTests();
    });

    beforeEach(async () => {
      const submission1 = getSubmission({
        submissionNumber: SUBMISSION_NUMBER_1,
        drmNumber: DRM_NUMBER_1,
        programBookId: PROGRAMBOOK_ID_1,
        projectIds: ['P00001', 'P00002'],
        status: SubmissionStatus.INVALID
      });
      const submission2 = getSubmission({
        submissionNumber: SUBMISSION_NUMBER_2,
        drmNumber: DRM_NUMBER_1,
        programBookId: PROGRAMBOOK_ID_1,
        projectIds: ['P00002', 'P00003'],
        status: SubmissionStatus.VALID
      });
      const submission3 = getSubmission({
        submissionNumber: SUBMISSION_NUMBER_3,
        drmNumber: DRM_NUMBER_2,
        programBookId: PROGRAMBOOK_ID_2,
        projectIds: ['P00004', 'P00005'],
        status: SubmissionStatus.INVALID
      });
      const submission4 = getSubmission({
        submissionNumber: SUBMISSION_NUMBER_4,
        drmNumber: DRM_NUMBER_2,
        programBookId: PROGRAMBOOK_ID_2,
        projectIds: ['P00006', 'P00007'],
        status: SubmissionStatus.VALID
      });
      submissions = [submission1, submission2, submission3, submission4];
      await submissionRepository.saveBulk(submissions);
    });

    [
      {
        description: 'submissionNumber',
        params: {
          submissionNumber: [SUBMISSION_NUMBER_1, SUBMISSION_NUMBER_2]
        },
        expected: [SUBMISSION_NUMBER_1, SUBMISSION_NUMBER_2]
      },
      {
        description: 'drmNumber',
        params: {
          drmNumber: [DRM_NUMBER_2]
        },
        expected: [SUBMISSION_NUMBER_3, SUBMISSION_NUMBER_4]
      },
      {
        description: 'programBookId',
        params: {
          programBookId: [PROGRAMBOOK_ID_1]
        },
        expected: [SUBMISSION_NUMBER_1, SUBMISSION_NUMBER_2]
      },
      {
        description: 'projectsIds',
        params: {
          projectIds: ['P00002', 'P00005']
        },
        expected: [SUBMISSION_NUMBER_1, SUBMISSION_NUMBER_2, SUBMISSION_NUMBER_3]
      },
      {
        description: 'status',
        params: {
          status: [SubmissionStatus.VALID]
        },
        expected: [SUBMISSION_NUMBER_2, SUBMISSION_NUMBER_4]
      },
      {
        description: 'drmNumber & status',
        params: {
          drmNumber: [DRM_NUMBER_1, DRM_NUMBER_2],
          status: [SubmissionStatus.VALID]
        },
        expected: [SUBMISSION_NUMBER_2, SUBMISSION_NUMBER_4]
      }
    ].forEach(test => {
      it(`should return submissions when searching ${test.description}`, async () => {
        const findOptions: ISubmissionFindPaginatedOptionsProps = {
          criterias: {
            ...test.params
          },
          limit: 100,
          offset: 0
        };
        const result = await searchSubmissionUseCase.execute(findOptions);
        assert.isTrue(result.isRight());
        const foundSubmissions = (result.value.getValue() as IPaginatedResult<ISubmission>).items;
        const submissionNumbers = foundSubmissions.map(s => s.submissionNumber);
        assert.strictEqual(
          submissionNumbers.every((s: string) => test.expected.includes(s)),
          true
        );
      });
    });

    [
      {
        fields: ['submissionNumber']
      },
      {
        fields: ['drmNumber']
      },
      {
        fields: ['programBookId']
      },
      {
        fields: ['projectIds']
      },
      {
        fields: ['status']
      },
      {
        fields: ['progressHistory']
      },
      {
        fields: ['submissionNumber', 'drmNumber', 'programBookId', 'projectIds', 'status', 'progressHistory']
      }
    ].forEach(test => {
      it(`should only return the id and these properties : [${test.fields.join(',')}]`, async () => {
        const findOptions: ISubmissionFindPaginatedOptionsProps = {
          criterias: {},
          limit: 100,
          offset: 0,
          fields: test.fields.join(',')
        };
        const result = await searchSubmissionUseCase.execute(findOptions);
        assert.isTrue(result.isRight());
        const foundSubmissions = (result.value.getValue() as IPaginatedResult<ISubmission>).items;
        for (const submission of foundSubmissions) {
          assert.exists(submission.submissionNumber);
          test.fields.forEach(field => {
            assert.exists(submission[field], `${field} not found`);
          });
        }
      });
    });
  });
});

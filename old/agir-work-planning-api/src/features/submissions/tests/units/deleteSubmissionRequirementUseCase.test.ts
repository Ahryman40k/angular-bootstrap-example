import { ProjectStatus, SubmissionProgressStatus, SubmissionStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { destroyDBTests, mergeProperties, VALID_UUID } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { Submission } from '../../models/submission';
import { submissionRepository } from '../../mongo/submissionRepository';
import { deleteSubmissionRequirementUseCase } from '../../useCases/requirements/deleteSubmissionRequirement/deleteSubmissionRequirementUseCase';
import { ISubmissionDeleteRequirementRequestProps } from '../../useCases/requirements/deleteSubmissionRequirement/submissionRequirementDeleteRequest';
import {
  createAndSaveSubmission,
  DRM_NUMBER,
  getSubmissionRequirement,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`deleteSubmissionRequirementUseCase`, () => {
  before(() => {
    userMocker.mock(userMocks.executor);
  });
  after(() => {
    userMocker.reset();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  let submission: Submission;

  describe('Negative', () => {
    [
      {
        description: 'submission number not valid',
        requestError: {
          submissionNumber: `500150`
        },
        expectedError: NotFoundError
      },
      {
        description: 'requirement do not exists',
        requestError: {
          id: VALID_UUID
        },
        expectedError: NotFoundError
      }
    ].forEach(test => {
      it(`should return notFoundError when ${test.description} `, async () => {
        const initRequirement = getSubmissionRequirement({ text: 'first' });
        submission = await createAndSaveSubmission({
          status: SubmissionStatus.VALID,
          requirements: [initRequirement],
          progressStatus: SubmissionProgressStatus.REALIZATION
        });

        const result = await deleteSubmissionRequirementUseCase.execute({
          submissionNumber: test.requestError.submissionNumber || submission.id,
          id: test.requestError.id || submission.requirements[0].id
        });
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, test.expectedError, 'should be NotFoundError');
      });
    });

    [{ status: SubmissionStatus.INVALID }, { progressStatus: SubmissionProgressStatus.REALIZATION }].forEach(props => {
      it(`should return UNPROCESSABLE_ENTITY error when submission is invalid`, async () => {
        const initRequirement = getSubmissionRequirement({ text: 'first' });
        submission = await createAndSaveSubmission({
          status: SubmissionStatus.INVALID,
          requirements: [initRequirement],
          ...props
        });

        const result = await deleteSubmissionRequirementUseCase.execute({
          submissionNumber: submission.id,
          id: submission.requirements[0].id
        });
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
      });
    });

    describe(`Positive`, () => {
      it(`should delete requirement submission`, async () => {
        const initRequirement = getSubmissionRequirement({ text: 'first' });

        submission = await createAndSaveSubmission({
          requirements: [initRequirement]
        });

        const result = await deleteSubmissionRequirementUseCase.execute({
          submissionNumber: submission.id,
          id: submission.requirements[0].id
        });

        assert.isTrue(result.isRight());
        // find submission and search for
        const submissionUpdated = await submissionRepository.findById(submission.id);
        assert.strictEqual(submissionUpdated.requirements.length, 0);
      });
    });
  });
  describe(`UserRestrictions`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    projectRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        // create projects
        const createdProjects = await Promise.all(
          test.multipleProps.map(el =>
            createAndSaveProject({
              ...mergeProperties({}, el),
              drmNumber: DRM_NUMBER,
              status: ProjectStatus.finalOrdered,
              submissionNumber: SUBMISSION_NUMBER
            })
          )
        );
        submission = await createAndSaveSubmission({
          projectIds: createdProjects.map(x => x.id),
          requirements: [getSubmissionRequirement()]
        });
        const requirement = submission.requirements.find(x => x);
        const props: ISubmissionDeleteRequirementRequestProps = {
          id: requirement.id,
          submissionNumber: submission.id
        };
        await assertUseCaseRestrictions<ISubmissionDeleteRequirementRequestProps, void>(
          test,
          deleteSubmissionRequirementUseCase,
          props
        );
      });
    });
  });
});

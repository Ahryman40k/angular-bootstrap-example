import {
  ISubmissionRequirement,
  ProjectStatus,
  SubmissionProgressStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { destroyDBTests, mergeProperties } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { patchSubmissionRequirementUseCase } from '../../useCases/requirements/patchSubmissionRequirement/patchSubmissionRequirementUseCase';
import { ISubmissionRequirementPatchRequestProps } from '../../useCases/requirements/patchSubmissionRequirement/submissionRequirementPatchRequest';
import {
  assertSubmissionRequirement,
  createAndSaveSubmission,
  DRM_NUMBER,
  getSubmissionRequirement,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`patchSubmissionRequirementUseCase`, () => {
  before(() => {
    userMocker.mock(userMocks.executor);
  });
  after(() => {
    userMocker.reset();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  describe(`Negative`, () => {
    [
      {
        description: 'missing id',
        requestError: {
          id: undefined
        }
      },
      {
        description: 'missing submissionNumber',
        requestError: {
          submissionNumber: undefined
        }
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const initRequirement = getSubmissionRequirement({ text: 'first' });
        const submission = await createAndSaveSubmission({
          status: SubmissionStatus.INVALID,
          requirements: [initRequirement]
        });

        const result = await patchSubmissionRequirementUseCase.execute(
          mergeProperties(
            {
              submissionNumber: submission.submissionNumber,
              id: initRequirement.id
            },
            test.requestError
          )
        );

        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    [
      {
        description: 'submission is invalid',
        requestError: {
          status: SubmissionStatus.INVALID
        }
      },
      {
        description: 'progressStatus is realization',
        requestError: {
          progressStatus: SubmissionProgressStatus.REALIZATION
        }
      },
      {
        description: 'progressStatus is closing',
        requestError: {
          progressStatus: SubmissionProgressStatus.CLOSING
        }
      }
    ].forEach(test => {
      it(`should return UNPROCESSABLE_ENTITY error when ${test.description}`, async () => {
        const initRequirement = getSubmissionRequirement({ text: 'first' });
        const submission = await createAndSaveSubmission({
          requirements: [initRequirement],
          ...test.requestError
        });

        const result = await patchSubmissionRequirementUseCase.execute({
          submissionNumber: submission.id,
          id: submission.requirements[0].id,
          isDeprecated: true
        });
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
      });
    });

    describe(`Positive`, async () => {
      const initRequirement = getSubmissionRequirement({ text: 'first' });
      const submission = await createAndSaveSubmission({
        requirements: [initRequirement]
      });

      [
        {
          submissionNumber: submission.id,
          id: submission.requirements[0].id,
          isDeprecated: true
        },
        {
          submissionNumber: submission.id,
          id: submission.requirements[0].id,
          isDeprecated: false
        }
      ].forEach(test => {
        it(`should patch requirement submission`, async () => {
          const requirementToBePatched = submission.requirements[0];

          const result = await patchSubmissionRequirementUseCase.execute(test);
          assert.isTrue(result.isRight());
          const resultRequirement: ISubmissionRequirement = result.value.getValue() as ISubmissionRequirement;
          const expectedSubmussionRequirement: ISubmissionRequirement = mergeProperties(requirementToBePatched.props, {
            id: requirementToBePatched.id,
            isDeprecated: test.isDeprecated
          }) as ISubmissionRequirement;

          assertSubmissionRequirement(resultRequirement, expectedSubmussionRequirement);
          assert.isDefined(resultRequirement.audit.lastModifiedAt);
          assert.isDefined(resultRequirement.audit.lastModifiedBy);
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
          const submission = await createAndSaveSubmission({
            projectIds: createdProjects.map(x => x.id),
            requirements: [getSubmissionRequirement()]
          });
          const requirement = submission.requirements.find(x => x);
          const props: ISubmissionRequirementPatchRequestProps = {
            id: requirement.id,
            isDeprecated: true,
            submissionNumber: submission.id
          };
          await assertUseCaseRestrictions<ISubmissionRequirementPatchRequestProps, ISubmissionRequirement>(
            test,
            patchSubmissionRequirementUseCase,
            props
          );
        });
      });
    });
  });
});

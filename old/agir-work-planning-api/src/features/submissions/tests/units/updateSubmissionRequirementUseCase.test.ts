import {
  ErrorCodes,
  IEnrichedProject,
  ISubmissionRequirement,
  ProjectStatus,
  SubmissionProgressStatus,
  SubmissionRequirementSubtype,
  SubmissionRequirementType,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests, mergeProperties, NOT_FOUND_UUID } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { Submission } from '../../models/submission';
import { createSubmissionRequirementUseCase } from '../../useCases/requirements/addSubmissionRequirement/createSubmissionRequirementUseCase';
import { ISubmissionRequirementUpdateRequestProps } from '../../useCases/requirements/updateSubmissionRequirement/submissionRequirementUpdateRequest';
import { updateSubmissionRequirementUseCase } from '../../useCases/requirements/updateSubmissionRequirement/updateSubmissionRequirementUseCase';
import {
  assertSubmissionRequirement,
  createAndSaveSubmission,
  DRM_NUMBER,
  getSubmissionRequirement,
  getSubmissionRequirementRequestProps,
  getSubmissionRequirementUpdateRequestProps,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`updateSubmissionRequirementUseCase`, () => {
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
        description: 'missing text',
        requestError: {
          text: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'text',
            code: ErrorCodes.MissingValue,
            message: `text is null or undefined`
          }
        ]
      },
      {
        description: 'missing subtypeId',
        requestError: {
          subtypeId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'subtypeId',
            code: ErrorCodes.MissingValue,
            message: `subtypeId is null or undefined`
          }
        ]
      },
      {
        description: 'missing id',
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
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const submission = await createAndSaveSubmission({
          submissionNumber: SUBMISSION_NUMBER
        });
        const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
          submissionNumber: submission.submissionNumber,
          subtypeId: SubmissionRequirementSubtype.SCHOOL_HOLIDAYS,
          text: 'teste'
        });

        const updateSubmissionRequirementCmdProps = mergeProperties(
          getSubmissionRequirementUpdateRequestProps({
            submissionNumber: submission.submissionNumber,
            id: test.requestError.id || submissionRequirementCmdProps.submissionNumber
          }),
          test.requestError
        );

        const result = await updateSubmissionRequirementUseCase.execute(updateSubmissionRequirementCmdProps);

        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    let submission: Submission;
    let project: IEnrichedProject;

    describe('Negative', () => {
      [
        {
          description: 'submission number not existe',
          requestError: {
            submissionNumber: `500150`
          },
          expectedError: NotFoundError
        },
        {
          description: 'project do not exists',
          requestError: {
            projectIds: [`P99999`]
          },
          expectedError: UnprocessableEntityError
        },
        {
          description: 'requirement do not exists',
          requestError: {
            id: NOT_FOUND_UUID
          },
          expectedError: NotFoundError
        }
      ].forEach(test => {
        it(`should return notFoundError when ${test.description} `, async () => {
          const programBookId = '61b0fe82e5c785d78dbc8723';
          project = await createAndSaveProject(
            {
              status: ProjectStatus.finalOrdered,
              drmNumber: DRM_NUMBER
            },
            programBookId
          );
          submission = await createAndSaveSubmission({
            projectIds: [project.id],
            programBookId
          });
          const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
            submissionNumber: submission.submissionNumber,
            subtypeId: SubmissionRequirementSubtype.SCHOOL_HOLIDAYS,
            text: 'teste'
          });
          const requirementResult = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
          const resultRequirement: ISubmissionRequirement = requirementResult.value.getValue() as ISubmissionRequirement;

          const updateSubmissionRequirementCmdProps: ISubmissionRequirementUpdateRequestProps = mergeProperties(
            getSubmissionRequirementUpdateRequestProps({
              submissionNumber: test.requestError.submissionNumber || submission.id,
              id: test.requestError.id || resultRequirement.id
            }),
            test.requestError
          );

          const result = await updateSubmissionRequirementUseCase.execute(updateSubmissionRequirementCmdProps);
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, test.expectedError, 'should be NotFoundError');
        });
      });

      it(`should return UNPROCESSABLE_ENTITY error when submission is invalid`, async () => {
        const initRequirement = getSubmissionRequirement({ text: 'first' });
        submission = await createAndSaveSubmission({
          status: SubmissionStatus.INVALID,
          requirements: [initRequirement]
        });

        const updateSubmissionRequirementCmdProps: ISubmissionRequirementUpdateRequestProps = getSubmissionRequirementUpdateRequestProps(
          {
            submissionNumber: submission.id,
            id: submission.requirements[0].id
          }
        );

        const result = await updateSubmissionRequirementUseCase.execute(updateSubmissionRequirementCmdProps);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
      });

      it(`should return UNPROCESSABLE_ENTITY error when progressStatus is realization or closing`, async () => {
        const initRequirement = getSubmissionRequirement({ text: 'first' });
        submission = await createAndSaveSubmission({
          status: SubmissionStatus.VALID,
          requirements: [initRequirement],
          progressStatus: SubmissionProgressStatus.REALIZATION
        });

        const updateSubmissionRequirementCmdProps: ISubmissionRequirementUpdateRequestProps = getSubmissionRequirementUpdateRequestProps(
          {
            submissionNumber: submission.id,
            id: submission.requirements[0].id
          }
        );

        const result = await updateSubmissionRequirementUseCase.execute(updateSubmissionRequirementCmdProps);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
      });

      describe(`Positive`, () => {
        it(`should update requirement submission`, async () => {
          const initRequirement = getSubmissionRequirement({ text: 'first' });

          const programBookId = '61b0fe82e5c785d78dbc8723';
          project = await createAndSaveProject(
            {
              status: ProjectStatus.finalOrdered,
              drmNumber: DRM_NUMBER
            },
            programBookId
          );

          submission = await createAndSaveSubmission({
            requirements: [initRequirement],
            projectIds: [project.id],
            programBookId
          });

          const updateSubmissionRequirementCmdProps: ISubmissionRequirementUpdateRequestProps = getSubmissionRequirementUpdateRequestProps(
            {
              submissionNumber: submission.id,
              id: initRequirement.id,
              subtypeId: SubmissionRequirementSubtype.COORDINATION_OBSTACLES,
              text: 'new text',
              projectIds: [project.id]
            }
          );

          const result = await updateSubmissionRequirementUseCase.execute(updateSubmissionRequirementCmdProps);
          assert.isTrue(result.isRight());
          const resultRequirement: ISubmissionRequirement = result.value.getValue() as ISubmissionRequirement;

          const submissionRequirementToBeUpdated = submission.requirements[0];
          const expectedSubmussionRequirement: ISubmissionRequirement = mergeProperties(
            submissionRequirementToBeUpdated.props,
            {
              id: submissionRequirementToBeUpdated.id,
              text: updateSubmissionRequirementCmdProps.text,
              typeId: SubmissionRequirementType.PROGRAMMATION,
              subtypeId: updateSubmissionRequirementCmdProps.subtypeId
            }
          ) as ISubmissionRequirement;

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
          submission = await createAndSaveSubmission({
            projectIds: createdProjects.map(x => x.id),
            requirements: [getSubmissionRequirement()]
          });
          const requirement = submission.requirements.find(x => x);
          const props: ISubmissionRequirementUpdateRequestProps = {
            ...getSubmissionRequirementRequestProps({ submissionNumber: submission.submissionNumber }),
            id: requirement.id
          };
          await assertUseCaseRestrictions<ISubmissionRequirementUpdateRequestProps, ISubmissionRequirement>(
            test,
            updateSubmissionRequirementUseCase,
            props
          );
        });
      });
    });
  });
});

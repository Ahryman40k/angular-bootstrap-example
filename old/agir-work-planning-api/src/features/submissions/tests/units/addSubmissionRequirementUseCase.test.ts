import {
  ErrorCodes,
  IEnrichedProject,
  ISubmissionRequirement,
  ProjectStatus,
  SubmissionProgressStatus,
  SubmissionRequirementMention,
  SubmissionRequirementSubtype,
  SubmissionRequirementType,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests, mergeProperties } from '../../../../../tests/utils/testHelper';
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
import { ISubmissionRequirementCreateRequestProps } from '../../useCases/requirements/addSubmissionRequirement/submissionRequirementCreateRequest';
import {
  assertSubmissionRequirement,
  createAndSaveSubmission,
  DRM_NUMBER,
  getSubmissionRequirementRequestProps,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`createSubmissionRequirementUseCase`, () => {
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
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const submission = await createAndSaveSubmission({
          submissionNumber: SUBMISSION_NUMBER
        });
        const submissionRequirementCmdProps = mergeProperties(
          getSubmissionRequirementRequestProps({
            submissionNumber: submission.submissionNumber
          }),
          test.requestError
        );

        const result = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);

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
    beforeEach(async () => {
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
    });

    describe('Negative', () => {
      [
        {
          description: 'submission not valid',
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
        }
      ].forEach(test => {
        it(`should return notFoundError when ${test.description} `, async () => {
          const submissionRequirementCmdProps = mergeProperties(
            getSubmissionRequirementRequestProps({
              submissionNumber: test.requestError.submissionNumber || submission.id
            }),
            test.requestError
          );

          const result = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, test.expectedError, 'should be NotFoundError');
        });
      });
    });

    it(`should return UNPROCESSABLE_ENTITY error when submission is invalid`, async () => {
      submission = await createAndSaveSubmission({
        status: SubmissionStatus.INVALID
      });
      const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
        submissionNumber: submission.submissionNumber,
        subtypeId: SubmissionRequirementSubtype.SCHOOL_HOLIDAYS,
        text: 'teste'
      });

      const result = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
    });

    it(`should return UNPROCESSABLE_ENTITY error when progressStatus is realization or closing`, async () => {
      submission = await createAndSaveSubmission({
        status: SubmissionStatus.VALID,
        progressStatus: SubmissionProgressStatus.REALIZATION
      });
      const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
        submissionNumber: submission.submissionNumber,
        subtypeId: SubmissionRequirementSubtype.SCHOOL_HOLIDAYS,
        text: 'teste'
      });

      const result = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
    });

    describe(`Positive`, () => {
      it(`should add requirement to submission`, async () => {
        const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
          submissionNumber: submission.submissionNumber
        });
        const result = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
        assert.isTrue(result.isRight());
        const resultRequirement: ISubmissionRequirement = result.value.getValue() as ISubmissionRequirement;

        const expectedSubmussionRequirement: Partial<ISubmissionRequirement> = {
          id: resultRequirement.id,
          text: submissionRequirementCmdProps.text,
          typeId: SubmissionRequirementType.OTHER,
          mentionId: SubmissionRequirementMention.BEFORE_TENDER,
          isDeprecated: false,
          subtypeId: submissionRequirementCmdProps.subtypeId
        };

        assertSubmissionRequirement(resultRequirement, expectedSubmussionRequirement);
      });

      it(`should add requirement with projects to submission`, async () => {
        const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
          submissionNumber: submission.submissionNumber,
          subtypeId: SubmissionRequirementSubtype.SCHOOL_HOLIDAYS,
          text: 'teste',
          projectIds: [project.id]
        });
        const result = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
        assert.isTrue(result.isRight());
        const resultRequirement: ISubmissionRequirement = result.value.getValue() as ISubmissionRequirement;

        const expectedSubmussionRequirement: Partial<ISubmissionRequirement> = {
          id: resultRequirement.id,
          text: submissionRequirementCmdProps.text,
          typeId: SubmissionRequirementType.COMPLETION_PERIOD,
          mentionId: SubmissionRequirementMention.BEFORE_TENDER,
          isDeprecated: false,
          subtypeId: submissionRequirementCmdProps.subtypeId,
          projectIds: submissionRequirementCmdProps.projectIds
        };

        assertSubmissionRequirement(resultRequirement, expectedSubmussionRequirement);
      });

      it(`should add requirement with mentionId afterTender`, async () => {
        submission = await createAndSaveSubmission({
          status: SubmissionStatus.VALID,
          progressStatus: SubmissionProgressStatus.GRANTED
        });
        const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
          submissionNumber: submission.submissionNumber
        });
        const result = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
        assert.isTrue(result.isRight());
        const resultRequirement: ISubmissionRequirement = result.value.getValue() as ISubmissionRequirement;

        const expectedSubmussionRequirement: Partial<ISubmissionRequirement> = {
          id: resultRequirement.id,
          text: submissionRequirementCmdProps.text,
          typeId: SubmissionRequirementType.OTHER,
          mentionId: SubmissionRequirementMention.AFTER_TENDER,
          isDeprecated: false,
          subtypeId: submissionRequirementCmdProps.subtypeId
        };

        assertSubmissionRequirement(resultRequirement, expectedSubmussionRequirement);
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
          submission = await createAndSaveSubmission({ projectIds: createdProjects.map(x => x.id) });
          const props: ISubmissionRequirementCreateRequestProps = getSubmissionRequirementRequestProps({
            submissionNumber: submission.submissionNumber
          });
          await assertUseCaseRestrictions<ISubmissionRequirementCreateRequestProps, ISubmissionRequirement>(
            test,
            createSubmissionRequirementUseCase,
            props
          );
        });
      });
    });
  });
});

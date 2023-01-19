import {
  ErrorCodes,
  IEnrichedProject,
  ISubmission,
  ProjectStatus,
  RequirementTargetType,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import {
  assertFailures,
  destroyDBTests,
  INVALID_PROJECT_ID,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { createAndSaveDefaultProgramBook } from '../../../programBooks/tests/programBookTestHelper';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { IPlainRequirementProps } from '../../../requirements/models/plainRequirement';
import { Requirement } from '../../../requirements/models/requirement';
import { getPlainRequirementProps } from '../../../requirements/tests/requirementTestHelper';
import { createRequirementUseCase } from '../../../requirements/useCases/createRequirement/createRequirementUseCase';
import { IProjectSubmissionProps } from '../../models/projectSubmissionCommand';
import { Submission } from '../../models/submission';
import { ISubmissionCreateRequestProps } from '../../models/submissionCreateRequest';
import { submissionRepository } from '../../mongo/submissionRepository';
import { addProjectToSubmissionUseCase } from '../../useCases/projectSubmission/addProjectToSubmission/addProjectToSubmissionUseCase';
import { PROJECT_STATUS_TO_CREATE_SUBMISSION } from '../../validators/submissionValidator';
import {
  assetSubmissionProjectRequirements,
  createAndSaveSubmission,
  DRM_NUMBER,
  getProjectSubmissionCommandProps,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`AddProjectToSubmissionUseCase`, () => {
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
        description: 'missing submissionNumber',
        requestError: {
          submissionNumber: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'submissionNumber',
            code: ErrorCodes.MissingValue,
            message: `submissionNumber is null or undefined`
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
            target: 'submissionNumber',
            code: ErrorCodes.InvalidInput,
            message: `submissionNumber has a bad format`
          }
        ]
      },
      {
        description: 'missing project id',
        requestError: {
          projectId: undefined
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
        description: 'invalid projectId',
        requestError: {
          projectId: INVALID_PROJECT_ID
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
        const addProjectToSubmission: IProjectSubmissionProps = mergeProperties(
          getProjectSubmissionCommandProps(),
          test.requestError
        );
        const result = await addProjectToSubmissionUseCase.execute(addProjectToSubmission);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    [
      {
        description: 'submission do not exists',
        requestError: {
          submissionNumber: `500150`
        }
      },
      {
        description: 'project do not exists',
        requestError: {
          projectId: `P99999`
        }
      }
    ].forEach(test => {
      it(`should return notFoundError when ${test.description} `, async () => {
        const addProjectToSubmission: IProjectSubmissionProps = mergeProperties(
          getProjectSubmissionCommandProps(),
          test.requestError
        );

        // create submission when testing for project
        if (test.requestError.projectId) {
          await createAndSaveSubmission({
            submissionNumber: addProjectToSubmission.submissionNumber
          });
        }
        const result = await addProjectToSubmissionUseCase.execute(addProjectToSubmission);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    let submission: Submission;
    const programBookId = '61b0fe82e5c785d78dbc8723';
    const projectId = 'P00002';
    let alreadyExistingProject: IEnrichedProject;

    beforeEach(async () => {
      alreadyExistingProject = await createAndSaveProject(
        {
          status: ProjectStatus.finalOrdered,
          drmNumber: DRM_NUMBER
        },
        programBookId
      );
      submission = await createAndSaveSubmission({
        projectIds: [alreadyExistingProject.id],
        programBookId
      });
    });

    describe(`Negative`, () => {
      describe(`Validate Submission`, () => {
        [
          {
            description: 'submission status is invalid',
            submissionError: {
              status: SubmissionStatus.INVALID
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `Submission ${SUBMISSION_NUMBER} status is in invalid state: ${SubmissionStatus.INVALID}`,
                succeeded: false,
                target: 'status'
              }
            ]
          },
          {
            description: 'submission already contains project',
            submissionError: {
              projectIds: [projectId]
            },
            expectedErrors: [
              {
                code: ErrorCode.DUPLICATE,
                message: `Project P00002 already exists in submission ${SUBMISSION_NUMBER}`,
                succeeded: false,
                target: 'id'
              }
            ]
          }
        ].forEach(test => {
          it(`should return unprocessableEntityError with ${test.description}`, async () => {
            // update submission before patch
            submission = (
              await submissionRepository.save(
                Submission.create(mergeProperties(submission.props, test.submissionError)).getValue()
              )
            ).getValue();

            const result = await addProjectToSubmissionUseCase.execute(
              getProjectSubmissionCommandProps({
                submissionNumber: submission.submissionNumber,
                projectId
              })
            );
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });
      });

      describe(`Validate Project`, () => {
        [
          {
            description: 'project status is invalid',
            projectError: {
              status: ProjectStatus.planned
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `Project P00004 is planned. Must be one of: ${PROJECT_STATUS_TO_CREATE_SUBMISSION}`,
                succeeded: false,
                target: 'project.status'
              }
            ]
          },
          {
            description: 'project has no drm',
            projectError: {
              drmNumber: undefined
            },
            expectedErrors: [
              {
                code: ErrorCode.MISSING,
                message: `Project P00004 has no drmNumber`,
                succeeded: false,
                target: 'project.drmNumber'
              }
            ]
          },
          {
            description: 'project does not belong to same programBook as submission',
            projectError: {
              programBookId: NOT_FOUND_UUID
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `Project P00004 do not belong to programBook 61b0fe82e5c785d78dbc8723`,
                succeeded: false,
                target: 'programBookId'
              }
            ]
          },
          {
            description: 'project previous submission is still valid',
            projectError: {
              previousSubmission: true
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `Submission 737309 status is in invalid state: ${SubmissionStatus.VALID}`,
                succeeded: false,
                target: 'status'
              }
            ]
          }
        ].forEach(test => {
          it(`should return unprocessableEntityError with ${test.description}`, async () => {
            let previousSubmission: Submission;
            if (test.projectError.previousSubmission) {
              previousSubmission = await createAndSaveSubmission({
                submissionNumber: `${DRM_NUMBER}09`,
                status: SubmissionStatus.VALID
              });
            }

            const project = await createAndSaveProject(
              mergeProperties(
                {
                  submissionNumber: previousSubmission?.submissionNumber,
                  drmNumber: submission.drmNumber,
                  status: ProjectStatus.finalOrdered
                },
                test.projectError
              ),
              test.projectError.programBookId ? test.projectError.programBookId : programBookId
            );

            const result = await addProjectToSubmissionUseCase.execute(
              getProjectSubmissionCommandProps({
                submissionNumber: submission.submissionNumber,
                projectId: project.id
              })
            );
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });
      });
    });

    describe(`Positive`, () => {
      it(`should add project to submission`, async () => {
        const project = await createAndSaveProject(
          {
            drmNumber: submission.drmNumber,
            status: ProjectStatus.finalOrdered
          },
          submission.programBookId
        );

        const projectSubmissionCmdProps = getProjectSubmissionCommandProps({
          submissionNumber: submission.submissionNumber,
          projectId: project.id
        });
        const result = await addProjectToSubmissionUseCase.execute(projectSubmissionCmdProps);
        assert.isTrue(result.isRight());
        const updatedSubmission: ISubmission = result.value.getValue() as ISubmission;
        assert.strictEqual(updatedSubmission.submissionNumber, projectSubmissionCmdProps.submissionNumber);
        assert.strictEqual(updatedSubmission.projectIds.length, 2);
        assert.isTrue(updatedSubmission.projectIds.every(id => [alreadyExistingProject.id, project.id].includes(id)));
        assert.strictEqual(updatedSubmission.status, submission.status, `should not be modified`);
        assert.strictEqual(updatedSubmission.drmNumber, submission.drmNumber, `should not be modified`);
        assert.strictEqual(updatedSubmission.programBookId, submission.programBookId, `should not be modified`);
        assert.strictEqual(updatedSubmission.progressStatus, submission.progressStatus, `should not be modified`);
        assert.strictEqual(
          updatedSubmission.progressHistory.length,
          submission.progressHistory.length,
          `should not be modified`
        );

        assert.isDefined(updatedSubmission.audit.lastModifiedAt);
        assert.isDefined(updatedSubmission.audit.lastModifiedBy);
      });
    });
    describe(`UserRestrictions`, () => {
      let programBook: ProgramBook;
      beforeEach(async () => {
        programBook = await createAndSaveDefaultProgramBook({}, {}, programBookId);
      });
      afterEach(async () => {
        await destroyDBTests();
      });

      projectRestrictionsTestData.forEach(test => {
        it(test.scenario, async () => {
          // create projects
          const createdProjects = await Promise.all(
            test.multipleProps.map(el =>
              createAndSaveProject(
                {
                  ...mergeProperties({}, el),
                  drmNumber: DRM_NUMBER,
                  submissionNumber: SUBMISSION_NUMBER,
                  status: ProjectStatus.finalOrdered
                },
                programBook.id
              )
            )
          );
          const projectToAdd = await createAndSaveProject(
            { ...mergeProperties({}, test.props), drmNumber: DRM_NUMBER, status: ProjectStatus.finalOrdered },
            programBook.id
          );
          const submissionProps: ISubmissionCreateRequestProps = {
            programBookId: programBook.id,
            projectIds: createdProjects.map(el => el.id)
          };
          const createdSubmission = await createAndSaveSubmission(submissionProps);
          const props: IProjectSubmissionProps = {
            projectId: projectToAdd.id,
            submissionNumber: createdSubmission.submissionNumber
          };
          await assertUseCaseRestrictions<IProjectSubmissionProps, ISubmission>(
            test,
            addProjectToSubmissionUseCase,
            props
          );
        });
      });
    });

    describe(`Add project with requirements to submission`, () => {
      let programBook: ProgramBook;
      let project1: IEnrichedProject;
      let project2: IEnrichedProject;
      let project3: IEnrichedProject;

      let requirement1: Requirement;
      let requirement2: Requirement;
      let requirement3: Requirement;

      beforeEach(async () => {
        userMocker.mock(userMocks.admin);
        programBook = await createAndSaveDefaultProgramBook({}, {}, programBookId);
        alreadyExistingProject = await createAndSaveProject(
          {
            status: ProjectStatus.finalOrdered,
            drmNumber: DRM_NUMBER
          },
          programBookId
        );
        submission = await createAndSaveSubmission({
          projectIds: [alreadyExistingProject.id],
          programBookId
        });
        [project1, project2, project3] = await Promise.all(
          [project1, project2, project3].map(p =>
            createAndSaveProject(
              {
                status: ProjectStatus.finalOrdered,
                drmNumber: DRM_NUMBER
              },
              programBook.id
            )
          )
        );
        const requirementItem1 = {
          items: [
            {
              id: project1.id,
              type: RequirementTargetType.project
            }
          ]
        };
        const requirementItem2 = {
          items: [
            {
              id: project2.id,
              type: RequirementTargetType.project
            },
            {
              id: project3.id,
              type: RequirementTargetType.project
            }
          ]
        };
        const requirementItem3 = {
          items: [
            {
              id: project3.id,
              type: RequirementTargetType.project
            }
          ]
        };
        [requirement1, requirement2, requirement3] = await Promise.all(
          [requirementItem1, requirementItem2, requirementItem3].map(async r => {
            const plainRequirementProps: IPlainRequirementProps = await getPlainRequirementProps(r);
            const requirementResult = await createRequirementUseCase.execute(plainRequirementProps);
            return requirementResult.value.getValue() as Requirement;
          })
        );
      });

      it(`should add requirement to submission without duplication`, async () => {
        const projects = [project1, project2, project3];
        const expecteds = [
          [
            {
              id: requirement1.id,
              projectIds: [project1.id]
            }
          ],
          [
            {
              id: requirement1.id,
              projectIds: [project1.id]
            },
            {
              id: requirement2.id,
              projectIds: [project2.id]
            }
          ],
          [
            {
              id: requirement1.id,
              projectIds: [project1.id]
            },
            {
              id: requirement2.id,
              projectIds: [project2.id, project3.id]
            },
            {
              id: requirement3.id,
              projectIds: [project3.id]
            }
          ]
        ];

        for (const index of [0, 1, 2]) {
          const project = projects[index];
          const projectSubmissionCmdProps = getProjectSubmissionCommandProps({
            submissionNumber: submission.submissionNumber,
            projectId: project.id
          });
          const result = await addProjectToSubmissionUseCase.execute(projectSubmissionCmdProps);
          const updatedSubmission: ISubmission = result.value.getValue() as ISubmission;
          assetSubmissionProjectRequirements(updatedSubmission.requirements, expecteds[index]);
        }
      });
    });
  });
});

import {
  ErrorCodes,
  IEnrichedProject,
  ISubmission,
  ISubmissionCreateRequest,
  ProjectStatus,
  RequirementTargetType,
  SubmissionProgressStatus,
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
  NOT_FOUND_PROJECT_ID,
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
import { getAudit } from '../../../audit/test/auditTestHelper';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { createAndSaveDefaultProgramBook } from '../../../programBooks/tests/programBookTestHelper';
import { ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { IPlainRequirementProps } from '../../../requirements/models/plainRequirement';
import { Requirement } from '../../../requirements/models/requirement';
import { getPlainRequirementProps } from '../../../requirements/tests/requirementTestHelper';
import { createRequirementUseCase } from '../../../requirements/useCases/createRequirement/createRequirementUseCase';
import { Submission } from '../../models/submission';
import { ISubmissionCreateRequestProps } from '../../models/submissionCreateRequest';
import { createSubmissionUseCase } from '../../useCases/createSubmission/createSubmissionUseCase';
import { PROJECT_STATUS_TO_CREATE_SUBMISSION } from '../../validators/submissionValidator';
import {
  createAndSaveSubmission,
  DRM_NUMBER,
  getSubmissionCreateRequestProps,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`CreateSubmissionUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  describe(`Negative`, () => {
    [
      {
        description: 'missing programBookId',
        requestError: {
          programBookId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'programBookId',
            code: ErrorCodes.MissingValue,
            message: `programBookId is null or undefined`
          }
        ]
      },
      {
        description: 'invalid programBookId',
        requestError: {
          programBookId: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'programBookId',
            code: ErrorCodes.InvalidInput,
            message: `programBookId has a bad format`
          }
        ]
      },
      {
        description: 'missing projectIds',
        requestError: {
          projectIds: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectIds',
            code: ErrorCodes.MissingValue,
            message: `projectIds is null or undefined`
          }
        ]
      },
      {
        description: 'empty projectIds',
        requestError: {
          projectIds: []
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectIds',
            code: ErrorCodes.InvalidInput,
            message: `projectIds is empty`
          }
        ]
      },
      {
        description: 'invalid projectIds',
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
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const submissionCreateRequest: ISubmissionCreateRequest = getSubmissionCreateRequestProps(test.requestError);
        const result = await createSubmissionUseCase.execute(submissionCreateRequest);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    [
      {
        description: 'programBook do not exists',
        requestError: {
          programBookId: NOT_FOUND_UUID
        }
      },
      {
        description: 'projectIds do not exists',
        requestError: {
          projectIds: [NOT_FOUND_PROJECT_ID]
        }
      }
    ].forEach(test => {
      it(`should return notFoundError when ${test.description} `, async () => {
        const programBook = await createAndSaveDefaultProgramBook();
        const project = await createAndSaveProject();

        const submissionCreateRequest: ISubmissionCreateRequest = mergeProperties(
          getSubmissionCreateRequestProps({
            programBookId: programBook.id,
            projectIds: [project.id]
          }),
          test.requestError
        );
        const result = await createSubmissionUseCase.execute(submissionCreateRequest);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    let programBook: ProgramBook;
    const PROGRAMBOOK_ID = '61aa1bf9a4ab2cdc2cd53852';
    beforeEach(async () => {
      programBook = await createAndSaveDefaultProgramBook({}, {}, PROGRAMBOOK_ID);
    });

    describe(`Negative`, () => {
      let validProject: IEnrichedProject;

      beforeEach(async () => {
        validProject = await createAndSaveProject(
          {
            status: ProjectStatus.finalOrdered,
            drmNumber: DRM_NUMBER
          },
          programBook.id
        );
      });

      describe(`Validate Projects`, () => {
        [
          {
            description: 'project is not preliminaryOrdered or finalOrdered',
            projectError: {
              status: ProjectStatus.programmed
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `Project P00004 is ${ProjectStatus.programmed}. Must be one of: ${PROJECT_STATUS_TO_CREATE_SUBMISSION}`,
                succeeded: false,
                target: 'project.status'
              }
            ]
          },
          {
            description: 'project has no drmNumber',
            projectError: {
              drmNumber: null
            },
            expectedErrors: [
              {
                code: ErrorCode.MISSING,
                message: 'Project P00004 has no drmNumber',
                succeeded: false,
                target: 'project.drmNumber'
              }
            ]
          },
          {
            description: 'project does not belong to programBook',
            projectError: {
              projectProgramBookId: NOT_FOUND_UUID
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `Project P00004 do not belong to programBook ${PROGRAMBOOK_ID}`,
                succeeded: false,
                target: 'programBookId'
              }
            ]
          }
        ].forEach(test => {
          it(`should return unprocessableEntityError with ${test.description}`, async () => {
            const invalidProject = await createAndSaveProject(
              {
                status: ProjectStatus.finalOrdered,
                drmNumber: DRM_NUMBER,
                ...test.projectError
              },
              test.projectError.projectProgramBookId ? test.projectError.projectProgramBookId : programBook.id
            );

            const submissionCreateRequest: ISubmissionCreateRequest = mergeProperties(
              getSubmissionCreateRequestProps({
                programBookId: programBook.id,
                projectIds: [validProject.id, invalidProject.id]
              }),
              test.projectError
            );

            const result = await createSubmissionUseCase.execute(submissionCreateRequest);
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });
      });

      describe(`Validate Projects Compatibility`, () => {
        let submission: Submission;
        beforeEach(async () => {
          submission = await createAndSaveSubmission({
            submissionNumber: SUBMISSION_NUMBER
          });
        });

        [
          {
            description: 'projects without previous submission must have a same drm number',
            projectError: {
              drmNumber: '7374'
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `All projects must have the same drmNumber when no previous submission. Got 7374,${DRM_NUMBER}`,
                succeeded: false,
                target: 'drmNumber'
              }
            ]
          },
          {
            description: 'not all projects have a previous submission number',
            projectError: {
              submissionNumber: null
            },
            expectedErrors: [
              {
                code: ErrorCode.MISSING,
                message: 'Some projects do not have a previous submissionNumber: P00004',
                succeeded: false,
                target: 'submissionNumber'
              }
            ]
          },
          {
            description: 'not all projects have a same previous submission number',
            projectError: {
              submissionNumber: '737402'
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `All projects must have the same previous submissionNumber. Got 737402,${SUBMISSION_NUMBER}`,
                succeeded: false,
                target: 'submissionNumber'
              }
            ]
          },
          {
            description: 'previous submission status must be invalid',
            projectError: {
              submissionNumber: SUBMISSION_NUMBER,
              previousSubmissionProps: {
                status: SubmissionStatus.VALID
              }
            },
            expectedErrors: [
              {
                code: ErrorCode.INVALID,
                message: `Submission ${SUBMISSION_NUMBER} status is in invalid state: ${SubmissionStatus.VALID}`,
                succeeded: false,
                target: 'status'
              }
            ]
          }
        ].forEach(test => {
          it(`should return unprocessableEntityError with ${test.description}`, async () => {
            if (test.projectError.submissionNumber !== undefined) {
              validProject.submissionNumber = submission.submissionNumber;
              validProject = (await projectRepository.save(validProject)).getValue();
            }
            if (test.projectError.previousSubmissionProps) {
              submission = await createAndSaveSubmission({
                ...submission.props,
                ...test.projectError.previousSubmissionProps
              });
            }

            const invalidProject = await createAndSaveProject(
              mergeProperties(
                {
                  status: ProjectStatus.finalOrdered,
                  drmNumber: DRM_NUMBER
                },
                test.projectError
              ),
              programBook.id
            );

            const submissionCreateRequest: ISubmissionCreateRequest = mergeProperties(
              getSubmissionCreateRequestProps({
                programBookId: programBook.id,
                projectIds: [validProject.id, invalidProject.id]
              }),
              test.projectError
            );
            const result = await createSubmissionUseCase.execute(submissionCreateRequest);
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });

        it(`should return unprocessableEntityError when reached maximum submissions`, async () => {
          const submissionNumber = `${DRM_NUMBER}99`;
          submission = await createAndSaveSubmission({
            ...submission.props,
            submissionNumber,
            drmNumber: DRM_NUMBER,
            status: 'invalid',
            audit: getAudit()
          });
          validProject.submissionNumber = submissionNumber;
          validProject = (await projectRepository.save(validProject)).getValue();

          await createAndSaveProject(
            {
              status: ProjectStatus.finalOrdered,
              drmNumber: DRM_NUMBER,
              submissionNumber
            },
            programBook.id
          );
          const project2 = (await projectRepository.save(validProject)).getValue();

          const submissionCreateRequest: ISubmissionCreateRequest = getSubmissionCreateRequestProps({
            programBookId: programBook.id,
            projectIds: [validProject.id, project2.id]
          });
          const result = await createSubmissionUseCase.execute(submissionCreateRequest);
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
          const failures: IGuardResult[] = (result.value as any).error.error;
          const expectedError = [
            {
              code: ErrorCode.FORBIDDEN,
              message: `Reached Maximum number of submissions for ${DRM_NUMBER}`,
              succeeded: false,
              target: 'drmNumber'
            }
          ];
          assertFailures(failures, expectedError);
        });
      });
    });

    describe(`Positive`, () => {
      let project1: IEnrichedProject;
      let project2: IEnrichedProject;

      beforeEach(async () => {
        [project1, project2] = await Promise.all(
          [project1, project2].map(p =>
            createAndSaveProject(
              {
                status: ProjectStatus.finalOrdered,
                drmNumber: DRM_NUMBER
              },
              programBook.id
            )
          )
        );
      });

      it(`should create submissions and iterate numbers`, async () => {
        const submissionCreateRequest: ISubmissionCreateRequest = getSubmissionCreateRequestProps({
          programBookId: programBook.id,
          projectIds: [project1.id, project2.id]
        });

        const projectFindOptions = ProjectFindOptions.create({
          criterias: {
            id: submissionCreateRequest.projectIds
          }
        }).getValue();
        let projects = await projectRepository.findAll(projectFindOptions);
        projects.forEach(p => {
          assert.isUndefined(p.submissionNumber);
        });

        for (let i = 1; i < 4; i++) {
          const expectedSubmissionNumber = `${DRM_NUMBER}0${i}`;
          const result = await createSubmissionUseCase.execute(submissionCreateRequest);
          assert.isTrue(result.isRight());
          const createdSubmission: ISubmission = result.value.getValue() as ISubmission;
          assert.strictEqual(createdSubmission.submissionNumber, expectedSubmissionNumber);
          assert.strictEqual(createdSubmission.drmNumber, DRM_NUMBER);
          assert.strictEqual(createdSubmission.programBookId, programBook.id);
          assert.isTrue(createdSubmission.projectIds.every(id => [project1, project2].map(p => p.id)));
          assert.strictEqual(createdSubmission.status, SubmissionStatus.VALID);
          assert.strictEqual(createdSubmission.progressStatus, SubmissionProgressStatus.PRELIMINARY_DRAFT);
          assert.isDefined(createdSubmission.audit);
          assert.strictEqual(createdSubmission.progressHistory.length, 0);
          projects = await projectRepository.findAll(projectFindOptions);
          projects.forEach(p => {
            assert.strictEqual(p.submissionNumber, expectedSubmissionNumber);
          });

          // Invalidate submission
          await createAndSaveSubmission({
            ...(createdSubmission as any),
            progressHistory: [
              {
                progressStatus: SubmissionProgressStatus.PRELIMINARY_DRAFT,
                audit: getAudit()
              }
            ],
            status: SubmissionStatus.INVALID
          });
        }
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
              createAndSaveProject(
                { ...mergeProperties({}, el), drmNumber: DRM_NUMBER, status: ProjectStatus.finalOrdered },
                programBook.id
              )
            )
          );
          const props: ISubmissionCreateRequestProps = getSubmissionCreateRequestProps({
            programBookId: programBook.id,
            projectIds: createdProjects.map(el => el.id)
          });
          await assertUseCaseRestrictions<ISubmissionCreateRequestProps, ISubmission>(
            test,
            createSubmissionUseCase,
            props
          );
        });
      });
    });

    describe(`UseCase: project with requirements`, () => {
      let project1: IEnrichedProject;
      let project2: IEnrichedProject;
      let project3: IEnrichedProject;

      let requirement1: Requirement;
      let requirement2: Requirement;
      let requirement3: Requirement;

      beforeEach(async () => {
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
              id: project1.id,
              type: RequirementTargetType.project
            },
            {
              id: project2.id,
              type: RequirementTargetType.project
            }
          ]
        };
        const requirementItem3 = {
          items: [
            {
              id: project3.id,
              type: RequirementTargetType.project
            },
            {
              id: project1.id,
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

      afterEach(async () => {
        await destroyDBTests();
      });

      it(`should submissions requirement without duplication`, async () => {
        userMocker.mock(userMocks.planner);
        const submissionCreateRequest: ISubmissionCreateRequest = getSubmissionCreateRequestProps({
          programBookId: programBook.id,
          projectIds: [project1.id, project2.id]
        });

        const result = await createSubmissionUseCase.execute(submissionCreateRequest);
        assert.isTrue(result.isRight());
        const createdSubmission: ISubmission = result.value.getValue() as ISubmission;

        assert.strictEqual(createdSubmission.requirements.length, 3);
        assert.equal(createdSubmission.requirements[0].projectIds[0], project1.id);
        [project1.id, project2.id].forEach(p => {
          assert.isTrue(createdSubmission.requirements[1].projectIds.includes(p));
        });
        assert.equal(createdSubmission.requirements[2].projectIds[0], project1.id);
        assert.strictEqual(createdSubmission.requirements[0].planningRequirementId, requirement3.id);
        assert.strictEqual(createdSubmission.requirements[1].planningRequirementId, requirement2.id);
        assert.strictEqual(createdSubmission.requirements[2].planningRequirementId, requirement1.id);
      });
    });
  });
});

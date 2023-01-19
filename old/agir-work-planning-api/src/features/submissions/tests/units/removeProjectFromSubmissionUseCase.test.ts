import {
  IEnrichedProject,
  ISubmission,
  ProjectStatus,
  SubmissionRequirementSubtype,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests, mergeProperties } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { getAudit } from '../../../audit/test/auditTestHelper';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { createAndSaveDefaultProgramBook } from '../../../programBooks/tests/programBookTestHelper';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { IProjectSubmissionProps } from '../../models/projectSubmissionCommand';
import { SubmissionRequirement } from '../../models/requirements/submissionRequirement';
import { Submission } from '../../models/submission';
import { ISubmissionCreateRequestProps } from '../../models/submissionCreateRequest';
import { submissionRepository } from '../../mongo/submissionRepository';
import { removeProjectFromSubmissionUseCase } from '../../useCases/projectSubmission/removeProjectFromSubmission/removeProjectFromSubmissionUseCase';
import { createSubmissionRequirementUseCase } from '../../useCases/requirements/addSubmissionRequirement/createSubmissionRequirementUseCase';
import {
  assertSubmissions,
  createAndSaveSubmission,
  DRM_NUMBER,
  getProjectSubmissionCommandProps,
  getSubmissionRequirementRequestProps,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`RemoveProjectFromSubmissionUseCase`, () => {
  before(() => {
    userMocker.mock(userMocks.executor);
  });
  after(() => {
    userMocker.reset();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  [
    {
      description: 'submission do not exists',
      requestError: {
        submissionNumber: `500150`
      }
    }
  ].forEach(test => {
    it(`should return notFoundError when ${test.description} `, async () => {
      const addProjectToSubmission: IProjectSubmissionProps = mergeProperties(
        getProjectSubmissionCommandProps(),
        test.requestError
      );
      const result = await removeProjectFromSubmissionUseCase.execute(addProjectToSubmission);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
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
    });

    describe(`Negative`, () => {
      beforeEach(async () => {
        submission = await createAndSaveSubmission({
          projectIds: [alreadyExistingProject.id],
          programBookId
        });
      });

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
            description: 'submission do not contains project',
            submissionError: {
              projectId: 'P99999'
            },
            expectedErrors: [
              {
                code: ErrorCode.MISSING,
                message: `Project P99999 do not belongs to submission ${SUBMISSION_NUMBER}`,
                succeeded: false,
                target: 'id'
              }
            ]
          },
          {
            description: 'project is the last project in submission',
            submissionError: {
              projectIds: [projectId]
            },
            expectedErrors: [
              {
                code: ErrorCode.FORBIDDEN,
                message: `Cannot remove project P00002 as it is the last in submission ${SUBMISSION_NUMBER}`,
                succeeded: false,
                target: 'id'
              }
            ]
          },
          {
            description: 'The project have an a submission requirement',
            submissionError: {
              projectIds: ['P00002']
            },
            hasSubmissionRequirement: true,
            expectedErrors: [
              {
                code: ErrorCode.UNPROCESSABLE_ENTITY,
                message: 'The project have an a submission requirement',
                succeeded: false,
                target: 'requirements'
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

            if (test?.hasSubmissionRequirement) {
              const submissionRequirementCmdProps = getSubmissionRequirementRequestProps({
                submissionNumber: submission.submissionNumber,
                subtypeId: SubmissionRequirementSubtype.SCHOOL_HOLIDAYS,
                text: 'teste',
                projectIds: ['P00002']
              });

              const resultAdd = await createSubmissionRequirementUseCase.execute(submissionRequirementCmdProps);
              const resultRequirement: SubmissionRequirement = resultAdd.value.getValue() as SubmissionRequirement;

              submission = await createAndSaveSubmission({
                projectIds: ['P00002', 'P99999'],
                programBookId,
                requirements: [resultRequirement]
              });
              assert.isTrue(resultAdd.isRight());
            }

            const result = await removeProjectFromSubmissionUseCase.execute(
              getProjectSubmissionCommandProps({
                submissionNumber: submission.submissionNumber,
                projectId: test.submissionError.projectId ? test.submissionError.projectId : projectId
              })
            );
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });
      });

      describe(`Positive`, () => {
        [
          {
            description: `existing project`,
            data: {
              hasPreviousSubmission: true,
              existingProject: true
            }
          },
          {
            description: `not existing project`,
            data: {
              hasPreviousSubmission: false,
              existingProject: false
            }
          },
          {
            description: `project without previous submission`,
            data: {
              hasPreviousSubmission: false,
              existingProject: true
            }
          }
        ].forEach(test => {
          it(`should remove project from submission with ${test.description}`, async () => {
            let projectToRemove: IEnrichedProject;
            if (test.data.existingProject) {
              projectToRemove = await createAndSaveProject(
                {
                  status: ProjectStatus.finalOrdered,
                  drmNumber: DRM_NUMBER,
                  submissionNumber: SUBMISSION_NUMBER
                },
                programBookId
              );
            }
            const projectToRemoveId = projectToRemove?.id ? projectToRemove.id : 'P99999';

            const previousSubmissionNumber = `${DRM_NUMBER}05`;
            if (test.data.hasPreviousSubmission) {
              // create an older submission to make sure it is not the one set on the removed project
              await createAndSaveSubmission({
                submissionNumber: `${DRM_NUMBER}01`,
                projectIds: [projectToRemoveId],
                status: SubmissionStatus.INVALID,
                programBookId,
                audit: getAudit({
                  createdAt: MomentUtils.subtract(MomentUtils.now(), 1, TimeUnits.MONTH).toISOString()
                })
              });
              // previous submission to be the current submission of the removed project
              await createAndSaveSubmission({
                submissionNumber: previousSubmissionNumber,
                projectIds: [projectToRemoveId],
                status: SubmissionStatus.INVALID,
                programBookId,
                audit: getAudit({
                  createdAt: MomentUtils.subtract(MomentUtils.now(), 1, TimeUnits.WEEK).toISOString()
                })
              });
            }

            // Create submission to update
            submission = await createAndSaveSubmission({
              projectIds: [alreadyExistingProject.id, projectToRemoveId],
              status: SubmissionStatus.VALID,
              programBookId
            });

            const projectSubmissionCmdProps = getProjectSubmissionCommandProps({
              submissionNumber: submission.submissionNumber,
              projectId: projectToRemoveId
            });

            const result = await removeProjectFromSubmissionUseCase.execute(projectSubmissionCmdProps);
            assert.isTrue(result.isRight());
            const updatedSubmission: ISubmission = result.value.getValue() as ISubmission;
            // expected submission is same as before except for projectIds
            const expectedSubmission = await submissionMapperDTO.getFromModel(
              Submission.create({
                ...submission.props,
                projectIds: [alreadyExistingProject.id, projectToRemoveId].filter(pid => pid !== projectToRemoveId)
              }).getValue()
            );
            assertSubmissions(updatedSubmission, expectedSubmission);

            // Check for project update
            if (test.data.existingProject) {
              const updatedProject = await projectRepository.findById(projectToRemove.id);
              if (test.data.hasPreviousSubmission) {
                assert.strictEqual(updatedProject.submissionNumber, previousSubmissionNumber);
              } else {
                assert.isNull(updatedProject.submissionNumber);
              }
            }
          });
        });
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
          const submissionProps: ISubmissionCreateRequestProps = {
            programBookId: programBook.id,
            projectIds: createdProjects.map(el => el.id)
          };
          const createdSubmission = await createAndSaveSubmission(submissionProps);
          const props: IProjectSubmissionProps = {
            projectId: createdProjects.find(x => x).id,
            submissionNumber: createdSubmission.submissionNumber
          };
          await assertUseCaseRestrictions<IProjectSubmissionProps, ISubmission>(
            test,
            removeProjectFromSubmissionUseCase,
            props
          );
        });
      });
    });
  });
});

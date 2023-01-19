import {
  ErrorCodes,
  ISubmission,
  nextAuthorizedSubmissionProgressStatuses,
  ProjectStatus,
  SubmissionProgressStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests, INVALID_UUID, mergeProperties } from '../../../../../tests/utils/testHelper';
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
import { enumValues } from '../../../../utils/enumUtils';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { createAndSaveDefaultProgramBook } from '../../../programBooks/tests/programBookTestHelper';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { Submission } from '../../models/submission';
import { ISubmissionCreateRequestProps } from '../../models/submissionCreateRequest';
import { submissionRepository } from '../../mongo/submissionRepository';
import { patchSubmissionUseCase } from '../../useCases/patchSubmission/patchSubmissionUseCase';
import { ISubmissionPatchRequestProps } from '../../useCases/patchSubmission/submissionPatchRequest';
import {
  createAndSaveSubmission,
  DRM_NUMBER,
  getSubmissionPatchRequestProps,
  getSubmissionProps,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

// tslint:disable: max-func-body-length
describe(`PatchSubmissionUseCase`, () => {
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
        description: 'missing status AND progressStatus',
        requestError: {
          status: undefined,
          progressStatus: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'input',
            code: ErrorCodes.MissingValue,
            message: `Must have a value for at least one of following fields: status,progressStatus`
          }
        ]
      },
      {
        description: 'invalid progressStatusChangeDate',
        requestError: {
          progressStatusChangeDate: '2022'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'progressStatusChangeDate',
            code: ErrorCodes.InvalidInput,
            message: `Date is invalid, should be YYYY-MM-DDTHH:mm:ss.sssZ. Got 2022`
          }
        ]
      },
      {
        description: 'missing progressStatusChangeDate if progressStatus',
        requestError: {
          progressStatusChangeDate: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'progressStatusChangeDate',
            code: ErrorCodes.MissingValue,
            message: `progressStatusChangeDate is null or undefined`
          }
        ]
      },
      {
        description: 'invalid status',
        requestError: {
          status: 'wrong'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: undefined,
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'wrong' is invalid for taxonomy group: 'submissionStatus'`
          }
        ]
      },
      {
        description: 'invalid progressStatus',
        requestError: {
          progressStatus: 'wrong'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: undefined,
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'wrong' is invalid for taxonomy group: 'submissionProgressStatus'`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const submissionPatchRequest: ISubmissionPatchRequestProps = mergeProperties(
          getSubmissionPatchRequestProps(),
          test.requestError
        );
        const result = await patchSubmissionUseCase.execute(submissionPatchRequest);
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
      }
    ].forEach(test => {
      it(`should return notFoundError when ${test.description} `, async () => {
        const submissionPatchRequest: ISubmissionPatchRequestProps = getSubmissionPatchRequestProps(test.requestError);
        const result = await patchSubmissionUseCase.execute(submissionPatchRequest);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    let submission: Submission;
    beforeEach(async () => {
      submission = await createAndSaveSubmission();
    });

    describe(`Negative`, () => {
      describe(`Validate business rules`, () => {
        [
          {
            description: 'submission status is valid and progressStatus invalid',
            submissionError: {
              status: SubmissionStatus.VALID
            },
            expectedErrors: [
              {
                code: ErrorCode.UNPROCESSABLE_ENTITY,
                message: 'submission status should be valid',
                succeeded: false,
                target: 'progressStatus'
              }
            ]
          },
          {
            description: 'submission status updated without comment',
            submissionError: {
              status: SubmissionStatus.VALID
            },
            expectedErrors: [
              {
                code: ErrorCode.UNPROCESSABLE_ENTITY,
                message: 'submission status should be valid',
                succeeded: false,
                target: 'progressStatus'
              }
            ]
          }
        ].forEach(test => {
          it(`should return unprocessableEntityError with ${test.description}`, async () => {
            // update submission before patch
            submission = (
              await submissionRepository.save(
                Submission.create({
                  ...submission.props,
                  status: SubmissionStatus.INVALID
                }).getValue()
              )
            ).getValue();

            const result = await patchSubmissionUseCase.execute(getSubmissionPatchRequestProps());
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });

        it(`should return unprocessableEntityError with invalid progress status transition`, async () => {
          // initial submission progressStatus is preliminaryDraft
          // get all nextInvalidProgressStatuses
          const nextInvalidProgressStatuses = enumValues<SubmissionProgressStatus>(SubmissionProgressStatus).filter(
            status =>
              status !== submission.progressStatus &&
              !nextAuthorizedSubmissionProgressStatuses(submission.progressStatus).includes(status)
          );
          for (const nextStatus of nextInvalidProgressStatuses) {
            const result = await patchSubmissionUseCase.execute(
              getSubmissionPatchRequestProps({
                progressStatus: nextStatus
              })
            );
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            const expectedErrors = [
              {
                code: ErrorCode.FORBIDDEN,
                message: `Transition to ${nextStatus} is not authorized. Authorized progressStatus: ${nextAuthorizedSubmissionProgressStatuses(
                  submission.progressStatus
                )}`,
                succeeded: false,
                target: 'progressStatus'
              }
            ];
            assertFailures(failures, expectedErrors);
          }
        });

        [
          {
            description: `submission audit createdAt`,
            withProgressHistory: false
          },
          {
            description: `submission progressHistoryItem audit createdAt`,
            withProgressHistory: true
          }
        ].forEach(test => {
          it(`should return unprocessableEntityError with progressStatusChangeDate before ${test.description}`, async () => {
            let submissionTest = await createAndSaveSubmission(
              getSubmissionProps({
                status: SubmissionStatus.VALID,
                progressHistory: undefined
              })
            );
            if (test.withProgressHistory) {
              // update submission before patch
              const patchResult = await patchSubmissionUseCase.execute(
                getSubmissionPatchRequestProps({
                  progressStatus: nextAuthorizedSubmissionProgressStatuses(submissionTest.progressStatus).find(s => s),
                  progressStatusChangeDate: new Date().toISOString(),
                  status: SubmissionStatus.VALID
                })
              );
              assert.isTrue(patchResult.isRight());
              submissionTest = await submissionRepository.findById(submissionTest.submissionNumber);
            }

            const result = await patchSubmissionUseCase.execute(
              getSubmissionPatchRequestProps({
                progressStatus: nextAuthorizedSubmissionProgressStatuses(submissionTest.progressStatus).find(s => s),
                progressStatusChangeDate: '2000-12-03T20:06:06.956Z'
              })
            );
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            let minimalDate = submissionTest.audit.createdAt;
            if (test.withProgressHistory) {
              minimalDate = submissionTest.progressHistory[submissionTest.progressHistory.length - 1].audit.createdAt;
            }
            const failures: IGuardResult[] = (result.value as any).error.error;
            const expectedErrors = [
              {
                code: ErrorCode.FORBIDDEN,
                message: `progressStatusChangeDate must be after ${minimalDate}`,
                succeeded: false,
                target: 'progressStatusChangeDate'
              }
            ];
            assertFailures(failures, expectedErrors);
          });
        });
      });
    });

    describe(`Positive`, () => {
      [
        {
          description: 'status',
          patch: {
            status: SubmissionStatus.INVALID,
            comment: 'update status',
            progressStatus: undefined,
            progressStatusChangeDate: undefined
          }
        },
        {
          description: 'progressStatus',
          patch: {
            progressStatus: SubmissionProgressStatus.DESIGN,
            progressStatusChangeDate: MomentUtils.add(new Date(), 7, TimeUnits.DAY).toISOString(),
            comment: 'update progressStatus',
            status: undefined
          }
        },
        {
          description: 'status & progressStatus',
          patch: {
            status: SubmissionStatus.INVALID,
            progressStatus: SubmissionProgressStatus.DESIGN,
            progressStatusChangeDate: MomentUtils.add(new Date(), 7, TimeUnits.DAY).toISOString(),
            comment: 'update status & progressStatus'
          }
        }
      ].forEach(test => {
        it(`should patch submission with ${test.description}`, async () => {
          const submissionPatchRequest: ISubmissionPatchRequestProps = mergeProperties(
            getSubmissionPatchRequestProps(),
            test.patch
          );
          const result = await patchSubmissionUseCase.execute(submissionPatchRequest);
          assert.isTrue(result.isRight());
          const patchedSubmission: ISubmission = result.value.getValue() as ISubmission;
          assert.strictEqual(patchedSubmission.submissionNumber, submissionPatchRequest.submissionNumber);
          assert.strictEqual(patchedSubmission.drmNumber, submission.drmNumber, `should not be modified`);
          assert.strictEqual(patchedSubmission.programBookId, submission.programBookId, `should not be modified`);
          assert.isTrue(
            patchedSubmission.projectIds.every(projectId => submission.projectIds.includes(projectId)),
            `should not be modified`
          );
          if (test.patch.status) {
            assert.strictEqual(patchedSubmission.status, test.patch.status);
          } else {
            assert.strictEqual(patchedSubmission.status, submission.status);
          }
          if (test.patch.progressStatus) {
            assert.strictEqual(patchedSubmission.progressStatus, test.patch.progressStatus);
            assert.strictEqual(patchedSubmission.progressHistory.length, 2);
            const lastProgressHistoryItem = patchedSubmission.progressHistory.pop();
            assert.strictEqual(lastProgressHistoryItem.progressStatus, test.patch.progressStatus);
            assert.strictEqual(lastProgressHistoryItem.createdAt, test.patch.progressStatusChangeDate);
            assert.strictEqual(lastProgressHistoryItem.createdBy.userName, userMocker.currentMock.userName);
            assert.strictEqual(lastProgressHistoryItem.createdBy.displayName, userMocker.currentMock.displayName);
          } else {
            assert.strictEqual(patchedSubmission.progressStatus, submission.progressStatus);
          }
          assert.isDefined(patchedSubmission.audit.lastModifiedAt);
          assert.isDefined(patchedSubmission.audit.lastModifiedBy);
        });
      });
    });
    describe(`UserRestrictions`, () => {
      let programBook: ProgramBook;
      const PROGRAMBOOK_ID = '61aa1bf9a4ab2cdc2cd53852';
      beforeEach(async () => {
        programBook = await createAndSaveDefaultProgramBook({}, {}, PROGRAMBOOK_ID);
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
          const props: ISubmissionPatchRequestProps = getSubmissionPatchRequestProps({
            submissionNumber: createdSubmission.id
          });
          await assertUseCaseRestrictions<ISubmissionPatchRequestProps, ISubmission>(
            test,
            patchSubmissionUseCase,
            props
          );
        });
      });
    });
  });
});

import { ErrorCodes, IComment, InterventionStatus, ProjectStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_INTERVENTION_ID,
  NOT_FOUND_PROJECT_ID,
  NOT_FOUND_UUID,
  VALID_UUID
} from '../../../../../tests/utils/testHelper';
import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { IRestrictionTestData } from '../../../../shared/restrictions/tests/restrictionsValidator.test';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { IInterventionProps } from '../../../interventions/models/intervention';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import {
  createAndSaveIntervention,
  interventionRestrictionsData
} from '../../../interventions/tests/interventionTestHelper';
import { deleteCommentFromInterventionUseCase } from '../../../interventions/useCases/comments/deleteComment/deleteCommentFromInterventionUseCase';
import { IProjectProps } from '../../../projects/models/project';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { deleteCommentFromProjectUseCase } from '../../../projects/useCases/comments/deleteComment/deleteCommentFromProjectUseCase';
import { IDeleteCommentCommandProps } from '../../useCases/deleteComment/deleteCommentCommand';
import { DeleteCommentUseCase } from '../../useCases/deleteComment/deleteCommentUseCase';
import { getComment } from '../commentTestHelper';

// tslint:disable: max-func-body-length
describe(`DeleteCommentUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  function getUseCase(entityType: string): DeleteCommentUseCase<any> {
    switch (entityType) {
      case 'project':
        return deleteCommentFromProjectUseCase;
      case 'intervention':
        return deleteCommentFromInterventionUseCase;
      default:
        throw Error('Invalid entityType');
    }
  }

  describe(`Negative`, () => {
    [
      {
        description: 'invalid comment id',
        type: 'project',
        requestError: {
          commentId: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'commentId',
            code: ErrorCodes.InvalidInput,
            message: `commentId has a bad format`
          }
        ]
      },
      {
        description: 'invalid project id',
        type: 'project',
        requestError: {
          id: 'XXXXX'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: `id has a bad format`
          }
        ]
      },
      {
        description: 'invalid intervention id',
        type: 'intervention',
        requestError: {
          id: 'XXXXX'
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
        const deleteCommentRequest: IDeleteCommentCommandProps = {
          id: test.type === 'project' ? NOT_FOUND_PROJECT_ID : NOT_FOUND_INTERVENTION_ID,
          commentId: VALID_UUID,
          ...test.requestError
        };
        const result = await getUseCase(test.type).execute(deleteCommentRequest);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`with a prepopulated database`, () => {
    let entity: any;
    let useCase: DeleteCommentUseCase<any>;
    let repository: IBaseRepository<any, any>;

    async function setup(entityType: string, entityData: Partial<IProjectProps | IInterventionProps>) {
      if (entityType === 'project') {
        entity = await createAndSaveProject({
          ...(entityData as IProjectProps)
        });
        repository = projectRepository;
      } else {
        entity = await createAndSaveIntervention({
          ...(entityData as IInterventionProps)
        });
        repository = interventionRepository;
      }
      useCase = getUseCase(entityType);
    }

    describe(`Negative`, () => {
      [
        {
          description: 'comment do not exists',
          type: 'project',
          requestError: {
            commentId: NOT_FOUND_UUID
          }
        },
        {
          description: 'project do not exists',
          type: 'project',
          requestError: {
            id: NOT_FOUND_PROJECT_ID
          }
        },
        {
          description: 'intervention do not exists',
          type: 'intervention',
          requestError: {
            id: NOT_FOUND_INTERVENTION_ID
          }
        }
      ].forEach(test => {
        it(`should return notFoundError when ${test.description} `, async () => {
          await setup(test.type, {});

          const deleteCommentRequest: IDeleteCommentCommandProps = {
            commentId: VALID_UUID,
            id: entity.id,
            ...test.requestError
          };
          const result = await useCase.execute(deleteCommentRequest);
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
        });
      });

      describe(`Validate Projects and Intervention`, () => {
        [
          {
            description: `project is ${ProjectStatus.canceled}`,
            data: {
              type: 'project',
              status: ProjectStatus.canceled
            },
            expectedErrors: [
              {
                code: ErrorCodes.ProjectStatus,
                message: `Cannot interact with a project with status canceled`,
                succeeded: false,
                target: 'status'
              }
            ]
          },
          {
            description: `intervention is ${InterventionStatus.canceled}`,
            data: {
              type: 'intervention',
              status: InterventionStatus.canceled
            },
            expectedErrors: [
              {
                code: ErrorCode.FORBIDDEN,
                message: `Cannot interact with an intervention with status canceled`,
                succeeded: false,
                target: 'status'
              }
            ]
          }
        ].forEach(test => {
          it(`should return unprocessableEntityError when ${test.description}`, async () => {
            const comment = getComment();
            await setup(test.data.type, {
              status: test.data.status,
              comments: [comment]
            });

            const deleteCommentRequest: IDeleteCommentCommandProps = {
              commentId: comment.id,
              id: entity.id
            };

            const result = await useCase.execute(deleteCommentRequest);
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = (result.value as any).error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });
      });
    });

    describe(`Positive`, () => {
      [
        {
          type: `project`
        },
        {
          type: `intervention`
        }
      ].forEach(test => {
        it(`should delete comment from ${test.type}`, async () => {
          const TEXT_FIRST = 'first';
          const TEXT_SECOND = 'second';
          const comments = [
            getComment({
              text: TEXT_FIRST
            }),
            getComment({
              text: TEXT_SECOND
            })
          ];
          await setup(test.type, {
            comments
          });
          // Before :
          entity = await repository.findById(entity.id);
          assert.strictEqual(entity.comments.length, 2);

          const firstComment = entity.comments.find((c: IComment) => c.text === TEXT_FIRST);

          const deleteCommentRequest: IDeleteCommentCommandProps = {
            id: entity.id,
            commentId: firstComment.id
          };

          const result = await useCase.execute(deleteCommentRequest);
          assert.isTrue(result.isRight());
          // After :
          entity = await repository.findById(entity.id);
          assert.strictEqual(entity.comments.length, comments.length - 1, `should have deleted one comment`);
          const remainingComment = entity.comments.find((c: IComment) => c);
          assert.strictEqual(remainingComment.text, TEXT_SECOND);
        });
      });
    });
  });

  describe(`delete Comment : User Restrictions`, () => {
    [
      {
        description: 'delete Comment from intervention',
        creationEntity: createAndSaveIntervention,
        testData: interventionRestrictionsData,
        useCase: deleteCommentFromInterventionUseCase
      },
      {
        description: 'delete Comment from project',
        creationEntity: createAndSaveProject,
        testData: projectRestrictionsTestData,
        useCase: deleteCommentFromProjectUseCase
      }
    ].forEach(scenario => {
      describe(scenario.description, () => {
        scenario.testData.forEach((test: IRestrictionTestData<any>) => {
          it(test.scenario, async () => {
            // prepare props to create entity
            const props = mergeProperties(test.props, {
              comments: [getComment()]
            });
            // create entity
            const entity = await scenario.creationEntity(props);
            // prepare use case props
            const deleteCommentRequest: IDeleteCommentCommandProps = {
              id: entity.id,
              commentId: entity.comments.find(x => x).id
            };
            // execute and assert use case response based on user restrictions
            await assertUseCaseRestrictions<IDeleteCommentCommandProps, any>(
              test,
              scenario.useCase,
              deleteCommentRequest
            );
          });
        });
      });
    });
  });
});

import { ErrorCodes, IComment } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { omit } from 'lodash';

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
import { userMocker } from '../../../../../tests/utils/userUtils';
import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { IRestrictionTestData } from '../../../../shared/restrictions/tests/restrictionsValidator.test';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { IInterventionProps } from '../../../interventions/models/intervention';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import {
  createAndSaveIntervention,
  interventionRestrictionsData
} from '../../../interventions/tests/interventionTestHelper';
import { updateCommentInterventionUseCase } from '../../../interventions/useCases/comments/updateComment/updateCommentInterventionUseCase';
import { IProjectProps } from '../../../projects/models/project';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { updateCommentProjectUseCase } from '../../../projects/useCases/comments/updateComment/updateCommentProjectUseCase';
import { IUpdateCommentCommandProps } from '../../useCases/updateComment/updateCommentCommand';
import { UpdateCommentUseCase } from '../../useCases/updateComment/updateCommentUseCase';
import { assertComment, getComment, getIComment, getPlainCommentProps } from '../commentTestHelper';

/**
 * MOST VALIDATION TEST ARE DONE IN ADDCOMMENTUSECASE TEST
 * Update elements inherites from Add
 */
// tslint:disable: max-func-body-length
describe(`UpdateCommentUseCase`, () => {
  function getUseCase(entityType: string): UpdateCommentUseCase<any> {
    switch (entityType) {
      case 'project':
        return updateCommentProjectUseCase;
      case 'intervention':
        return updateCommentInterventionUseCase;
      default:
        throw Error('Invalid entityType');
    }
  }

  afterEach(async () => {
    await destroyDBTests();
  });

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
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const updateCommentRequest: IUpdateCommentCommandProps = {
          id: test.type === 'project' ? NOT_FOUND_PROJECT_ID : NOT_FOUND_INTERVENTION_ID,
          ...getPlainCommentProps(),
          commentId: VALID_UUID,
          ...test.requestError
        };
        const result = await getUseCase(test.type).execute(updateCommentRequest);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = result.value.error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`with a prepopulated database`, () => {
    let entity: any;
    let useCase: UpdateCommentUseCase<any>;
    let repository: IBaseRepository<any, any>;

    async function setup(entityType: string, entityData: Partial<IProjectProps | IInterventionProps>) {
      switch (entityType) {
        case 'project':
          entity = await createAndSaveProject({
            ...(entityData as IProjectProps)
          });
          repository = projectRepository;
          break;
        case 'intervention':
          entity = await createAndSaveIntervention({
            ...(entityData as IInterventionProps)
          });
          repository = interventionRepository;
          break;
        default:
          throw Error('Invalid entityType');
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
        }
      ].forEach(test => {
        it(`should return notFoundError when ${test.description} `, async () => {
          await setup(test.type, {});

          const updateCommentRequest: IUpdateCommentCommandProps = {
            commentId: VALID_UUID,
            ...getPlainCommentProps(),
            id: entity.id,
            ...test.requestError
          };
          const result = await useCase.execute(updateCommentRequest);
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
        });
      });

      describe(`Positive`, () => {
        [
          {
            description: `project`,
            type: `project`,
            data: {
              isProjectVisible: undefined
            }
          },
          {
            description: `intervention`,
            type: `intervention`,
            data: {}
          },
          {
            description: `intervention with private comment`,
            type: `intervention`,
            data: {},
            request: {
              isPublic: false
            }
          }
        ].forEach(test => {
          it(`should update ${test.description} comment`, async () => {
            const TEXT = 'comment is created';
            const comments = [
              getComment(
                mergeProperties(
                  {
                    text: TEXT
                  },
                  {
                    ...test.data
                  }
                )
              ),
              getComment({
                text: 'second comment'
              })
            ];

            await setup(test.type, {
              comments
            });
            // Before :
            entity = await repository.findById(entity.id);
            assert.strictEqual(entity.comments.length, comments.length);

            const commentIndex = 0; // update first comment
            assert.strictEqual(comments[commentIndex].text, TEXT);

            const TEXT_UPDATE = 'comment is updated';
            const updateCommentRequest: IUpdateCommentCommandProps = {
              ...mergeProperties(
                getPlainCommentProps({
                  text: TEXT_UPDATE
                }),
                test.request
              ),
              id: entity.id,
              commentId: comments[commentIndex].id
            };

            const result = await useCase.execute(updateCommentRequest);
            assert.isTrue(result.isRight());
            // After :
            entity = await repository.findById(entity.id);
            assert.strictEqual(entity.comments.length, 2);

            const updatedComment: IComment = entity.comments.find((c: IComment) => c.id === comments[commentIndex].id);
            assertComment(updatedComment, getIComment(omit(updateCommentRequest, ['id', 'commentId'])));
            if (test.type === 'project') {
              assert.isUndefined(updatedComment.isProjectVisible);
            }
            if (test.type === 'intervention') {
              assert.isDefined(updatedComment.isProjectVisible);
              assert.isFalse(updatedComment.isProjectVisible, `should be false as default value`);
            }
          });
        });
      });
    });
  });

  describe(`update Comment : User Restrictions`, () => {
    [
      {
        description: 'update Comment from intervention',
        creationEntity: createAndSaveIntervention,
        testData: interventionRestrictionsData,
        useCase: updateCommentInterventionUseCase
      },
      {
        description: 'update Comment from project',
        creationEntity: createAndSaveProject,
        testData: projectRestrictionsTestData,
        useCase: updateCommentProjectUseCase
      }
    ].forEach(scenario => {
      describe(scenario.description, () => {
        scenario.testData.forEach((test: IRestrictionTestData<any>) => {
          it(test.scenario, async () => {
            // prepare props to create entity
            const props = mergeProperties(test.props, {
              comments: [getComment()]
            });
            // create intervention with document
            const entity = await scenario.creationEntity(props);
            const firstComment = entity.comments.find(x => x);
            // mock user restrictions
            userMocker.mockRestrictions(test.useRestrictions);

            const updateCommentRequest: IUpdateCommentCommandProps = {
              id: entity.id,
              ...getPlainCommentProps(),
              commentId: firstComment.id
            };
            // execute and assert use case response based on user restrictions
            await assertUseCaseRestrictions<IUpdateCommentCommandProps, any>(
              test,
              scenario.useCase,
              updateCommentRequest
            );
          });
        });
      });
    });
  });
});

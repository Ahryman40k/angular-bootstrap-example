import { ErrorCodes, IComment, InterventionStatus, ProjectStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { isNil } from 'lodash';

import {
  assertFailures,
  destroyDBTests,
  mergeProperties,
  NOT_FOUND_INTERVENTION_ID,
  NOT_FOUND_PROJECT_ID
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
import { addCommentToInterventionUseCase } from '../../../interventions/useCases/comments/addComment/addCommentToInterventionUseCase';
import { IProjectProps } from '../../../projects/models/project';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { addCommentToProjectUseCase } from '../../../projects/useCases/comments/addComment/addCommentToProjectUseCase';
import { IAddCommentCommandProps } from '../../useCases/addComment/addCommentCommand';
import { AddCommentUseCase } from '../../useCases/addComment/addCommentUseCase';
import { assertComment, getIComment, getPlainCommentProps } from '../commentTestHelper';

// tslint:disable: max-func-body-length
describe(`AddCommentUseCase`, () => {
  function getUseCase(entityType: string): AddCommentUseCase<any> {
    switch (entityType) {
      case 'project':
        return addCommentToProjectUseCase;
      case 'intervention':
        return addCommentToInterventionUseCase;
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
        const addCommentRequest: IAddCommentCommandProps = {
          id: test.type === 'project' ? NOT_FOUND_PROJECT_ID : NOT_FOUND_INTERVENTION_ID,
          ...getPlainCommentProps(),
          ...test.requestError
        };
        const result = await getUseCase(test.type).execute(addCommentRequest);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = result.value.error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });
  // NOSONAR
  describe(`with a prepopulated database`, () => {
    let entity: any;
    let useCase: AddCommentUseCase<any>;
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

          const addCommentRequest: IAddCommentCommandProps = {
            ...getPlainCommentProps(),
            id: entity.id,
            ...test.requestError
          };
          const result = await useCase.execute(addCommentRequest);
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
            await setup(test.data.type, {
              status: test.data.status
            });

            const addCommentRequest: IAddCommentCommandProps = {
              ...getPlainCommentProps(),
              id: entity.id
            };

            const result = await useCase.execute(addCommentRequest);
            assert.isTrue(result.isLeft());
            assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
            const failures: IGuardResult[] = result.value.error.error;
            assertFailures(failures, test.expectedErrors);
          });
        });
      });
    });

    describe(`Positive`, () => {
      [
        {
          description: `project`,
          type: `project`,
          comment: {}
        },
        {
          description: `intervention`,
          type: `intervention`,
          comment: {}
        },
        {
          description: `intervention with private comment`,
          type: `intervention`,
          comment: {
            isPublic: false
          }
        },
        {
          description: `intervention with isProjectVisible`,
          type: `intervention`,
          comment: {
            isProjectVisible: true
          }
        }
      ].forEach(test => {
        it(`should add comment to ${test.description}`, async () => {
          await setup(test.type, {});

          // Before :
          entity = await repository.findById(entity.id);
          assert.isEmpty(entity.comments);

          const addCommentRequest: IAddCommentCommandProps = {
            ...getPlainCommentProps(),
            ...test.comment,
            id: entity.id
          };

          const result = await useCase.execute(addCommentRequest);
          assert.isTrue(result.isRight());
          // After :
          entity = await repository.findById(entity.id);
          assert.isNotEmpty(entity.comments);

          const comment: IComment = result.value.getValue() as IComment;
          assertComment(
            comment,
            getIComment({
              ...addCommentRequest
            })
          );
          if (test.type === 'project') {
            assert.isUndefined(comment.isProjectVisible);
          }
          if (test.type === 'intervention') {
            assert.isDefined(comment.isProjectVisible);
            if (!isNil(test.comment.isProjectVisible)) {
              assert.strictEqual(comment.isProjectVisible, test.comment.isProjectVisible);
            } else {
              assert.isFalse(comment.isProjectVisible, `should be false as default value`);
            }
          }
        });
      });
    });
  });

  describe(`add Comment : User Restrictions`, () => {
    [
      {
        description: 'add Comment to intervention',
        creationEntity: createAndSaveIntervention,
        testData: interventionRestrictionsData,
        useCase: addCommentToInterventionUseCase
      },
      {
        description: 'add Comment to project',
        creationEntity: createAndSaveProject,
        testData: projectRestrictionsTestData,
        useCase: addCommentToProjectUseCase
      }
    ].forEach(scenario => {
      describe(scenario.description, () => {
        scenario.testData.forEach((test: IRestrictionTestData<any>) => {
          it(test.scenario, async () => {
            // prepare props to create entity
            const props = mergeProperties({}, test.props);
            // create entity
            const entity = await scenario.creationEntity(props);
            // prepare use case props
            const addCommentRequest: IAddCommentCommandProps = {
              ...getPlainCommentProps(),
              id: entity.id
            };
            // execute and assert use case response based on user restrictions
            await assertUseCaseRestrictions<IAddCommentCommandProps, any>(test, scenario.useCase, addCommentRequest);
          });
        });
      });
    });
  });
});

import { ErrorCodes, IComment } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import {
  assertFailures,
  destroyDBTests,
  NOT_FOUND_INTERVENTION_ID,
  NOT_FOUND_PROJECT_ID
} from '../../../../../tests/utils/testHelper';
import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { IInterventionProps } from '../../../interventions/models/intervention';
import { createAndSaveIntervention } from '../../../interventions/tests/interventionTestHelper';
import { getInterventionCommentsUseCase } from '../../../interventions/useCases/comments/getComments/getInterventionCommentsUseCase';
import { IProjectProps } from '../../../projects/models/project';
import { createAndSaveProject } from '../../../projects/tests/projectTestHelper';
import { getProjectCommentsUseCase } from '../../../projects/useCases/comments/getComments/getProjectCommentsUseCase';
import { GetCommentsUseCase } from '../../useCases/getComments/getCommentsUseCase';
import { assertComment, getComment } from '../commentTestHelper';

// tslint:disable:max-func-body-length
describe(`GetCommentsUseCase`, () => {
  function getUseCase(entityType: string): GetCommentsUseCase<any> {
    switch (entityType) {
      case 'project':
        return getProjectCommentsUseCase;
      case 'intervention':
        return getInterventionCommentsUseCase;
      default:
        throw Error('Invalid entityType');
    }
  }

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
            target: 'id[0]',
            code: ErrorCodes.InvalidInput,
            message: `id[0] has a bad format`
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
            target: 'id[0]',
            code: ErrorCodes.InvalidInput,
            message: `id[0] has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const getCommentsCommand: IByIdCommandProps = {
          id: test.requestError.id
        };
        const result = await getUseCase(test.type).execute(getCommentsCommand);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = result.value.error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

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
      const getCommentsCommand: IByIdCommandProps = {
        id: test.requestError.id
      };
      const result = await getUseCase(test.type).execute(getCommentsCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });
  });

  describe(`Positive`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    describe(`with a pre-populated database`, () => {
      let entity: any;
      let useCase: GetCommentsUseCase<any>;

      async function setup(entityType: string, entityData: Partial<IProjectProps | IInterventionProps>) {
        switch (entityType) {
          case 'project':
            entity = await createAndSaveProject({
              ...(entityData as IProjectProps)
            });
            break;
          case 'intervention':
            entity = await createAndSaveIntervention({
              ...(entityData as IInterventionProps)
            });
            break;
          default:
            throw Error('Invalid entityType');
        }
        useCase = getUseCase(entityType);
      }

      [
        {
          type: `project`
        },
        {
          type: `intervention`
        }
      ].forEach(test => {
        it(`should retrieve comments for given entity id`, async () => {
          const comments = [
            getComment({
              text: 'first'
            }),
            getComment({
              text: 'second'
            })
          ];
          await setup(test.type, {
            comments
          });

          const getCommentsCommand: IByIdCommandProps = {
            id: entity.id
          };
          const result = await useCase.execute(getCommentsCommand);
          assert.isTrue(result.isRight());
          const foundComments = result.value.getValue() as IComment[];
          foundComments.forEach((comment, index) => {
            assertComment(comment, comments[index]);
          });
        });
      });
    });
  });
});

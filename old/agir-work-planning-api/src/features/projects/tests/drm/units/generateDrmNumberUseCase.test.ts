import { ErrorCodes, IDrmProject, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { max } from 'lodash';
import { createSandbox } from 'sinon';

import { getInitialProject } from '../../../../../../tests/data/projectData';
import { assertFailures, destroyDBTests, mergeProperties } from '../../../../../../tests/utils/testHelper';
import * as incPlugin from '../../../../../middlewares/alphaNumericIdIncPlugin';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../../shared/domainErrors/unexpectedError';
import { IGuardResult } from '../../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { ICounter } from '../../../../counters/models/counter';
import { counterRepository } from '../../../../counters/mongo/counterRepository';
import { IInputDrmProjectProps } from '../../../models/drm/inputDrmNumber';
import { projectRepository } from '../../../mongo/projectRepository';
import { generateDrmNumberUseCase } from '../../../useCases/drm/generateDrmNumber/generateDrmNumberUseCase';
import { getInputDrmNumberProps } from '../../drmCounterTestHelper';
import { assertDrmNumbers, createAndSaveProject, projectRestrictionsTestData } from '../../projectTestHelper';

// tslint:disable: max-func-body-length
describe(`GenerateDrmNumberUseCase`, () => {
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });
    [
      {
        description: 'missing project ids',
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
        description: 'missing is common drm number',
        requestError: {
          isCommonDrmNumber: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'isCommonDrmNumber',
            code: ErrorCodes.MissingValue,
            message: `isCommonDrmNumber is null or undefined`
          }
        ]
      },
      {
        description: 'project ids is not an array',
        requestError: {
          projectIds: 2
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectIds',
            code: ErrorCodes.InvalidInput,
            message: `projectIds must be an array`
          }
        ]
      },
      {
        description: 'project ids has wrong type',
        requestError: {
          projectIds: [2]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectIds[0]',
            code: ErrorCodes.InvalidInput,
            message: `projectIds[0] has a bad format`
          },
          {
            succeeded: false,
            target: 'InputDrmProject',
            code: 'openApiInputValidator',
            message: `projectIds0 (2) is not a type of string`
          }
        ]
      },
      {
        description: 'isCommonDrmNumber has wrong type',
        requestError: {
          isCommonDrmNumber: 'undefined'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'isCommonDrmNumber',
            code: ErrorCodes.InvalidInput,
            message: `isCommonDrmNumber is not boolean`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const result = await generateDrmNumberUseCase.execute(
          getInputDrmNumberProps({
            [Object.keys(test.requestError)[0]]: test.requestError[Object.keys(test.requestError)[0]]
          })
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return a not found error when project is inexistant`, async () => {
      const result = await generateDrmNumberUseCase.execute(getInputDrmNumberProps());
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    it(`should return an error if concurency conflict on drmNumber create`, async () => {
      const mockProject = (await projectRepository.save(getInitialProject())).getValue();
      const sandbox = createSandbox();
      sandbox
        .stub(incPlugin, 'findOneAndUpsertCounter')
        .callThrough()
        .withArgs('drm')
        .resolves(null);
      const result = await generateDrmNumberUseCase.execute(getInputDrmNumberProps({ projectIds: [mockProject.id] }));
      assert.isTrue(result.isLeft());
      assert.instanceOf(result.value, UnexpectedError);
      assert.strictEqual((result.value.error as any).error, `System failed to generate drm numbers`);
      sandbox.restore();
    });
  });

  describe(`Positive`, () => {
    describe(`Generate drm numbers`, () => {
      let mockDrmCounter: ICounter;
      let mockProjects: IEnrichedProject[];
      beforeEach(async () => {
        mockDrmCounter = await counterRepository.findOne({ key: 'drm', prefix: undefined });
        mockProjects = [await createAndSaveProject(), await createAndSaveProject()];
      });
      afterEach(async () => {
        await destroyDBTests();
      });
      [
        {
          description: 'generate drm number for a single project',
          data: {
            projectIdsLength: 1,
            isCommonDrmNumber: false
          },
          expectedDrmNumbers: [{ projectIndex: 0, sequence: 1 }]
        },
        {
          description: 'generate drm numbers for multiples projects',
          data: {
            projectIdsLength: 2,
            isCommonDrmNumber: false
          },
          expectedDrmNumbers: [
            { projectIndex: 0, sequence: 1 },
            { projectIndex: 1, sequence: 2 }
          ]
        },
        {
          description: 'generate a common drm number for multiples projects',
          data: {
            projectIdsLength: 2,
            isCommonDrmNumber: true
          },
          expectedDrmNumbers: [
            { projectIndex: 0, sequence: 1 },
            { projectIndex: 1, sequence: 1 }
          ]
        }
      ].forEach(test => {
        it(`should ${test.description}`, async () => {
          const projectIds = mockProjects.map(p => p.id);
          const result = await generateDrmNumberUseCase.execute(
            getInputDrmNumberProps({
              projectIds: projectIds.slice(0, test.data.projectIdsLength),
              isCommonDrmNumber: test.data.isCommonDrmNumber
            })
          );
          assert.isTrue(result.isRight());
          const expectedDrmNumbers: IDrmProject[] = test.expectedDrmNumbers.map(el => {
            return {
              projectId: mockProjects[el.projectIndex].id,
              drmNumber: `${mockDrmCounter.sequence + el.sequence}`
            };
          });
          assertDrmNumbers(result.value.getValue() as IDrmProject[], expectedDrmNumbers);

          const drmCounter = await counterRepository.findOne({ key: 'drm', prefix: undefined });
          assert.strictEqual(
            drmCounter.sequence,
            max(test.expectedDrmNumbers.map(p => p.sequence + mockDrmCounter.sequence))
          );
          assert.isEmpty(drmCounter.availableValues);
          assert.strictEqual(drmCounter.__v, mockDrmCounter.__v + 1);
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
            test.multipleProps.map(el => createAndSaveProject(mergeProperties({}, el)))
          );
          const props: IInputDrmProjectProps = {
            isCommonDrmNumber: true,
            projectIds: createdProjects.map(el => el.id)
          };
          await assertUseCaseRestrictions<IInputDrmProjectProps, IDrmProject[]>(test, generateDrmNumberUseCase, props);
        });
      });
    });
  });
});

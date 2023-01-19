import {
  ErrorCodes,
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  ProjectStatus,
  RequirementTargetType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { interventionDataGenerator } from '../../../../../tests/data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import {
  assertFailures,
  destroyDBTests,
  NOT_FOUND_INTERVENTION_ID,
  NOT_FOUND_PROJECT_ID
} from '../../../../../tests/utils/testHelper';
import { IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { Requirement } from '../../models/requirement';
import { IRequirementItemProps } from '../../models/requirementItem';
import { requirementRepository } from '../../mongo/requirementRepository';
import { deleteRequirementUseCase } from '../../useCases/deleteRequirement/deleteRequirementUseCase';
import {
  createRequirementItems,
  getRequirement,
  getUnprocessableStatusRequirementItemTest,
  I_01,
  I_02,
  P_01,
  P_02,
  requirementRestrictionsData
} from '../requirementTestHelper';

// tslint:disable: max-func-body-length
describe(`DeleteRequirementUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });
  describe(`Negative`, () => {
    [
      {
        description: 'missing id',
        requestError: {
          id: undefined
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
        description: 'invalid id',
        requestError: {
          id: 'badFormat'
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
        const result = await deleteRequirementUseCase.execute({ id: test.requestError.id });
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    let requirement: Requirement;
    describe(`Update requirement`, () => {
      let project: IEnrichedProject;
      let intervention: IEnrichedIntervention;

      beforeEach(async () => {
        project = await projectDataGenerator.store({ status: ProjectStatus.planned });
        intervention = await interventionDataGenerator.store({ status: InterventionStatus.integrated });
      });

      [
        {
          description: 'with a valid intervention',
          requested: {
            items: [
              {
                type: RequirementTargetType.intervention
              }
            ]
          }
        },
        {
          description: 'with a valid project',
          requested: {
            items: [{ type: RequirementTargetType.project }]
          }
        },
        {
          description: 'with a not found intervention',
          requested: {
            items: [
              {
                type: RequirementTargetType.intervention,
                id: NOT_FOUND_INTERVENTION_ID
              }
            ]
          }
        },
        {
          description: 'with a not found project',
          requested: {
            items: [
              {
                type: RequirementTargetType.project,
                id: NOT_FOUND_PROJECT_ID
              }
            ]
          }
        },
        {
          description: 'with a not found project and a valid intervention',
          requested: {
            items: [
              {
                type: RequirementTargetType.project,
                id: NOT_FOUND_PROJECT_ID
              },
              {
                type: RequirementTargetType.intervention
              }
            ]
          }
        },
        {
          description: 'with a not found intervention and a valid project',
          requested: {
            items: [
              {
                type: RequirementTargetType.intervention,
                id: NOT_FOUND_INTERVENTION_ID
              },
              {
                type: RequirementTargetType.project
              }
            ]
          }
        },
        {
          description: 'with a not found intervention and a not found project',
          requested: {
            items: [
              {
                type: RequirementTargetType.intervention,
                id: NOT_FOUND_INTERVENTION_ID
              },
              {
                type: RequirementTargetType.project,
                id: NOT_FOUND_PROJECT_ID
              }
            ]
          }
        }
      ].forEach(test => {
        it(`should delete requirement ${test.description}`, async () => {
          const items = test.requested.items.map(item => {
            if (!item.id) {
              item.id = item.type === RequirementTargetType.intervention ? intervention.id : project.id;
            }
            return item as IRequirementItemProps;
          });
          requirement = (await requirementRepository.save(await getRequirement({ items }))).getValue();
          assert.exists(requirement);
          const result = await deleteRequirementUseCase.execute({ id: requirement.id });
          assert.isTrue(result.isRight());
          const requirementResult = await requirementRepository.findById(requirement.id);
          assert.isNull(requirementResult);
        });
      });
    });

    describe(`Invalid items statuses`, () => {
      let projectWithWrongStatus: IEnrichedProject;
      let interventionWithWrongStatus: IEnrichedIntervention;

      beforeEach(async () => {
        projectWithWrongStatus = await projectDataGenerator.store({ status: ProjectStatus.canceled });
        interventionWithWrongStatus = await interventionDataGenerator.store({ status: InterventionStatus.waiting });
      });

      [
        {
          description: 'a project with a bad status',
          targetType: RequirementTargetType.project
        },
        {
          description: 'a intervention with a bad status',
          targetType: RequirementTargetType.intervention
        }
      ].forEach(test => {
        it(`should not delete requirement with ${test.description}`, async () => {
          const entity =
            test.targetType === RequirementTargetType.project ? projectWithWrongStatus : interventionWithWrongStatus;

          requirement = (
            await requirementRepository.save(
              await getRequirement({
                items: [
                  {
                    type: test.targetType,
                    id: entity.id
                  }
                ]
              })
            )
          ).getValue();
          assert.exists(requirement);
          const result = await deleteRequirementUseCase.execute({ id: requirement.id });
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
          const requirementResult = await requirementRepository.findById(requirement.id);
          assert.exists(requirementResult);
          const failures: IGuardResult[] = (result.value as any).error.error;
          const testModel = getUnprocessableStatusRequirementItemTest(entity, test.targetType);
          assertFailures(failures, testModel.expectedErrors);
        });
      });
    });
  });

  describe('User restrictions', () => {
    let PR_01: string;
    let IN_01: string;
    let PR_02: string;
    let IN_02: string;
    beforeEach(async () => {
      [IN_01, IN_02, PR_01, PR_02] = await createRequirementItems();
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    requirementRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const items = test.props.items.map(el => {
          return {
            ...el,
            id: el.id
              .replace(P_01, PR_01)
              .replace(P_02, PR_02)
              .replace(I_01, IN_01)
              .replace(I_02, IN_02)
          };
        });
        const requirement = (
          await requirementRepository.save(await getRequirement({ ...test.props, items }))
        ).getValue();
        const props: IByUuidCommandProps = { id: requirement.id };
        await assertUseCaseRestrictions<IByUuidCommandProps, void>(test, deleteRequirementUseCase, props);
      });
    });
  });
});

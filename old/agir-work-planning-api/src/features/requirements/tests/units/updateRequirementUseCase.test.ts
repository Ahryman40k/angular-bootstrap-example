import {
  ErrorCodes,
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  IRequirement,
  ProjectStatus,
  RequirementTargetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { interventionDataGenerator } from '../../../../../tests/data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import {
  assertFailures,
  destroyDBTests,
  mergeProperties,
  NOT_FOUND_INTERVENTION_ID,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { assertUpdatedAudit } from '../../../audit/test/auditTestHelper';
import { TaxonomyFindOptions } from '../../../taxonomies/models/taxonomyFindOptions';
import { taxonomyRepository } from '../../../taxonomies/mongo/taxonomyRepository';
import { requirementMapperDTO } from '../../mappers/requirementMapperDTO';
import { Requirement } from '../../models/requirement';
import { requirementRepository } from '../../mongo/requirementRepository';
import { IUpdateRequirementCommandProps } from '../../useCases/updateRequirement/updateRequirementCommand';
import { updateRequirementUseCase } from '../../useCases/updateRequirement/updateRequirementUseCase';
import {
  assertRequirement,
  createRequirementItems,
  getRequirement,
  getUnprocessableStatusRequirementItemTest,
  getUpdateRequirementProps,
  I_01,
  I_02,
  P_01,
  P_02,
  updateRequirementRestrictionsTestData
} from '../requirementTestHelper';

// tslint:disable: max-func-body-length
describe(`UpdateRequirementUseCase`, () => {
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
      },
      {
        description: 'missing text',
        requestError: {
          text: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'text',
            code: ErrorCodes.MissingValue,
            message: `text is null or undefined`
          }
        ]
      },
      {
        description: 'invalid text',
        requestError: {
          text: ''
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'text',
            code: ErrorCodes.InvalidInput,
            message: `text is empty`
          }
        ]
      },
      {
        description: 'missing typeId',
        requestError: {
          typeId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'typeId',
            code: ErrorCodes.MissingValue,
            message: `typeId is null or undefined`
          }
        ]
      },
      {
        description: 'empty typeId',
        requestError: {
          typeId: ''
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'typeId',
            code: ErrorCodes.InvalidInput,
            message: `typeId is empty`
          }
        ]
      },
      {
        description: 'invalid typeId',
        requestError: {
          typeId: 'invalid'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'typeId',
            code: ErrorCodes.InvalidInput,
            message: `Taxonomy code: invalid doesn't exist`
          }
        ]
      },
      {
        description: 'missing subtypeId',
        requestError: {
          subtypeId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'subtypeId',
            code: ErrorCodes.MissingValue,
            message: `subtypeId is null or undefined`
          }
        ]
      },
      {
        description: 'empty subtypeId',
        requestError: {
          subtypeId: ''
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'subtypeId',
            code: ErrorCodes.InvalidInput,
            message: `subtypeId is empty`
          }
        ]
      },
      {
        description: 'invalid subtypeId',
        requestError: {
          subtypeId: 'invalid'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'subtypeId',
            code: ErrorCodes.InvalidInput,
            message: `Taxonomy code: invalid doesn't exist`
          }
        ]
      },
      {
        description: 'missing items pair',
        requestError: {
          items: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'items',
            code: ErrorCodes.MissingValue,
            message: `items is null or undefined`
          }
        ]
      },
      {
        description: 'invalid items',
        requestError: {
          items: []
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'items',
            code: ErrorCodes.InvalidInput,
            message: `items is empty`
          }
        ]
      },
      {
        description: 'conflictual pair has three values',
        requestError: {
          items: [
            {
              id: 'I00001',
              type: 'intervention'
            },
            {
              id: 'I00002',
              type: 'intervention'
            },
            {
              id: 'I00003',
              type: 'intervention'
            }
          ]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'items',
            code: ErrorCodes.InvalidInput,
            message: `items must have a maximum length of 2, now has a length of 3`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const updateRequirementCommandProps: IUpdateRequirementCommandProps = mergeProperties(
          await getUpdateRequirementProps(NOT_FOUND_UUID),
          test.requestError
        );
        if (test.requestError.items) {
          updateRequirementCommandProps.items = test.requestError.items;
        }
        const result = await updateRequirementUseCase.execute(updateRequirementCommandProps);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  it(`should return notFoundError when an item element do not exists`, async () => {
    const updateRequirementCommandProps: IUpdateRequirementCommandProps = await getUpdateRequirementProps(
      NOT_FOUND_UUID
    );
    updateRequirementCommandProps.items = [{ id: NOT_FOUND_INTERVENTION_ID, type: RequirementTargetType.intervention }];
    const result = await updateRequirementUseCase.execute(updateRequirementCommandProps);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
  });

  it(`should return InvalidParameterError when subTypeId doesn't fit with the typeId`, async () => {
    const updateRequirementCommandProps: IUpdateRequirementCommandProps = await getUpdateRequirementProps(
      NOT_FOUND_UUID
    );
    const subTypeIds = await taxonomyRepository.findAll(
      TaxonomyFindOptions.create({
        criterias: {
          group: TaxonomyGroup.requirementSubtype
        }
      }).getValue()
    );

    updateRequirementCommandProps.subtypeId = subTypeIds.find(
      subTypeId => subTypeId.properties.requirementType !== updateRequirementCommandProps.typeId
    ).code;
    const result = await updateRequirementUseCase.execute(updateRequirementCommandProps);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
  });

  describe(`with a pre-populated database`, () => {
    let project: IEnrichedProject;
    let intervention: IEnrichedIntervention;
    let requirement: Requirement;
    describe(`Update requirement`, () => {
      beforeEach(async () => {
        project = await projectDataGenerator.store({ status: ProjectStatus.planned });
        intervention = await interventionDataGenerator.store({ status: InterventionStatus.integrated });
        requirement = (await requirementRepository.save(await getRequirement())).getValue();
      });

      it(`should update requirement`, async () => {
        const updateRequirementCommandProps = await getUpdateRequirementProps(requirement.id, {
          items: [
            {
              id: project.id,
              type: RequirementTargetType.project
            },
            {
              id: intervention.id,
              type: RequirementTargetType.intervention
            }
          ],
          text: 'modified text'
        });

        const result = await updateRequirementUseCase.execute(updateRequirementCommandProps);
        assert.isTrue(result.isRight());
        const updatedRequirement: IRequirement = result.value.getValue() as IRequirement;
        const requirementFromDatabase: IRequirement = await requirementMapperDTO.getFromModel(
          await requirementRepository.findById(requirement.id)
        );

        assert.notStrictEqual(updatedRequirement.text, requirement.text);
        assert.notDeepEqual(updatedRequirement.items, requirement.items);
        assert.notStrictEqual(requirementFromDatabase.text, requirement.text);
        assert.notDeepEqual(requirementFromDatabase.items, requirement.items);

        assertRequirement(updatedRequirement, requirementFromDatabase);
        assertUpdatedAudit(requirement.audit, requirementFromDatabase.audit);
      });
    });

    describe(`Invalid items statuses`, () => {
      let projectWithWrongStatus: IEnrichedProject;
      let interventionWithWrongStatus: IEnrichedIntervention;

      beforeEach(async () => {
        projectWithWrongStatus = await projectDataGenerator.store({ status: ProjectStatus.canceled });
        interventionWithWrongStatus = await interventionDataGenerator.store({ status: InterventionStatus.waiting });
        requirement = (await requirementRepository.save(await getRequirement())).getValue();
      });

      for (const test of [
        {
          description: 'a project with a bad status',
          targetType: RequirementTargetType.project
        },
        {
          description: 'a intervention with a bad status',
          targetType: RequirementTargetType.intervention
        }
      ]) {
        it(`should not update requirement with ${test.description}`, async () => {
          const entity =
            test.targetType === RequirementTargetType.project ? projectWithWrongStatus : interventionWithWrongStatus;
          const testModel = getUnprocessableStatusRequirementItemTest(entity, test.targetType);
          const updateRequirementCommandProps = await getUpdateRequirementProps(requirement.id, testModel.requestError);
          const result = await updateRequirementUseCase.execute(updateRequirementCommandProps);
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
          const failures: IGuardResult[] = (result.value as any).error.error;
          assertFailures(failures, testModel.expectedErrors);
        });
      }
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
    updateRequirementRestrictionsTestData.forEach(test => {
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
        const updateProps = test.updateProps || test.props;
        const updateItems = updateProps.items.map(el => {
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
        const updateRequirementCommandProps = await getUpdateRequirementProps(requirement.id, {
          ...updateProps,
          items: updateItems
        });
        await assertUseCaseRestrictions<IUpdateRequirementCommandProps, IRequirement>(
          test,
          updateRequirementUseCase,
          updateRequirementCommandProps
        );
      });
    });
  });
});

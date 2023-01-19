import {
  ErrorCodes,
  IEnrichedIntervention,
  IEnrichedProject,
  IRequirement,
  RequirementTargetType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isArray } from 'lodash';

import { constants } from '../../../../../config/constants';
import { createMockIntervention } from '../../../../../tests/data/interventionData';
import { createMockProject } from '../../../../../tests/data/projectData';
import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { IResultPaginated } from '../../../../repositories/core/baseRepository';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { requirementMapperDTO } from '../../mappers/requirementMapperDTO';
import { Requirement } from '../../models/requirement';
import {
  IRequirementFindPaginatedOptionsProps,
  RequirementFindPaginatedOptions
} from '../../models/requirementFindPaginatedOptions';
import { requirementRepository } from '../../mongo/requirementRepository';
import { searchRequirementUseCase } from '../../useCases/searchRequirement/searchRequirementUseCase';
import { assertRequirement, getRequirement } from '../requirementTestHelper';

// tslint:disable:max-func-body-length
describe(`SearchRequirementUseCase`, () => {
  describe(`Negative`, () => {
    beforeEach(() => {
      userMocker.mock(userMocks.pilot);
    });
    afterEach(async () => {
      await destroyDBTests();
      userMocker.reset();
    });

    [
      {
        description: 'invalid itemId',
        requestError: {
          itemId: 'patate'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'itemId[0]',
            code: ErrorCodes.InvalidInput,
            message: `itemId[0] has a bad format`
          }
        ]
      },
      {
        description: 'invalid ItemType',
        requestError: {
          itemType: 'piller'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'itemType',
            code: ErrorCodes.InvalidInput,
            message: `itemType isn't oneOf the correct values in ["intervention","project"]. Got "piller".`
          }
        ]
      },
      {
        description: 'combination between project id as ItemId and intervention as ItemType',
        requestError: {
          itemType: RequirementTargetType.intervention,
          itemId: 'P00001'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'itemId[0]',
            code: ErrorCodes.InvalidInput,
            message: `itemId[0] has a bad format`
          }
        ]
      },
      {
        description: 'combination between intervention id as ItemId and project as ItemType',
        requestError: {
          itemType: RequirementTargetType.project,
          itemId: 'I00001'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'itemId[0]',
            code: ErrorCodes.InvalidInput,
            message: `itemId[0] has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const searchRequirementQuery: IRequirementFindPaginatedOptionsProps = {
          criterias: { ...test.requestError },
          limit: constants.PaginationDefaults.LIMIT,
          offset: constants.PaginationDefaults.OFFSET
        };
        const result = await searchRequirementUseCase.execute(searchRequirementQuery);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`Positive`, () => {
    const requirementDtos: {
      requirementInterventionDto?: IRequirement;
      requirementInterventionProjectDto?: IRequirement;
      requirementProjectDto?: IRequirement;
    } = {};
    const itemIds: {
      intervention1Id?: string;
      intervention2Id?: string;
      project1Id?: string;
      project2Id?: string;
    } = {};
    let intervention1: IEnrichedIntervention;
    let intervention2: IEnrichedIntervention;
    let project1: IEnrichedProject;
    let project2: IEnrichedProject;
    let requirements: Requirement[];
    const REQUIREMENT_TOTAL_COUNT = 3;

    beforeEach(async () => {
      intervention1 = await createMockIntervention({});
      intervention2 = await createMockIntervention({});
      project1 = await createMockProject({});
      project2 = await createMockProject({});

      itemIds.intervention1Id = intervention1.id;
      itemIds.intervention2Id = intervention2.id;
      itemIds.project1Id = project1.id;
      itemIds.project2Id = project2.id;
      requirements = [
        await getRequirement({
          items: [
            {
              type: RequirementTargetType.intervention,
              id: intervention1.id
            }
          ]
        }),
        await getRequirement({
          items: [
            {
              type: RequirementTargetType.intervention,
              id: intervention2.id
            },
            {
              type: RequirementTargetType.project,
              id: project2.id
            }
          ]
        }),
        await getRequirement({
          items: [
            {
              type: RequirementTargetType.project,
              id: project1.id
            }
          ]
        })
      ];
      await Promise.all(requirements.map(requirement => requirementRepository.save(requirement)));
      const requirementsMapped = await Promise.all(
        requirements.map(requirement => requirementMapperDTO.getFromModel(requirement))
      );
      requirementsMapped.forEach(rm => {
        if (rm.items.length > 1) {
          requirementDtos.requirementInterventionProjectDto = rm;
          return;
        }

        if (rm.items[0].type === RequirementTargetType.intervention) {
          requirementDtos.requirementInterventionDto = rm;
        } else {
          requirementDtos.requirementProjectDto = rm;
        }
      });
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    describe(`with a pre-populated database`, () => {
      [
        {
          description: `itemType ${RequirementTargetType.intervention}`,
          criterias: {
            itemType: RequirementTargetType.intervention as string
          },
          expected: { count: 2, requirements: ['requirementInterventionDto', 'requirementInterventionProjectDto'] }
        },
        {
          description: `itemId ${RequirementTargetType.intervention} &&  ${RequirementTargetType.project}`,
          criterias: {
            itemId: ['intervention1', 'project1']
          },
          expected: { count: 2, requirements: ['requirementInterventionDto', 'requirementInterventionProjectDto'] }
        },
        {
          description: `itemType ${RequirementTargetType.project}`,
          criterias: {
            itemType: RequirementTargetType.project as string
          },
          expected: { count: 2, requirements: ['requirementProjectDto', 'requirementInterventionProjectDto'] }
        },
        {
          description: `itemId with intervention id`,
          criterias: {
            itemId: 'intervention1'
          },
          expected: { count: 1, requirements: ['requirementInterventionDto'] }
        },
        {
          description: `itemId with project id`,
          criterias: {
            itemId: 'project2'
          },
          expected: { count: 1, requirements: ['requirementInterventionProjectDto'] }
        },
        {
          description: `itemId with intervention id and itemType ${RequirementTargetType.intervention}`,
          criterias: {
            itemId: 'intervention1',
            itemType: RequirementTargetType.intervention
          },
          expected: { count: 1, requirements: ['requirementInterventionDto'] }
        }
      ].forEach(test => {
        it(`should find ${test.expected.count} requirement(s) with query parameter ${test.description}`, async () => {
          const allRequirement = await requirementRepository.findAll(
            RequirementFindPaginatedOptions.create({
              criterias: {},
              limit: constants.PaginationDefaults.LIMIT,
              offset: constants.PaginationDefaults.OFFSET
            }).getValue()
          );

          assert.strictEqual(allRequirement.length, REQUIREMENT_TOTAL_COUNT);
          // Replace itemId string by the real project or intervention id if itemId property exists
          if (test.criterias.itemId) {
            if (isArray(test.criterias.itemId)) {
              const ids = test.criterias.itemId.map(el => itemIds[`${el}Id`]);
              test.criterias.itemId = ids.join(',');
            } else {
              test.criterias.itemId = itemIds[`${test.criterias.itemId}Id`];
            }
          }
          const searchRequirementQuery: IRequirementFindPaginatedOptionsProps = {
            criterias: test.criterias,
            limit: constants.PaginationDefaults.LIMIT,
            offset: constants.PaginationDefaults.OFFSET
          };
          const result = await searchRequirementUseCase.execute(searchRequirementQuery);
          assert.isTrue(result.isRight());
          const found: IRequirement[] = (result.value.getValue() as IResultPaginated<IRequirement>).items;
          assert.strictEqual(found.length, test.expected.count);

          for (const f of found) {
            let expectedDto: IRequirement;
            for (const key of Object.keys(requirementDtos)) {
              expectedDto = requirementDtos[key].id === f.id ? f : expectedDto;
            }
            assertRequirement(f, expectedDto);
          }
        });
      });
    });
  });
});

import {
  AnnualProgramStatus,
  ErrorCodes,
  IEnrichedProgramBook,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import {
  assertFailures,
  destroyDBTests,
  INVALID_TYPE,
  mergeProperties,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { PROGRAM_TYPE_PCPR } from '../../../../shared/taxonomies/constants';
import { AnnualProgram } from '../../../annualPrograms/models/annualProgram';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { createAndSaveAnnualProgram, getAnnualProgram } from '../../../annualPrograms/tests/annualProgramTestHelper';
import { priorityScenarioMapperDTO } from '../../../priorityScenarios/mappers/priorityScenarioMapperDTO';
import { PriorityScenario } from '../../../priorityScenarios/models/priorityScenario';
import { ICreateProgramBookCommandProps } from '../../useCases/createProgramBook/createProgramBookCommand';
import { createProgramBookUseCase } from '../../useCases/createProgramBook/createProgramBookUseCase';
import { getPlainProgramBookProps, programbookRestrictionsTestData } from '../programBookTestHelper';

// tslint:disable:max-func-body-length
describe(`CreateProgramBookUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  describe(`Negative`, () => {
    [
      {
        description: 'missing name',
        requestError: {
          name: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'name',
            code: ErrorCodes.MissingValue,
            message: `name is null or undefined`
          }
        ]
      },
      {
        description: 'name is empty',
        requestError: {
          name: ''
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'name',
            code: ErrorCodes.InvalidInput,
            message: 'name is empty'
          },
          {
            succeeded: false,
            target: 'PlainProgramBook',
            code: 'openApiInputValidator',
            message: 'name is a required field'
          }
        ]
      },
      {
        description: 'missing projectTypes',
        requestError: {
          projectTypes: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectTypes',
            code: ErrorCodes.MissingValue,
            message: `projectTypes is null or undefined`
          }
        ]
      },
      {
        description: 'projectTypes is empty array',
        requestError: {
          projectTypes: []
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectTypes',
            code: ErrorCodes.InvalidInput,
            message: 'projectTypes is empty'
          }
        ]
      },
      {
        description: 'projectTypes invalid value',
        requestError: {
          projectTypes: [INVALID_TYPE]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectTypes',
            code: ErrorCodes.InvalidInput,
            message:
              'projectTypes isn\'t oneOf the correct values in ["integrated","integratedgp","nonIntegrated","other"]. Got "InvalidType".'
          },
          {
            succeeded: false,
            target: undefined,
            code: 'Taxonomy',
            message: "Taxonomy code: 'InvalidType' is invalid for taxonomy group: 'projectType'"
          }
        ]
      },
      {
        description: 'inCharge is empty',
        requestError: {
          inCharge: ''
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'inCharge',
            code: ErrorCodes.InvalidInput,
            message: 'inCharge is empty'
          }
        ]
      },
      {
        description: 'boroughIds is empty array',
        requestError: {
          boroughIds: []
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'boroughIds',
            code: ErrorCodes.InvalidInput,
            message: `boroughIds is empty`
          }
        ]
      },
      {
        description: 'status invalid value',
        requestError: {
          status: [INVALID_TYPE]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'status',
            code: ErrorCodes.InvalidInput,
            message:
              'status isn\'t oneOf the correct values in ["new","programming","submittedPreliminary","submittedFinal"]. Got "InvalidType".'
          },
          {
            succeeded: false,
            target: 'PlainProgramBook',
            code: 'openApiInputValidator',
            message: 'status (InvalidType) is not a type of string'
          }
        ]
      },
      {
        description: 'programTypes is not an array',
        requestError: {
          programTypes: 'not an array'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'programTypes',
            code: ErrorCodes.InvalidInput,
            message: 'programTypes must be an array'
          },
          {
            succeeded: false,
            target: 'projectTypes',
            code: ErrorCodes.InvalidInput,
            message: 'projectTypes isn\'t oneOf the correct values in ["nonIntegrated"]. Got "integrated,integratedgp".'
          },
          {
            succeeded: false,
            target: 'PlainProgramBook',
            code: 'openApiInputValidator',
            message: 'programTypes is not an array. An array is expected.'
          },
          {
            succeeded: false,
            target: undefined,
            code: 'Taxonomy',
            message: "Taxonomy code: 'not an array' is invalid for taxonomy group: 'programType'"
          }
        ]
      },
      {
        description: 'projectTypes must have a length of one when projectTypes is PNI',
        requestError: {
          projectTypes: [ProjectType.nonIntegrated, ProjectType.other]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectTypes',
            code: ErrorCodes.InvalidInput,
            message: 'projectTypes must have a maximum length of 1, now has a length of 2'
          }
        ]
      },
      {
        description: 'programTypes must have at least one when projectTypes is PNI',
        requestError: {
          projectTypes: [ProjectType.nonIntegrated],
          programTypes: []
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'programTypes',
            code: ErrorCodes.InvalidInput,
            message: `programTypes must have a minimum length of 1, now has a length of 0`
          }
        ]
      },
      {
        description: 'invalid shared roles',
        requestError: {
          sharedRoles: [INVALID_TYPE]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'sharedRoles',
            code: ErrorCodes.InvalidInput,
            message:
              'sharedRoles isn\'t oneOf the correct values in ["EXECUTOR","EXTERNAL-GUEST","INTERNAL-GUEST-RESTRICTED","INTERNAL-GUEST-STANDARD","PARTNER_PROJECT_CONSULTATION","PILOT","PLANIFICATION_ADMIN","PLANNER","PLANNER_SE","REQUESTOR","REQUESTOR_EXECUTOR"]. Got "InvalidType".'
          },
          {
            succeeded: false,
            target: undefined,
            code: 'Taxonomy',
            message: "Taxonomy code: 'InvalidType' is invalid for taxonomy group: 'role'"
          }
        ]
      },
      {
        description: 'projectTypes must be PNI when programTypes is given',
        requestError: {
          programTypes: [PROGRAM_TYPE_PCPR],
          projectTypes: [ProjectType.other]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectTypes',
            code: ErrorCodes.InvalidInput,
            message: 'projectTypes isn\'t oneOf the correct values in ["nonIntegrated"]. Got "other".'
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const createProgramBookCommand: ICreateProgramBookCommandProps = {
          ...getPlainProgramBookProps(),
          annualProgramId: NOT_FOUND_UUID
        };
        const result = await createProgramBookUseCase.execute(
          mergeProperties(createProgramBookCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  it(`should return notFoundError when linked annual program do not exists`, async () => {
    const createProgramBookCommand: ICreateProgramBookCommandProps = {
      ...getPlainProgramBookProps(),
      annualProgramId: NOT_FOUND_UUID
    };
    const result = await createProgramBookUseCase.execute(createProgramBookCommand);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
  });

  describe(`with a pre-populated database`, () => {
    let annualProgram: AnnualProgram;

    before(async () => {
      annualProgram = (
        await annualProgramRepository.save(getAnnualProgram({ status: AnnualProgramStatus.programming }))
      ).getValue();
    });

    describe(`create programBook`, () => {
      [
        {
          description: 'basic'
        }
      ].forEach(test => {
        it(`should create ${test.description} program book`, async () => {
          const createProgramBookCmd: ICreateProgramBookCommandProps = {
            ...getPlainProgramBookProps(),
            annualProgramId: annualProgram.id
          };

          const result = await createProgramBookUseCase.execute(createProgramBookCmd);
          assert.isTrue(result.isRight());
          const createdProgramBook: IEnrichedProgramBook = result.value.getValue() as IEnrichedProgramBook;
          assert.isDefined(createdProgramBook.id);
          assert.isDefined(createdProgramBook.audit);
          assert.strictEqual(createdProgramBook.annualProgramId, annualProgram.id);
          const expectedProgramBookProps = getPlainProgramBookProps();
          assert.strictEqual(createdProgramBook.name, expectedProgramBookProps.name);
          assert.isTrue(
            createdProgramBook.projectTypes.every(p => expectedProgramBookProps.projectTypes.includes(p as ProjectType))
          );
          assert.isTrue(createdProgramBook.boroughIds.every(p => expectedProgramBookProps.boroughIds.includes(p)));
          assert.strictEqual(createdProgramBook.inCharge, expectedProgramBookProps.inCharge);
          assert.strictEqual(createdProgramBook.status, expectedProgramBookProps.status);
          assert.strictEqual(createdProgramBook.description, expectedProgramBookProps.description);
          assert.strictEqual(
            createdProgramBook.priorityScenarios.length,
            1,
            `should have one default priority scenario`
          );
          const priorityScenario = createdProgramBook.priorityScenarios.find(p => p);
          const expectedDefaultPriorityScenario = await priorityScenarioMapperDTO.getFromModel(
            PriorityScenario.getDefault()
          );
          assert.strictEqual(priorityScenario.name, expectedDefaultPriorityScenario.name);
          assert.strictEqual(priorityScenario.status, expectedDefaultPriorityScenario.status);
          const priorityLevel = priorityScenario.priorityLevels.find(p => p);
          const expectedPriorityLevel = expectedDefaultPriorityScenario.priorityLevels.find(p => p);
          assert.strictEqual(priorityLevel.rank, expectedPriorityLevel.rank);
          assert.isTrue(
            priorityLevel.criteria.projectCategory.every(p =>
              expectedPriorityLevel.criteria.projectCategory.find(e => e.category === p.category)
            )
          );
          assert.strictEqual(priorityLevel.projectCount, expectedPriorityLevel.projectCount);
          assert.strictEqual(priorityLevel.isSystemDefined, expectedPriorityLevel.isSystemDefined);
        });
      });
    });
  });
  describe(`UserRestrictions`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const annualProgram = await createAndSaveAnnualProgram({ executorId: test.props.executorId });
        const props: ICreateProgramBookCommandProps = {
          ...getPlainProgramBookProps({ boroughIds: test.props.boroughIds }),
          annualProgramId: annualProgram.id
        };
        await assertUseCaseRestrictions<ICreateProgramBookCommandProps, IEnrichedProgramBook>(
          test,
          createProgramBookUseCase,
          props
        );
      });
    });
  });
});

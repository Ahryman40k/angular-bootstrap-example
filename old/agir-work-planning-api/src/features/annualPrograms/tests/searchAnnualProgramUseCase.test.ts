import {
  AnnualProgramExpand,
  AnnualProgramStatus,
  ErrorCodes,
  IEnrichedAnnualProgram,
  ProgramBookStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { assertFailures, destroyDBTests } from '../../../../tests/utils/testHelper';
import { IResultPaginated } from '../../../repositories/core/baseRepository';
import { InvalidParameterError } from '../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../shared/logic/guard';
import { EXECUTOR_DI } from '../../../shared/taxonomies/constants';
import { appUtils, IPaginatedResult } from '../../../utils/utils';
import { getOrderedProject } from '../../priorityScenarios/tests/orderedProjectTestHelper';
import { getPriorityScenario } from '../../priorityScenarios/tests/priorityScenarioTestHelper';
import { programBookRepository } from '../../programBooks/mongo/programBookRepository';
import { createAndSaveProgramBook } from '../../programBooks/tests/programBookTestHelper';
import { createAndSaveProject } from '../../projects/tests/projectTestHelper';
import { AnnualProgram } from '../models/annualProgram';
import { IAnnualProgramFindPaginatedOptionsProps } from '../models/annualProgramFindPaginatedOptions';
import { searchAnnualProgramUseCase } from '../useCases/searchAnnualProgram/searchAnnualProgramUseCase';
import { createAndSaveAnnualProgram, getAnnualProgram } from './annualProgramTestHelper';

// ==========================================
// Disabling some linting rules is OK in test files.
// tslint:disable:max-func-body-length
// tslint:disable:cyclomatic-complexity
// tslint:disable:no-string-literal
// ==========================================
// ts
describe(`searchAnnualProgramUseCase`, () => {
  let annualPrograms: AnnualProgram[];
  const nextYear = appUtils.getCurrentYear() + 1;

  beforeEach(async () => {
    annualPrograms = await Promise.all(
      [
        getAnnualProgram({ year: nextYear }),
        getAnnualProgram({ year: nextYear + 1 }),
        getAnnualProgram({ year: nextYear + 2 })
      ].map(ap => createAndSaveAnnualProgram(ap))
    );

    const programBooks = await Promise.all(
      annualPrograms.map(ap =>
        createAndSaveProgramBook({
          status: ProgramBookStatus.programming,
          annualProgram: ap
        })
      )
    );
    for (const pb of programBooks) {
      const project = await createAndSaveProject({}, pb.id);
      pb.addOrReplacePriorityScenario(
        getPriorityScenario({
          id: pb.priorityScenarios.find(s => s).id,
          orderedProjects: [
            getOrderedProject({
              projectId: project.id
            })
          ]
        })
      );
      await programBookRepository.save(pb);
    }
  });
  afterEach(async () => {
    await destroyDBTests();
  });

  [
    {
      description: 'year is not valid',
      requestError: {
        year: 190
      },
      expectedErrors: [
        {
          succeeded: false,
          target: 'year',
          code: ErrorCodes.InvalidInput,
          message: `year has a bad format`
        }
      ]
    },
    {
      description: 'executorId is not valid',
      requestError: {
        executorId: 'abc'
      },
      expectedErrors: [
        {
          succeeded: false,
          target: 'executorId',
          code: 'executor',
          message: `Taxonomy code: abc doesn't exist`
        }
      ]
    },
    {
      description: 'fromYear is not valid',
      requestError: {
        fromYear: 190
      },
      expectedErrors: [
        {
          succeeded: false,
          target: 'year',
          code: ErrorCodes.InvalidInput,
          message: `year has a bad format`
        }
      ]
    },
    {
      description: 'toYear is not valid',
      requestError: {
        toYear: 190
      },
      expectedErrors: [
        {
          succeeded: false,
          target: 'year',
          code: ErrorCodes.InvalidInput,
          message: `year has a bad format`
        }
      ]
    },
    {
      description: 'status is not valid',
      requestError: {
        status: ['abc' as AnnualProgramStatus]
      },
      expectedErrors: [
        {
          succeeded: false,
          target: 'status',
          code: ErrorCodes.InvalidInput,
          message: `status isn't oneOf the correct values in [\"new\",\"programming\",\"submittedFinal\"]. Got \"abc\".`
        },
        {
          succeeded: false,
          target: 'status',
          code: 'annualProgramStatus',
          message: "Taxonomy code: abc doesn't exist"
        }
      ]
    }
  ].forEach(test => {
    it(`should return errors when ${test.description} `, async () => {
      const searchAnnualProgramQuery: IAnnualProgramFindPaginatedOptionsProps = {
        criterias: { ...test.requestError },
        limit: 10,
        offset: 0
      };
      const result = await searchAnnualProgramUseCase.execute(searchAnnualProgramQuery);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
      const failures: IGuardResult[] = (result.value as any).error.error;
      assertFailures(failures, test.expectedErrors);
    });
  });

  [
    {
      description: 'for a year',
      year: nextYear,
      condition: (actualYear: number, expectedYear: number) => actualYear === expectedYear
    },
    {
      description: 'from year',
      year: nextYear,
      condition: (actualYear: number, expectedYear: number) => actualYear >= expectedYear
    },
    {
      description: 'to year',
      year: nextYear,
      condition: (actualYear: number, expectedYear: number) => actualYear <= expectedYear
    }
  ].forEach(test => {
    it(`should return annual programs ${test.description}`, async () => {
      const findOptions: IAnnualProgramFindPaginatedOptionsProps = {
        criterias: {
          year: test.year
        },
        limit: 100,
        offset: 0
      };
      const result = await searchAnnualProgramUseCase.execute(findOptions);
      assert.isTrue(result.isRight());
      const foundAnnualPrograms = (result.value.getValue() as IResultPaginated<IEnrichedAnnualProgram>).items;
      const years = foundAnnualPrograms.map(i => i.year);

      assert.strictEqual(
        years.every((y: number) => test.condition(y, nextYear)),
        true
      );
    });
  });

  [
    {
      description: 'for a executorId',
      criterias: {
        executorId: EXECUTOR_DI
      }
    },
    {
      description: 'for a status',
      criterias: {
        status: [AnnualProgramStatus.new]
      }
    }
  ].forEach(test => {
    it(`should return annual programs ${test.description}`, async () => {
      const findOptions: IAnnualProgramFindPaginatedOptionsProps = {
        criterias: test.criterias,
        limit: 100,
        offset: 0
      };
      const result = await searchAnnualProgramUseCase.execute(findOptions);
      assert.isTrue(result.isRight());
      const foundAnnualPrograms = (result.value.getValue() as IPaginatedResult<IEnrichedAnnualProgram>).items;
      for (const annualProgram of foundAnnualPrograms) {
        if (test.criterias.executorId) {
          assert.strictEqual(annualProgram.executorId, test.criterias.executorId);
        } else if (test.criterias.status) {
          assert.strictEqual(annualProgram.status.includes(test.criterias.status[0]), true);
        }
      }
    });
  });

  [
    {
      fields: ['status'],
      expectedNumberOfFields: 2
    },
    {
      fields: ['year'],
      expectedNumberOfFields: 2
    },
    {
      fields: ['executorId'],
      expectedNumberOfFields: 2
    },
    {
      fields: ['budgetCap'],
      expectedNumberOfFields: 2
    },
    {
      fields: ['description'],
      expectedNumberOfFields: 2
    },
    {
      fields: ['status', 'year', 'executorId', 'budgetCap', 'description'],
      expectedNumberOfFields: 6
    },
    {
      fields: ['programBooks.id', 'programBooks.name', 'programBooks.status'],
      expectedNumberOfFields: 5 // due to annualProgramId always returned in programBook
    },
    {
      fields: [
        'programBooks.id',
        'programBooks.name',
        'programBooks.status',
        'programBooks.priorityScenarios.orderedProjects.projectId'
      ],
      expectedNumberOfFields: 9 // due to annualProgramId always returned in programBook + pagination
    }
  ].forEach(test => {
    it(`should only return the id and these properties : [${test.fields.join(',')}]`, async () => {
      const searchAnnualProgramQuery: IAnnualProgramFindPaginatedOptionsProps = {
        criterias: {},
        limit: 100,
        offset: 0,
        fields: test.fields.join(','),
        expand: AnnualProgramExpand.programBooks
      };
      const result = await searchAnnualProgramUseCase.execute(searchAnnualProgramQuery);
      assert.isTrue(result.isRight());
      const annualProgramsResults = (result.value.getValue() as IPaginatedResult<IEnrichedAnnualProgram>).items;
      for (const annualProgram of annualProgramsResults) {
        assert.exists(annualProgram.id);
        test.fields.forEach(field => {
          if (field.includes('.')) {
            // split field to get nested property
            const subProperties = field.split('.');
            if (Array.isArray(annualProgram[subProperties[0]])) {
              annualProgram[subProperties[0]].forEach((element: any) => {
                assert.exists(element[subProperties[1]], `${field} not found`);
              });
            }
          } else {
            assert.exists(annualProgram[field], `${field} not found`);
          }
        });
        assert.lengthOf(Object.keys(appUtils.flattenObject(annualProgram)), test.expectedNumberOfFields);
      }
    });
  });

  [
    {
      description: 'every field when its empty',
      fields: [''],
      expectedFieldLength: 10
    },
    {
      description: 'no fields when its invalid',
      fields: ['abc'],
      expectedFieldLength: 1
    }
  ].forEach(test => {
    it(`should return ${test.description} `, async () => {
      const searchAnnualProgramQuery: IAnnualProgramFindPaginatedOptionsProps = {
        criterias: {},
        limit: 100,
        offset: 0,
        fields: test.fields.join(',')
      };
      const result = await searchAnnualProgramUseCase.execute(searchAnnualProgramQuery);
      assert.isTrue(result.isRight());
      const annualProgramsResults = (result.value.getValue() as IPaginatedResult<IEnrichedAnnualProgram>).items;
      for (const annualProgram of annualProgramsResults) {
        assert.exists(annualProgram.id);
        assert.lengthOf(Object.keys(annualProgram), test.expectedFieldLength);
      }
    });
  });
});

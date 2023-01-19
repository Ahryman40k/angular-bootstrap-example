import {
  AnnualProgramStatus,
  ErrorCodes,
  IEnrichedProject,
  ProgramBookStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { omit } from 'lodash';
import { createSandbox } from 'sinon';

import { getInitialProject } from '../../../../../../tests/data/projectData';
import { assertFailures, destroyDBTests, mergeProperties } from '../../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { assertUseCaseRestrictions } from '../../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { annualProgramRepository } from '../../../../annualPrograms/mongo/annualProgramRepository';
import { getAnnualProgram } from '../../../../annualPrograms/tests/annualProgramTestHelper';
import { ICounter } from '../../../../counters/models/counter';
import { counterRepository } from '../../../../counters/mongo/counterRepository';
import { programBookMapperDTO } from '../../../../programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../../programBooks/models/programBook';
import { programBookRepository } from '../../../../programBooks/mongo/programBookRepository';
import { getProgramBook } from '../../../../programBooks/tests/programBookTestHelper';
import { ProjectFindOptions } from '../../../models/projectFindOptions';
import { drmCounterRepository } from '../../../mongo/drmCounterRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { deleteDrmNumberUseCase } from '../../../useCases/drm/deleteDrmNumber/deleteDrmNumberUseCase';
import { createAndSaveProject, projectRestrictionsTestData } from '../../projectTestHelper';

// tslint:disable: max-func-body-length
describe(`DeleteDrmNumberUseCase`, () => {
  let mockDrmCounter: ICounter;
  let mockProjects: IEnrichedProject[];
  let mockProgramBook: ProgramBook;
  const sandbox = createSandbox();

  async function initializeData(): Promise<void> {
    const annualProgram = (
      await annualProgramRepository.save(getAnnualProgram({ status: AnnualProgramStatus.programming }))
    ).getValue();
    mockProgramBook = (
      await programBookRepository.save(getProgramBook({ annualProgram, status: ProgramBookStatus.programming }))
    ).getValue();

    mockDrmCounter = await counterRepository.findOne({ key: 'drm', prefix: undefined });
    let projectPromises = [getInitialProject(), getInitialProject()].map(initialProject => {
      mockDrmCounter.sequence++;
      initialProject.drmNumber = mockDrmCounter.sequence.toString();
      return projectRepository.save(initialProject);
    });
    mockProjects = (await Promise.all(projectPromises)).map(result => result.getValue());
    mockDrmCounter = await drmCounterRepository.save(mockDrmCounter);
    projectPromises = mockProjects.map(mp => {
      const annualPeriod = mp.annualDistribution.annualPeriods.find(ap => ap.year === annualProgram.year);
      annualPeriod.programBookId = mockProgramBook.id;
      return projectRepository.save(mp);
    });
    mockProjects = (await Promise.all(projectPromises)).map(result => result.getValue());
  }

  describe(`Negative`, () => {
    afterEach(async () => {
      sandbox.restore();
      await destroyDBTests();
    });
    [
      {
        description: 'missing project ids',
        requestError: {
          projectIds: undefined as any
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id[0]',
            code: ErrorCodes.MissingValue,
            message: `id[0] is null or undefined`
          }
        ]
      },
      {
        description: 'project ids has wrong type',
        requestError: {
          projectIds: [2] as any
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
        const result = await deleteDrmNumberUseCase.execute({
          id: test.requestError.projectIds
        });
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return a not found error when project is inexistant`, async () => {
      const result = await deleteDrmNumberUseCase.execute({
        id: 'P99999'
      });
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    function createStubFailed(requestError: {
      programBookPersistFailed: boolean;
      drmCounterPersistFailed: boolean;
    }): void {
      if (requestError.programBookPersistFailed) {
        sandbox.stub(programBookRepository, 'save').resolves(Result.fail('programBookRepository failed to save'));
      }
      if (requestError.drmCounterPersistFailed) {
        sandbox.stub(drmCounterRepository, 'save').resolves(null);
      }
    }

    [
      {
        description: 'rollback project when program book failed to persist',
        requestError: {
          programBookPersistFailed: true,
          drmCounterPersistFailed: false
        }
      },
      {
        description: 'rollback project and program book when drm counter failed to persist',
        requestError: {
          programBookPersistFailed: false,
          drmCounterPersistFailed: true
        }
      }
    ].forEach(test => {
      it(`should ${test.description}`, async () => {
        await initializeData();
        createStubFailed(test.requestError);
        const projectIds = mockProjects.map(p => p.id);
        const result = await deleteDrmNumberUseCase.execute({
          id: projectIds.join(',')
        });
        assert.isTrue(result.isLeft());

        const projects = await projectRepository.findAll(
          ProjectFindOptions.create({ criterias: { id: projectIds } }).getValue()
        );
        assert.isDefined(projects);
        projects.forEach(p => {
          const expectedProject = mockProjects.find(mp => mp.id === p.id);
          assert.deepEqual(omit(p, 'audit'), omit(expectedProject, 'audit'));
        });

        const programBook = await programBookRepository.findById(mockProgramBook.id);
        assert.isDefined(programBook);
        assert.deepEqual(
          omit(programBookMapperDTO.getFromModel(programBook), ['audit']),
          omit(programBookMapperDTO.getFromModel(mockProgramBook), ['audit'])
        );

        const drmNumberCounter = await drmCounterRepository.findOne({ key: 'drm', prefix: undefined });
        assert.isDefined(drmNumberCounter);
        assert.strictEqual(drmNumberCounter.sequence, mockDrmCounter.sequence);
        assert.deepEqual(drmNumberCounter.availableValues, mockDrmCounter.availableValues);
        const increment = test.requestError.drmCounterPersistFailed ? 0 : 1;
        assert.strictEqual(drmNumberCounter.__v, mockDrmCounter.__v + increment);
      });
    });
  });

  describe(`Positive`, () => {
    beforeEach(async () => {
      await initializeData();
    });
    afterEach(async () => {
      await destroyDBTests();
    });

    describe(`Delete drm numbers`, () => {
      [
        {
          description: 'delete drm number for a single project',
          data: {
            projectIdsLength: 1
          },
          expected: { availableValues: [5000] }
        },
        {
          description: 'delete drm numbers for multiples projects',
          data: {
            projectIdsLength: 2
          },
          expected: { availableValues: [5000, 5001] }
        }
      ].forEach(test => {
        it(`should ${test.description}`, async () => {
          const projectIds = mockProjects.map(p => p.id).slice(0, test.data.projectIdsLength);
          const result = await deleteDrmNumberUseCase.execute({
            id: projectIds.join(',')
          });
          assert.isTrue(result.isRight());

          const drmCounter = await counterRepository.findOne({ key: 'drm', prefix: undefined });
          assert.isDefined(drmCounter);
          const projects = await projectRepository.findAll(
            ProjectFindOptions.create({
              criterias: {
                id: projectIds
              }
            }).getValue()
          );
          assert.isNotEmpty(projects);

          assert.strictEqual(drmCounter.sequence, mockDrmCounter.sequence);
          assert.deepEqual(drmCounter.availableValues, test.expected.availableValues);
          assert.strictEqual(drmCounter.__v, mockDrmCounter.__v + 1);

          projects.forEach(p => {
            assert.strictEqual(p.drmNumber, null);
          });
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
            test.multipleProps.map(el => {
              mockDrmCounter.sequence++;
              return createAndSaveProject(
                mergeProperties({}, { ...el, drmNumber: mockDrmCounter.sequence.toString() })
              );
            })
          );
          const props: any = {
            id: createdProjects.map(el => el.id).join(',')
          };
          await assertUseCaseRestrictions<any, void>(test, deleteDrmNumberUseCase, props);
        });
      });
    });
  });
});

import { IEnrichedProject, IOrderedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as mongoose from 'mongoose';

import { priorityScenarioMapperDTO } from '../../src/features/priorityScenarios/mappers/priorityScenarioMapperDTO';
import { OrderedProject } from '../../src/features/priorityScenarios/models/orderedProject';
import { PriorityLevel } from '../../src/features/priorityScenarios/models/priorityLevel';
import { PriorityScenario } from '../../src/features/priorityScenarios/models/priorityScenario';
import { programBookPriorityScenarioService } from '../../src/features/priorityScenarios/priorityScenarioService';
import {
  getPriorityLevel,
  getPriorityScenario,
  getProjectCategoryCriteriaProps,
  orderByDefaultSortCriterias
} from '../../src/features/priorityScenarios/tests/priorityScenarioTestHelper';
import { ProgramBook } from '../../src/features/programBooks/models/programBook';
import { getProgramBook } from '../../src/features/programBooks/tests/programBookTestHelper';
import { projectDataGenerator } from '../data/dataGenerators/projectDataGenerator';

interface ITestData {
  programBook: ProgramBook;
  priorityScenario: PriorityScenario;
  projects: IEnrichedProject[];
}

async function createMockProjectsOnlyCoveredByDefaultCriteria(): Promise<ITestData> {
  return {
    programBook: getProgramBook(),
    priorityScenario: getPriorityScenario(),
    projects: [
      await projectDataGenerator.store({
        boroughId: 'C',
        projectName: 'p1'
      }),
      await projectDataGenerator.store({
        boroughId: 'B',
        projectName: 'p2'
      }),
      await projectDataGenerator.store({
        boroughId: 'A',
        projectName: 'p3'
      }),
      await projectDataGenerator.store({
        boroughId: 'Z',
        projectName: 'p4'
      }),
      await projectDataGenerator.store(
        projectDataGenerator.createEnriched({
          boroughId: 'Z',
          projectName: 'p5',
          id: mongoose.Types.ObjectId().toHexString(),
          submissionNumber: 'bidnum'
        })
      )
    ]
  };
}

async function createMockProjectsCoveredByAllAndMoreThanOneCriteria(): Promise<ITestData> {
  const mock: ITestData = await createMockProjectsOnlyCoveredByDefaultCriteria();
  const systemPriorityLevel: PriorityLevel = mock.priorityScenario.priorityLevels[0];
  const userPriorityLevel: PriorityLevel = getPriorityLevel({
    isSystemDefined: false,
    rank: 2,
    criteria: { projectCategory: [getProjectCategoryCriteriaProps()] }
  });
  mock.priorityScenario = getPriorityScenario({
    priorityLevels: [systemPriorityLevel, userPriorityLevel]
  });
  mock.projects[3].annualDistribution.annualPeriods[0].categoryId = 'new';
  mock.projects[4].annualDistribution.annualPeriods[0].categoryId = 'new';
  mock.projects[3].annualDistribution.annualPeriods = [mock.projects[3].annualDistribution.annualPeriods[0]];
  mock.projects[4].annualDistribution.annualPeriods = [mock.projects[4].annualDistribution.annualPeriods[0]];
  return mock;
}

async function createMockProjectsNotCoveredByAnyCriteria(): Promise<ITestData> {
  const mock: ITestData = await createMockProjectsOnlyCoveredByDefaultCriteria();
  mock.projects.forEach(project => {
    project.annualDistribution.annualPeriods.forEach(period => {
      period.categoryId = 'nothing';
    });
  });
  return mock;
}

async function createMockProjectsCoveredAndNotCoveredByDefaultAndOtherCriteria(): Promise<ITestData> {
  const mock: ITestData = await createMockProjectsCoveredByAllAndMoreThanOneCriteria();
  const remainingProjects = [
    projectDataGenerator.createEnriched({
      boroughId: 'Z',
      projectName: 'p6'
    }),
    projectDataGenerator.createEnriched({
      boroughId: 'Z',
      projectName: 'p7',
      id: mongoose.Types.ObjectId().toHexString(),
      submissionNumber: 'bidnum'
    })
  ];
  remainingProjects[0].annualDistribution.annualPeriods[0].categoryId = 'nothing';
  remainingProjects[1].annualDistribution.annualPeriods[0].categoryId = 'nothing';
  remainingProjects[0].annualDistribution.annualPeriods = [remainingProjects[0].annualDistribution.annualPeriods[0]];
  remainingProjects[1].annualDistribution.annualPeriods = [remainingProjects[1].annualDistribution.annualPeriods[0]];
  for (const project of remainingProjects) {
    mock.projects.push(await projectDataGenerator.store(project));
  }
  return mock;
}

function assertOrderedProjects(orderedProjects: IOrderedProject[]) {
  assert.isNotEmpty(orderedProjects);
  assert.strictEqual(orderedProjects[0].levelRank, 1);
  orderedProjects.forEach(orderedProject => assert.isNumber(orderedProject.initialRank));
  orderedProjects.forEach(orderedProject => assert.isNumber(orderedProject.rank));
}

describe('programBookPriorityScnerarioService > updatePriorityScenarioOrderedProjectsWithProjects', () => {
  let mock: ITestData;

  async function calculateUnderTest(
    priorityScenario: PriorityScenario,
    projects: IEnrichedProject[],
    programBook?: ProgramBook
  ): Promise<OrderedProject[]> {
    const annualProgramYear = mock.projects[0].annualDistribution.annualPeriods[0].year + 1;
    const orderedProjectsWithObjectives = (await priorityScenarioMapperDTO.getFromModel(priorityScenario))
      .orderedProjects.items;
    const orderedProjects = await programBookPriorityScenarioService.getPriorityScenarioOrderedProjects(
      priorityScenario,
      projects,
      annualProgramYear,
      orderedProjectsWithObjectives,
      programBook?.objectives || []
    );
    priorityScenario.setOrderedProjects(orderedProjects);
    return priorityScenario.orderedProjects;
  }

  it('C66828 - Positive - Should assign level rank to 1 when all ordered projects are covered by the default criteria', async () => {
    mock = await createMockProjectsOnlyCoveredByDefaultCriteria();
    const myOrderedProjects = await calculateUnderTest(mock.priorityScenario, mock.projects);
    assertOrderedProjects(myOrderedProjects);
    myOrderedProjects.forEach(orderedProject => assert.strictEqual(orderedProject.levelRank, 1));
  });

  it('C66829 - Positive - Should assign level rank to a number when ordered projects are covered by all criteria', async () => {
    mock = await createMockProjectsCoveredByAllAndMoreThanOneCriteria();
    const myOrderedProjects = await calculateUnderTest(mock.priorityScenario, mock.projects);
    assertOrderedProjects(myOrderedProjects);
    myOrderedProjects.forEach(orderedProject => assert.isNumber(orderedProject.levelRank));
  });

  it('C66830 - Positive - Should assign level rank to 0 when ordered projects are not covered by any criteria', async () => {
    mock = await createMockProjectsNotCoveredByAnyCriteria();
    const myOrderedProjects = await calculateUnderTest(mock.priorityScenario, mock.projects);
    assert.isNotEmpty(myOrderedProjects);
    myOrderedProjects.forEach(orderedProject => assert.isNumber(orderedProject.initialRank));
    myOrderedProjects.forEach(orderedProject => assert.isNumber(orderedProject.rank));
    myOrderedProjects.forEach(orderedProject => assert.strictEqual(orderedProject.levelRank, 0));
  });

  it('C66831 - Positive - Should sort all ordered projects on each level by default sort criterias', async () => {
    mock = await createMockProjectsCoveredAndNotCoveredByDefaultAndOtherCriteria();
    const myOrderedProjects = await calculateUnderTest(mock.priorityScenario, mock.projects, mock.programBook);
    assertOrderedProjects(myOrderedProjects);
    assert.deepStrictEqual(
      (await orderByDefaultSortCriterias(mock.projects)).map(project => project.id),
      myOrderedProjects.map(project => project.projectId)
    );
  });
});

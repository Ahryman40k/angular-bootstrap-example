import {
  AnnualProgramStatus,
  AssetType,
  IEnrichedIntervention,
  IEnrichedProject,
  IUuid,
  ProgramBookObjectiveTargetType,
  ProgramBookStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { cloneDeep } from 'lodash';
import * as sinon from 'sinon';

import { AnnualProgram } from '../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { interventionRepository } from '../../src/features/interventions/mongo/interventionRepository';
import { createAndSaveIntervention } from '../../src/features/interventions/tests/interventionTestHelper';
import { Objective } from '../../src/features/programBooks/models/objective';
import { ProgramBook } from '../../src/features/programBooks/models/programBook';
import { programBookRepository } from '../../src/features/programBooks/mongo/programBookRepository';
import { getObjective, getObjectiveValues } from '../../src/features/programBooks/tests/objectiveTestHelper';
import { createAndSaveProgramBook } from '../../src/features/programBooks/tests/programBookTestHelper';
import { projectRepository } from '../../src/features/projects/mongo/projectRepository';
import { createAndSaveProject } from '../../src/features/projects/tests/projectTestHelper';
import { userService } from '../../src/services/userService';
import { REQUESTOR_BOROUGH, WORK_TYPE_RECONSTRUCTION } from '../../src/shared/taxonomies/constants';
import { appUtils } from '../../src/utils/utils';
import { integrationAfter } from '../integration/_init.test';
import { destroyDBTests } from '../utils/testHelper';
import { userMocker } from '../utils/userUtils';

const INTERVENTION_ANNUAL_ALLOWANCE = 150;
const INTERVENTION_ANNUAL_LENGTH = 0.5;
const ANNUAL_PERIODS = 2;

async function setupProgramBookObjectives(programBook: ProgramBook): Promise<void> {
  await Promise.all(
    [ProgramBookObjectiveTargetType.length, ProgramBookObjectiveTargetType.budget].map(targetType => {
      const objective = getObjective({
        targetType,
        values: getObjectiveValues({ calculated: INTERVENTION_ANNUAL_LENGTH * ANNUAL_PERIODS, reference: 0 }),
        assetTypeIds: [AssetType.fireHydrant],
        requestorId: REQUESTOR_BOROUGH,
        workTypeIds: [WORK_TYPE_RECONSTRUCTION]
      });
      return programBook.addOrReplaceObjective(objective);
    })
  );
  await programBookRepository.save(programBook);
}

interface ITestData {
  annualProgramId: IUuid;
  programBook: ProgramBook;
  annualProgram: AnnualProgram;
  interventions: IEnrichedIntervention[];
  project: IEnrichedProject;
  objectiveBid: Objective;
  objectiveLength: Objective;
  objectiveBudget: Objective;
}

async function initTestData(): Promise<ITestData> {
  const testData: ITestData = {} as ITestData;
  testData.annualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.new });
  testData.programBook = await createAndSaveProgramBook({
    annualProgram: testData.annualProgram,
    status: ProgramBookStatus.programming
  });
  testData.project = await createAndSaveProject(undefined, testData.programBook.id);
  testData.interventions = await Promise.all(
    ['intervention1', 'intervention2'].map(interventionName => {
      return createAndSaveIntervention({
        requestorId: REQUESTOR_BOROUGH,
        annualDistribution: {
          distributionSummary: null,
          annualPeriods: [
            {
              annualAllowance: INTERVENTION_ANNUAL_ALLOWANCE,
              annualLength: INTERVENTION_ANNUAL_LENGTH,
              year: appUtils.getCurrentYear()
            }
          ]
        }
      });
    })
  );
  testData.project.interventionIds = testData.interventions.map(i => i.id);
  testData.project = (await projectRepository.save(testData.project)).getValue();

  await setupProgramBookObjectives(testData.programBook);
  testData.objectiveLength = testData.programBook.objectives.find(
    objective => objective.targetType === ProgramBookObjectiveTargetType.length
  );
  testData.objectiveBudget = testData.programBook.objectives.find(
    objective => objective.targetType === ProgramBookObjectiveTargetType.budget
  );
  return testData;
}

describe('ProgramBookObjectives > computeObjectives', () => {
  let programBook: ProgramBook;
  let interventions: IEnrichedIntervention[];
  let objectives: Objective[];
  let cloneObjectives: Objective[];

  async function reCalculateObjectives(pb: ProgramBook): Promise<void> {
    // tslint:disable:no-parameter-reassignment
    pb = await programBookRepository.findById(pb.id);
    await pb.computeObjectives();
    pb = (await programBookRepository.save(pb)).getValue();
  }

  before(() => {
    sinon.stub(userService, 'currentUser').get(() => userMocker.currentMock);
  });

  after(async () => {
    await integrationAfter();
    sinon.restore();
  });

  beforeEach(async () => {
    const testData = await initTestData();
    programBook = testData.programBook;
    interventions = testData.interventions;
    objectives = [testData.objectiveBid, testData.objectiveLength, testData.objectiveBudget];
    cloneObjectives = cloneDeep(objectives);
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  [
    {
      description: `change intervention length`,
      testValues: {
        targetType: ProgramBookObjectiveTargetType.length,
        property: 'annualLength',
        value: 60.60609
      }
    },
    {
      description: `change intervention allowance`,
      testValues: {
        targetType: ProgramBookObjectiveTargetType.budget,
        property: 'annualAllowance',
        value: 7000.99
      }
    }
  ].forEach(test => {
    it(`Positive - Should update the calculated value when ${test.description}`, async () => {
      interventions[1].annualDistribution.annualPeriods[0][test.testValues.property] += test.testValues.value;
      await interventionRepository.save(interventions[1]);
      await reCalculateObjectives(programBook);
      const updatedProgramBook = await programBookRepository.findById(programBook.id);
      const updatedObjective = updatedProgramBook.objectives.find(
        objective => objective.targetType === test.testValues.targetType
      );
      const expectedObjectiveCalculatedValue =
        cloneObjectives.find(objective => objective?.targetType === test.testValues.targetType).values.calculated +
        test.testValues.value;
      assert.strictEqual(updatedObjective.values.calculated, expectedObjectiveCalculatedValue);
    });
  });
});

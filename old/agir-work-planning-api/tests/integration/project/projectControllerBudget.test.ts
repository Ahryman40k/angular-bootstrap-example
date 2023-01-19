import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualDistribution,
  InterventionDecisionType,
  InterventionStatus,
  IPlainProject,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';
import sinon = require('sinon');
import { InterventionFindOptions } from '../../../src/features/interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { enumValues } from '../../../src/utils/enumUtils';
import { appUtils } from '../../../src/utils/utils';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { interventionTestClient } from '../../utils/testClients/interventionTestClient';
import { projectTestClient } from '../../utils/testClients/projectTestClient';
import { destroyDBTests, getFutureYear } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable-next-line:max-func-body-length
describe('Project controller (Budget)', () => {
  function setupStubs() {
    spatialAnalysisServiceStub.init(sandbox);
  }
  before(() => {
    setupStubs();
  });

  after(async () => {
    sandbox.restore();
    await integrationAfter();
  });

  function assertTotalBudget(
    annualDistribution: IEnrichedProjectAnnualDistribution,
    interventions: IEnrichedIntervention[]
  ) {
    let interventionsSum = 0;
    for (const intervention of interventions) {
      interventionsSum = interventionsSum + _.sumBy(intervention.annualDistribution.annualPeriods, 'annualAllowance');
    }
    assert.strictEqual(annualDistribution.distributionSummary.totalInterventionBudgets, interventionsSum);
    assert.strictEqual(
      annualDistribution.distributionSummary.totalBudget,
      interventionsSum + annualDistribution.distributionSummary.totalAdditionalCosts
    );
  }

  function findValidIntervention(interventionIds: string[]) {
    return interventionRepository.findAll(
      InterventionFindOptions.create({
        criterias: {
          id: interventionIds,
          status: enumValues<string>(InterventionStatus).filter(s => s !== InterventionStatus.canceled)
        }
      }).getValue()
    );
  }

  // tslint:disable-next-line: max-func-body-length
  describe('/projects > POST', () => {
    let interventions: IEnrichedIntervention[] = [];
    let intervention1: IEnrichedIntervention;
    let intervention2: IEnrichedIntervention;
    let intervention3: IEnrichedIntervention;
    let interventionIds: string[];
    let plainProject: IPlainProject;
    let partialProjectInterventionIds: Partial<IEnrichedProject>;
    let mockProject: IEnrichedProject;
    let mockAnnualProject: IEnrichedProject;
    let annualPlainProject: IPlainProject;

    function setInterventionsVariable() {
      interventions.push(intervention1, intervention2);
      interventionIds = [intervention1.id, intervention2.id];
      partialProjectInterventionIds = { interventionIds };
    }

    async function createMocks(isForCreation?: boolean) {
      mockProject = await projectDataGenerator.store({
        status: ProjectStatus.planned,
        startYear: appUtils.getCurrentYear(),
        endYear: getFutureYear()
      });

      mockAnnualProject = await projectDataGenerator.store({
        status: ProjectStatus.planned,
        startYear: appUtils.getCurrentYear(),
        endYear: appUtils.getCurrentYear()
      });

      intervention1 = await interventionDataGenerator.store({}, isForCreation ? null : mockProject);
      intervention2 = await interventionDataGenerator.store({}, isForCreation ? null : mockProject);
      intervention3 = await interventionDataGenerator.store({}, isForCreation ? null : mockAnnualProject);
    }

    async function setData(): Promise<void> {
      await createMocks();
      intervention1.annualDistribution.annualPeriods = intervention1.annualDistribution.annualPeriods.map(
        annualPeriod => {
          annualPeriod.annualAllowance = 10;
          return annualPeriod;
        }
      );
      intervention1.estimate = {
        ...intervention1.estimate,
        allowance: _.sumBy(intervention1.annualDistribution.annualPeriods, 'annualAllowance')
      };
      intervention1 = await interventionDataGenerator.update(intervention1);
      intervention2.annualDistribution.annualPeriods = intervention2.annualDistribution.annualPeriods.map(
        annualPeriod => {
          annualPeriod.annualAllowance = 20;
          return annualPeriod;
        }
      );

      intervention2.estimate = {
        ...intervention2.estimate,
        allowance: _.sumBy(intervention2.annualDistribution.annualPeriods, 'annualAllowance')
      };
      intervention2 = await interventionDataGenerator.update(intervention2);

      setInterventionsVariable();
      plainProject = projectDataGenerator.createPlain({
        ...partialProjectInterventionIds,
        startYear: appUtils.getCurrentYear(),
        endYear: getFutureYear()
      });

      annualPlainProject = projectDataGenerator.createPlain({
        ...{ interventionIds: [intervention3.id] },
        startYear: appUtils.getCurrentYear(),
        endYear: appUtils.getCurrentYear()
      });

      mockProject = await projectDataGenerator.update(mockProject, partialProjectInterventionIds);
      mockAnnualProject = await projectDataGenerator.update(mockAnnualProject, { interventionIds: [intervention3.id] });
    }

    async function setDataForCreation(): Promise<void> {
      await createMocks(true);
      setInterventionsVariable();
      plainProject = projectDataGenerator.createPlain(partialProjectInterventionIds);
      annualPlainProject = projectDataGenerator.createPlain({
        interventionIds: [intervention3.id],
        startYear: appUtils.getCurrentYear(),
        endYear: appUtils.getCurrentYear()
      });
      mockProject = await projectDataGenerator.update(mockProject, partialProjectInterventionIds);
      mockAnnualProject = await projectDataGenerator.update(mockProject, { interventionIds: [intervention3.id] });
    }

    beforeEach(async () => {
      await setData();
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    it(`C64313 - Positive - Should set intervention budget equal to estimation when creating an annual project when intervention estimation exists`, async () => {
      await setDataForCreation();
      const response = await projectTestClient.create(annualPlainProject);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const project = response.body;

      const projectIntervention = await interventionRepository.findById(intervention3.id);
      assert.strictEqual(projectIntervention.annualDistribution.annualPeriods.length, 1);
      assert.strictEqual(
        projectIntervention.annualDistribution.annualPeriods[0].annualAllowance,
        projectIntervention.estimate.allowance
      );

      assert.strictEqual(
        projectIntervention.annualDistribution.distributionSummary.totalAllowance,
        projectIntervention.estimate.allowance
      );

      assertTotalBudget(project.annualDistribution, [projectIntervention]);
    });

    it(`C64314 - Positive - Should set intervention budget equal to estimation adding an intervention to an annual project when intervention estimation exists`, async () => {
      const interventionToAdd = await interventionDataGenerator.store({});
      annualPlainProject.interventionIds.push(interventionToAdd.id);

      const response = await projectTestClient.update(mockAnnualProject.id, annualPlainProject);
      assert.strictEqual(response.status, HttpStatusCodes.OK);

      const project = response.body;

      const addedIntervention = await interventionRepository.findById(interventionToAdd.id);
      assert.strictEqual(addedIntervention.annualDistribution.annualPeriods.length, 1);
      assert.strictEqual(
        addedIntervention.annualDistribution.annualPeriods[0].annualAllowance,
        addedIntervention.estimate.allowance
      );
      assert.strictEqual(
        addedIntervention.annualDistribution.distributionSummary.totalAllowance,
        addedIntervention.estimate.allowance
      );

      assertTotalBudget(project.annualDistribution, [intervention3, addedIntervention]);
    });

    it(`C64315 - Positive - Should set intervention budget equal to 0 when adding an intervention to an annual project when intervention estimation does not exists`, async () => {
      await setDataForCreation();
      intervention3.estimate = { allowance: 0, burnedDown: 0, balance: 0 };
      await interventionDataGenerator.update(intervention3);

      const response = await projectTestClient.create(annualPlainProject);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);

      const project = response.body;

      const projectIntervention = await interventionRepository.findById(intervention3.id);
      assert.strictEqual(projectIntervention.annualDistribution.annualPeriods.length, 1);
      assert.strictEqual(projectIntervention.annualDistribution.annualPeriods[0].annualAllowance, 0);
      assert.strictEqual(projectIntervention.annualDistribution.distributionSummary.totalAllowance, 0);

      assertTotalBudget(project.annualDistribution, [projectIntervention]);
    });

    it(`C64308 - Positive - Should calculate project annual budget and interventions total budget when creating a projet with interventions`, async () => {
      await setDataForCreation();
      const response = await projectTestClient.create(plainProject);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);

      const project = response.body;
      interventions = await findValidIntervention(interventionIds);
      const annualDistribution = project.annualDistribution;
      assertTotalBudget(annualDistribution, interventions);
    });

    it(`C64309 - Positive - Should update project annual budget and interventions total budget when adding an intervention`, async () => {
      const interventionToAdd = await interventionDataGenerator.store();
      plainProject.interventionIds.push(interventionToAdd.id);

      const response = await projectTestClient.update(mockProject.id, plainProject);
      assert.strictEqual(response.status, HttpStatusCodes.OK);

      const project = response.body;
      const annualDistribution = project.annualDistribution;
      assertTotalBudget(annualDistribution, interventions);
    });

    it(`C64310 - Positive - Should update project annual budget and interventions total budget when removing an intervention`, async () => {
      plainProject.interventionIds.pop();
      const response = await projectTestClient.update(mockProject.id, plainProject);
      assert.strictEqual(response.status, HttpStatusCodes.OK);

      const project = response.body;
      const annualDistribution = project.annualDistribution;
      assertTotalBudget(annualDistribution, [intervention1]);
    });

    it(`C64311 - Positive - Should update project annual budget and interventions total budget when canceling an intervention`, async () => {
      const removeDecision = {
        typeId: InterventionDecisionType.canceled,
        text: 'Because'
      };
      const response = await interventionTestClient.createDecision(intervention1.id, removeDecision);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const persistedProject = await projectTestClient.findById(mockProject.id);

      const intervention = response.body;
      assert.strictEqual(intervention.status, InterventionStatus.canceled);
      const annualDistribution = persistedProject.annualDistribution;
      interventions = await findValidIntervention(interventionIds);
      assertTotalBudget(annualDistribution, interventions);
    });

    it(`C64312 - Positive - Should set intervention annual period budgets to 0 when adding an intervention`, async () => {
      const interventionToAdd = await interventionDataGenerator.store();
      plainProject.interventionIds.push(interventionToAdd.id);
      const updateResponse = await projectTestClient.update(mockProject.id, plainProject);
      assert.strictEqual(updateResponse.status, HttpStatusCodes.OK);

      const addedIntervention = (await interventionTestClient.get(interventionToAdd.id)).body;
      addedIntervention.annualDistribution.annualPeriods.forEach(ap => assert.strictEqual(ap.annualAllowance, 0));
    });
  });
});

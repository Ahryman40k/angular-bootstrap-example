import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IInterventionDecision,
  InterventionDecisionType,
  IPlainProject,
  ProjectCategory,
  ProjectDecisionType,
  ProjectExpand,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';
import sinon = require('sinon');

import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { geolocatedAnnualDistributionService } from '../../../src/services/annualDistribution/geolocatedAnnualDistributionService';
import { interventionAnnualDistributionService } from '../../../src/services/annualDistribution/interventionAnnualDistributionService';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { appUtils } from '../../../src/utils/utils';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { createMockIntervention } from '../../data/interventionData';
import { getPlainProject } from '../../data/projectData';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { interventionTestClient } from '../../utils/testClients/interventionTestClient';
import { projectDecisionTestClient } from '../../utils/testClients/projectDecisionTestClient';
import { projectTestClient } from '../../utils/testClients/projectTestClient';
import { destroyDBTests, getFutureYear, getPastYear } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable: max-func-body-length
describe('Project Controller - Annual periods', () => {
  function setupStubs() {
    spatialAnalysisServiceStub.init(sandbox);
  }
  after(async () => {
    await integrationAfter();
  });

  const interventions: { [year: number]: IEnrichedIntervention } = {};

  beforeEach(async () => {
    setupStubs();
    const yearRange = _.range(getPastYear(), getFutureYear(6));
    for (const year of yearRange) {
      const intervention = await createMockIntervention({ interventionYear: year, planificationYear: year });
      interventions[year] = intervention;
    }
  });

  afterEach(async () => {
    await destroyDBTests();
    sandbox.restore();
  });

  function addInterventionIdsToProject(plainProject: IPlainProject | IEnrichedProject): void {
    const yearRange = _.range(plainProject.startYear, plainProject.endYear + 1);
    plainProject.interventionIds = yearRange.map(y => interventions[y]?.id).filter(id => id);
  }

  async function createExistingProject(partial?: Partial<IPlainProject>): Promise<IEnrichedProject> {
    const plainProject = getPlainProject(partial);
    addInterventionIdsToProject(plainProject);
    const response = await projectTestClient.create(plainProject);
    assert.strictEqual(response.status, HttpStatusCodes.CREATED);
    return response.body;
  }

  function assertGeoAnnualPeriods(annualPeriod: IEnrichedProjectAnnualPeriod, project: IEnrichedProject, year: number) {
    const rank = year - project.startYear;
    assert.strictEqual(annualPeriod.year, year);
    assert.strictEqual(annualPeriod.rank, rank);
    assert.strictEqual(annualPeriod.status, project.status);
    assert.isNumber(annualPeriod.annualBudget);
    assert.isNotOk(annualPeriod.programBookId);
  }

  describe('Create', () => {
    it('C61067 - Positive - Should create an annualPeriod when the project spans on a single year', async () => {
      const plainProject = getPlainProject({ startYear: getPastYear(), endYear: getPastYear() });
      addInterventionIdsToProject(plainProject);

      const response = await projectTestClient.create(plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const project: IEnrichedProject = response.body;
      assert.isOk(project);
      const annualPeriods: IEnrichedProjectAnnualPeriod[] = project.annualDistribution.annualPeriods;
      assert.isOk(annualPeriods);
      assert.strictEqual(annualPeriods.length, 1);
      assertGeoAnnualPeriods(annualPeriods[0], project, getPastYear());
    });

    it('C61069 - Positive - Should create multiple annualPeriods when the project spans on multiple years', async () => {
      const plainProject = getPlainProject({ startYear: getFutureYear(), endYear: getFutureYear(5) });
      addInterventionIdsToProject(plainProject);

      const response = await projectTestClient.create(plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const project: IEnrichedProject = response.body;
      assert.isOk(project);
      const annualPeriods = project.annualDistribution.annualPeriods as IEnrichedProjectAnnualPeriod[];
      assert.isOk(annualPeriods);
      assert.strictEqual(annualPeriods.length, 5);
      assertGeoAnnualPeriods(annualPeriods[0], project, getFutureYear());
      assertGeoAnnualPeriods(annualPeriods[1], project, getFutureYear(2));
      assertGeoAnnualPeriods(annualPeriods[2], project, getFutureYear(3));
      assertGeoAnnualPeriods(annualPeriods[3], project, getFutureYear(4));
      assertGeoAnnualPeriods(annualPeriods[4], project, getFutureYear(5));
    });
  });

  describe('Updating project', () => {
    let storedInterventions: IEnrichedIntervention[];
    let storedProject: IEnrichedProject;

    beforeEach(async () => {
      storedInterventions = [];
      storedInterventions.push(await interventionDataGenerator.store({ planificationYear: appUtils.getCurrentYear() }));
      storedProject = await projectDataGenerator.store(
        {
          status: ProjectStatus.planned,
          startYear: appUtils.getCurrentYear(),
          endYear: appUtils.getCurrentYear(),
          interventionIds: [storedInterventions[0].id]
        },
        p => {
          p.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(p);
          interventionAnnualDistributionService.create(storedInterventions, p.annualDistribution.annualPeriods);
          geolocatedAnnualDistributionService.distributeInterventions(p, storedInterventions);
        }
      );
      storedInterventions.forEach(i => (i.project = { id: storedProject.id }));
      for (const storedIntervention of storedInterventions) {
        const interventionSaveResult = await interventionRepository.save(storedIntervention);
        if (interventionSaveResult.isFailure) {
          throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult)));
        }
      }
    });

    it('C64778  Positive - Should generate additional annual periods when an intervention is added to the project', async () => {
      const interventionToAdd = await interventionDataGenerator.store({ planificationYear: getFutureYear() });
      const plainProject = projectDataGenerator.createPlainFromEnriched(storedProject);
      plainProject.interventionIds.push(interventionToAdd.id);

      const decisionResponse = await projectDecisionTestClient.create(storedProject.id, {
        text: `Replanification ${appUtils.getCurrentYear()}-${getFutureYear()}`,
        typeId: ProjectDecisionType.replanned,
        startYear: appUtils.getCurrentYear(),
        endYear: getFutureYear()
      });
      assert.strictEqual(decisionResponse.status, HttpStatusCodes.CREATED);

      plainProject.endYear = getFutureYear();
      const response = await projectTestClient.update(storedProject.id, plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.annualDistribution.annualPeriods.length, 2);
      assert.strictEqual(response.body.annualDistribution.annualPeriods[0].year, appUtils.getCurrentYear());
      assert.strictEqual(response.body.annualDistribution.annualPeriods[0].categoryId, ProjectCategory.new);
      assert.strictEqual(response.body.annualDistribution.annualPeriods[1].year, getFutureYear());
      assert.strictEqual(response.body.annualDistribution.annualPeriods[1].categoryId, ProjectCategory.completing);
    });
  });

  // TODO:Uncomment when we will do the decision
  // describe('Update', () => {
  //   function createReplannedDecision(partial?: Partial<IProjectDecision>): IProjectDecision {
  //     const decision: IProjectDecision = {
  //       text: 'test',
  //       typeId: ProjectDecisionType.replanned,
  //       startYear: 2020,
  //       endYear: 2021
  //     };
  //     Object.assign(decision, partial);
  //     return decision;
  //   }

  //   it("XXXX  Positive - Should update the project's phases when re-planning the project for more years", async () => {
  //     const existingProject = await createExistingProject({ startYear: 2020, endYear: 2020 });
  //     const decision = createReplannedDecision({ startYear: 2020, endYear: 2021 });

  //     const response = await projectDecisionTestClient.create(existingProject.id, decision);

  //     assert.strictEqual(response.status, HttpStatusCodes.CREATED);
  //     const updatedProject = await projectRepository.findById(existingProject.id);
  //     assert.isOk(updatedProject.phases);
  //     assert.strictEqual(updatedProject.phases.length, 2);
  //     assert.deepEqual(_.omit(updatedProject.phases[0], 'status'), _.omit(existingProject.phases[0], 'status'));
  //     assertPhase(updatedProject.phases[1], updatedProject, 2021);
  //   });

  //   it("XXXX  Positive - Should update the project's phases when re-planning the project for less years", async () => {
  //     const existingProject = await createExistingProject({ startYear: 2025, endYear: 2028 });
  //     const decision = createReplannedDecision({ startYear: 2025, endYear: 2027 });

  //     const response = await projectDecisionTestClient.create(existingProject.id, decision);

  //     assert.strictEqual(response.status, HttpStatusCodes.CREATED);
  //     const updatedProject = await projectRepository.findById(existingProject.id);
  //     assert.isOk(updatedProject.phases);
  //     assert.strictEqual(updatedProject.phases.length, 3);
  //     assert.deepEqual(_.omit(updatedProject.phases[0], 'status'), _.omit(existingProject.phases[0], 'status'));
  //     assert.deepEqual(_.omit(updatedProject.phases[1], 'status'), _.omit(existingProject.phases[1], 'status'));
  //     assert.deepEqual(_.omit(updatedProject.phases[2], 'status'), _.omit(existingProject.phases[2], 'status'));
  //   });
  // });

  describe('Read', () => {
    let existingProjects: IEnrichedProject[];
    beforeEach(async () => {
      existingProjects = [
        await createExistingProject({ startYear: getFutureYear(), endYear: getFutureYear() }),
        await createExistingProject({ startYear: getFutureYear(2), endYear: getFutureYear(3) }),
        await createExistingProject({ startYear: getFutureYear(4), endYear: getFutureYear(5) })
      ];
    });

    it("C61107 - Positive - Should retrieve the project's phases when searching projects", async () => {
      const response = await projectTestClient.searchPost();

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isOk(projects);
      assert.strictEqual(projects.length, 3);
      assert.isTrue(projects.every(p => p.annualDistribution.annualPeriods.length > 0));
    });

    it("C61108 - Positive - Should retrieve the project's phases when retrieving a single project", async () => {
      const existingProject = existingProjects[0];
      const response = await projectTestClient.get(existingProject.id);

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const project: IEnrichedProject = response.body;
      assert.isOk(project);
      assert.deepEqual(project.annualDistribution.annualPeriods, existingProject.annualDistribution.annualPeriods);
    });
  });

  // describe('Programming', () => {
  //   it('XXXX  Positive - Should add the program book to the phase when programmed', async () => {});

  //   it('XXXX  Positive - Should remove the program book from the phase when unprogrammed', async () => {});
  // });

  describe('Intervention distribution', () => {
    function assertAnnualPeriodsDistributedInterventions(
      createdProject: IEnrichedProject,
      distributedInterventions: IEnrichedIntervention[]
    ): void {
      const annualPeriods = createdProject.annualDistribution.annualPeriods as IEnrichedProjectAnnualPeriod[];
      for (const annualPeriod of annualPeriods) {
        const expectedInterventionIds = distributedInterventions
          .filter(i => i.planificationYear <= annualPeriod.year)
          .map(i => i.id);
        assert.deepEqual(_.orderBy(annualPeriod.interventionIds), _.orderBy(expectedInterventionIds));
      }
    }

    describe('Creating project', () => {
      it("C64281 - Positive - Should distribute an intervention across the project's annual period.", async () => {
        const intervention = await interventionDataGenerator.store({ planificationYear: 2020 });
        const plainProject = projectDataGenerator.createPlain({
          startYear: 2020,
          endYear: 2020,
          interventionIds: [intervention.id]
        });

        const response = await projectTestClient.create(plainProject);

        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assertAnnualPeriodsDistributedInterventions(response.body, [intervention]);
      });

      it("C64282 - Positive - Should distribute multiple interventions across the project's annual periods.", async () => {
        const storedInterventions: IEnrichedIntervention[] = [];
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2020 }));
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2022 }));
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2021 }));
        const plainProject = projectDataGenerator.createPlain({
          startYear: 2019,
          endYear: 2025,
          interventionIds: storedInterventions.map(i => i.id)
        });

        const response = await projectTestClient.create(plainProject);

        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assertAnnualPeriodsDistributedInterventions(response.body, storedInterventions);
      });
    });

    describe('Updating project', () => {
      let storedInterventions: IEnrichedIntervention[];
      let storedProject: IEnrichedProject;

      beforeEach(async () => {
        storedInterventions = [];
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2020 }));
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2022 }));
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2021 }));
        storedProject = await projectDataGenerator.store(
          {
            startYear: 2019,
            endYear: 2025,
            interventionIds: storedInterventions.map(i => i.id)
          },
          p => {
            p.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(p);
            interventionAnnualDistributionService.create(storedInterventions, p.annualDistribution.annualPeriods);
            geolocatedAnnualDistributionService.distributeInterventions(p, storedInterventions);
          }
        );
        storedInterventions.forEach(i => (i.project = { id: storedProject.id }));
        for (const storedIntervention of storedInterventions) {
          const interventionSaveResult = await interventionRepository.save(storedIntervention);
          if (interventionSaveResult.isFailure) {
            throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult)));
          }
        }
      });

      it("C64283 - Positive - Should distribute multiple interventions across the project's annual periods when adding interventions to a project.", async () => {
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2025 }));
        storedInterventions.push(await interventionDataGenerator.store({ planificationYear: 2024 }));
        const plainProject = projectDataGenerator.createPlainFromEnriched(storedProject);
        plainProject.interventionIds = storedInterventions.map(i => i.id);

        const response = await projectTestClient.update(storedProject.id, plainProject);

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assertAnnualPeriodsDistributedInterventions(response.body, storedInterventions);
      });

      it("C64284 - Positive - Should distribute multiple interventions across the project's annual periods when removing interventions from a project.", async () => {
        storedInterventions.splice(1, 1);
        const plainProject = projectDataGenerator.createPlainFromEnriched(storedProject);
        plainProject.interventionIds = storedInterventions.map(i => i.id);

        const response = await projectTestClient.update(storedProject.id, plainProject);

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assertAnnualPeriodsDistributedInterventions(response.body, storedInterventions);
      });

      describe('Canceling intervention', () => {
        it("C64285 - Positive - Should distribute interventions across the project's annual periods when canceling an intervention.", async () => {
          const interventionDecision: IInterventionDecision = {
            text: 'test',
            typeId: InterventionDecisionType.canceled
          };
          const canceledIntervention = storedInterventions[1];
          storedInterventions.splice(1, 1);

          const cancelationResponse = await interventionTestClient.createDecision(
            canceledIntervention.id,
            interventionDecision
          );
          assert.strictEqual(cancelationResponse.status, HttpStatusCodes.CREATED);

          const projectResponse = await projectTestClient.get(storedProject.id, [ProjectExpand.interventions]);
          assert.strictEqual(projectResponse.status, HttpStatusCodes.OK);

          assertAnnualPeriodsDistributedInterventions(projectResponse.body, storedInterventions);
        });
      });
    });
  });
});

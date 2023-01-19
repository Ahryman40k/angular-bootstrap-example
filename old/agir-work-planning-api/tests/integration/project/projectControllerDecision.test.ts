import {
  AnnualProgramStatus,
  CommentCategory,
  IEnrichedIntervention,
  IEnrichedProgramBook,
  IEnrichedProject,
  IHistory,
  IInterventionAnnualPeriod,
  InterventionStatus,
  IProjectDecision,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectDecisionType,
  ProjectExpand,
  ProjectStatus,
  ProjectType,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes, EntityType } from '../../../config/constants';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { annualProgramRepository } from '../../../src/features/annualPrograms/mongo/annualProgramRepository';
import {
  createAndSaveAnnualProgram,
  getAnnualProgramProps
} from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { db } from '../../../src/features/database/DB';
import { HistoryModel } from '../../../src/features/history/mongo/historyModel';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { createIntervention } from '../../../src/features/interventions/tests/interventionTestHelper';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { programBookRepository } from '../../../src/features/programBooks/mongo/programBookRepository';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { ProjectModel } from '../../../src/features/projects/mongo/projectModel';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import {
  createAndSaveProject,
  projectRestrictionsTestData
} from '../../../src/features/projects/tests/projectTestHelper';
import { createAndSaveSubmission } from '../../../src/features/submissions/tests/submissionTestHelper';
import { auditService } from '../../../src/services/auditService';
import { assertRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { appUtils } from '../../../src/utils/utils';
import { projectDataCoupler } from '../../data/dataCouplers/projectDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { createInterventionModel } from '../../data/interventionData';
import { programBooksData } from '../../data/programBooksData';
import {
  createMockProject,
  createMockProjectHistory,
  getProjectDecision,
  getProjectDecisionMock
} from '../../data/projectData';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { interventionTestClient } from '../../utils/testClients/interventionTestClient';
import { projectDecisionTestClient } from '../../utils/testClients/projectDecisionTestClient';
import { destroyDBTests, getFutureYear, getHistoryObjectKeys, mergeProperties } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable: max-func-body-length
describe('Project controller decision', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  const apiUrlIntervention: string = appUtils.createPublicFullPath(
    constants.locationPaths.INTERVENTION,
    EndpointTypes.API
  );
  const programBooksUrl = appUtils.createPublicFullPath(constants.locationPaths.PROGRAM_BOOK, EndpointTypes.API);
  let projectModel: ProjectModel;
  let historyModel: HistoryModel;

  before(() => {
    projectModel = db().models.Project;
    historyModel = db().models.History;
  });

  after(async () => {
    await integrationAfter();
  });

  function setupStubs() {
    spatialAnalysisServiceStub.init(sandbox);
  }

  beforeEach(() => {
    setupStubs();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('/projects/:id/decisions > POST', () => {
    /* tslint:disable max-line-length */
    let mockIntervention: IEnrichedIntervention;

    afterEach(async () => {
      await destroyDBTests();
    });

    function assertCommonInterventionAnnualPeriod(
      annualPeriod: IInterventionAnnualPeriod,
      mockAnnualPeriod: IInterventionAnnualPeriod
    ): void {
      if (!mockAnnualPeriod) {
        return;
      }
      assert.strictEqual(annualPeriod.accountId, mockAnnualPeriod.accountId);
      assert.strictEqual(annualPeriod.annualAllowance, mockAnnualPeriod.annualAllowance);
      assert.strictEqual(annualPeriod.rank, mockAnnualPeriod.rank);
    }

    function assertInterventionAnnualPeriods(
      interventionAnnualPeriods: IInterventionAnnualPeriod[],
      mockInterventionAnnualPeriods: IInterventionAnnualPeriod[]
    ): void {
      const lastPeriodAllowance = countLastPeriodAllowance(interventionAnnualPeriods, mockInterventionAnnualPeriods);
      interventionAnnualPeriods.forEach((ap, index) => {
        if (index === interventionAnnualPeriods.length - 1) {
          mockInterventionAnnualPeriods[index].annualAllowance = lastPeriodAllowance;
        }
        assertCommonInterventionAnnualPeriod(ap, mockInterventionAnnualPeriods[index]);
      });
    }

    function countLastPeriodAllowance(
      interventionAnnualPeriods: IInterventionAnnualPeriod[],
      mockInterventionAnnualPeriods: IInterventionAnnualPeriod[]
    ): number {
      const count = interventionAnnualPeriods.length;
      const mockCount = mockInterventionAnnualPeriods.length;
      let lastPeriodAllowance = mockInterventionAnnualPeriods[mockCount - 1].annualAllowance;
      if (count < mockCount) {
        const lastOffAnnualPeriods = mockInterventionAnnualPeriods.filter(
          mockAp => mockAp.rank >= interventionAnnualPeriods[count - 1].rank
        );
        lastPeriodAllowance = _.sumBy(lastOffAnnualPeriods, 'annualAllowance');
      } else if (count > mockCount) {
        lastPeriodAllowance = 0;
      }
      return lastPeriodAllowance;
    }

    function assertAnnualPeriodsProjectDecision(project: IEnrichedProject, decision: IProjectDecision): void {
      const yearRange = _.range(decision.startYear, decision.endYear + 1);
      const annualPeriods = project.annualDistribution.annualPeriods;
      assert.lengthOf(annualPeriods, yearRange.length);
      for (const year of yearRange) {
        assert.exists(annualPeriods.find(ap => ap.year === year));
      }
      assert.isTrue(annualPeriods.every(ap => ap.status === project.status));
    }

    function assertAnnualPeriodsNonGeoProjectDecision(project: IEnrichedProject, mockProject: IEnrichedProject): void {
      project.annualDistribution.annualPeriods.forEach((ap, index) => {
        const mockAnnualPeriod = mockProject.annualDistribution.annualPeriods[index];
        assert.strictEqual(ap.rank, mockAnnualPeriod.rank);
        assert.strictEqual(ap.annualAllowance, mockAnnualPeriod.annualAllowance);
        assert.strictEqual(ap.annualBudget, mockAnnualPeriod.annualBudget);
        assert.strictEqual(ap.categoryId, mockAnnualPeriod.categoryId);
        assert.strictEqual(ap.status, project.status);
      });
    }

    // Replanned decision
    describe('replanned', () => {
      let mockProject: IEnrichedProject;
      let mockAnnualProgram: AnnualProgram;
      let mockProgramBook: ProgramBook;
      let addDecision: any;

      beforeEach(async () => {
        addDecision = getProjectDecision(ProjectDecisionType.replanned, appUtils.getCurrentYear(), getFutureYear(2));
        mockProject = await projectDataGenerator.store({
          status: ProjectStatus.planned
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        mockAnnualProgram = await createAndSaveAnnualProgram({
          status: AnnualProgramStatus.programming
        });
        mockProgramBook = await createAndSaveProgramBook({
          annualProgram: mockAnnualProgram,
          status: ProgramBookStatus.programming
        });
      });

      afterEach(async () => {
        await destroyDBTests();
      });

      it(`C54554 - Positive - Should have 201 status when project status changed from planned to replanned`, async () => {
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54555 - Positive - Should have 201 status when status changed from replanned to replanned`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.replanned,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54556 - Positive - Should have 201 status when status changed from programmed to replanned`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.programmed,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`Positive - Should have 201 status when status changed from postponed to replanned`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.postponed,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54558 - Positive - PlannificationYear of an intervention should be inside the project startYear and endYear
      when decision to replanned`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.replanned,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.isTrue(
          addDecision.startYear <= mockIntervention.planificationYear &&
            addDecision.endYear >= mockIntervention.planificationYear
        );
      });

      it(`C54561 - Positive - Should the plannificationYear of an intervention be the same as the startYear
        when decision to replanned`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.planned,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const response = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        mockProject = response.body;
        mockIntervention = await interventionRepository.findById(mockIntervention.id);
        assert.isTrue(addDecision.startYear === mockIntervention.planificationYear);
      });

      it(`C54559 - Negative - Should have 400 status when status changed from wrong status to replanned`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.canceled,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });

      it(`C54560 - Negative - Should have 400 status when status changed to replanned with same startYear as the project startyear
       and the same endYear as the project endYear`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.planned,
          interventionIds: [mockIntervention.id],
          startYear: addDecision.startYear,
          endYear: addDecision.endYear
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.BAD_REQUEST);
      });

      it(`C60102 - Positive - Should add the programmed project id to the program book removed project ids when adding a replanning decision`, async () => {
        mockProject = await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          status: ProjectStatus.programmed,
          interventionIds: [mockIntervention.id],
          programBookId: mockProgramBook.id
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        const persistedProgramBook = await programBookRepository.findById(mockProgramBook.id, [
          ProgramBookExpand.projectsInterventions,
          ProgramBookExpand.removedProjects
        ]);
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.include(
          persistedProgramBook.removedProjects.map(rp => rp.id),
          mockProject.id
        );
      });

      it('C60809 Positive - Should return a current decision including previousStartYear and previousEndYear matching project startYear and endYear', async () => {
        const firstDecision = _.cloneDeep(addDecision);
        firstDecision.startYear = getFutureYear(3);
        firstDecision.endYear = getFutureYear(4);
        mockProject = await createMockProject({
          status: ProjectStatus.planned,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;

        const res = await requestService.post(decisionUrl, { body: { decision: firstDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.property(res.body, 'decisions');
        assert.property(res.body.decisions[0], 'previousStartYear');
        assert.property(res.body.decisions[0], 'previousEndYear');
        assert.equal(res.body.decisions[0].previousStartYear, mockProject.startYear);
        assert.equal(res.body.decisions[0].previousEndYear, mockProject.endYear);
      });

      it('C60810 Positive - Should return a current decision including previousStartYear and previousEndYear matching previous decision startYear and endYear', async () => {
        const firstDecision = _.cloneDeep(addDecision);
        firstDecision.startYear = getFutureYear(3);
        firstDecision.endYear = getFutureYear(4);

        mockProject = await createMockProject({
          status: ProjectStatus.planned,
          interventionIds: [mockIntervention.id]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const secondDecision = getProjectDecisionMock({
          typeId: ProjectDecisionType.replanned,
          startYear: getFutureYear(4),
          endYear: getFutureYear(5)
        });

        const firstResponse = await requestService.post(decisionUrl, { body: { decision: firstDecision } });
        const secondResponse = await requestService.post(decisionUrl, { body: { decision: secondDecision } });
        assert.strictEqual(firstResponse.status, HttpStatusCodes.CREATED);
        assert.strictEqual(secondResponse.status, HttpStatusCodes.CREATED);

        const currentDecision = secondResponse.body.decisions[0];
        assert.equal(secondResponse.body.decisions.length, 2);
        assert.equal(currentDecision.previousStartYear, firstDecision.startYear);
        assert.equal(currentDecision.previousEndYear, firstDecision.endYear);
      });

      it(`C64821 - Positive - Should remain the same annual periods budget if a replanning decision is made without changing geolocalized project duration`, async () => {
        const interventionYear = mockProject.startYear + 1;
        let mockIntervention2: IEnrichedIntervention = Object.assign({}, mockIntervention, {
          interventionYear,
          planificationYear: interventionYear
        });
        mockIntervention2.annualDistribution.annualPeriods = mockIntervention.annualDistribution.annualPeriods.map(
          (annualPeriod, index) => {
            annualPeriod.annualAllowance = 10 * (index + 1);
            return annualPeriod;
          }
        );
        mockIntervention2 = await interventionDataGenerator.store(mockIntervention2, mockProject);

        mockProject = await projectDataCoupler.coupleThem({
          project: mockProject,
          interventions: [mockIntervention, mockIntervention2]
        });
        const mockInterventions = await interventionTestClient.findByIds(mockProject.interventionIds);

        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        const interventions: IEnrichedIntervention[] = await interventionTestClient.findByIds(project.interventionIds);

        assert.isNotEmpty(interventions);
        assertAnnualPeriodsProjectDecision(project, addDecision);
        for (const intervention of interventions) {
          const currentMockIntervention = mockInterventions.find(i => i.id === intervention.id);
          assertInterventionAnnualPeriods(
            intervention.annualDistribution.annualPeriods,
            currentMockIntervention.annualDistribution.annualPeriods
          );
        }
      });

      it(`C64822 - Positive - Should remain the same annual periods budget if a replanning decision is made without changing non-geolocalized project duration`, async () => {
        mockProject = await projectDataGenerator.update(mockProject, {
          geometry: null,
          geometryPin: null,
          projectTypeId: ProjectType.other
        });
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        assertAnnualPeriodsNonGeoProjectDecision(project, mockProject);
      });

      it(`C64823 - Positive - Should add an annual period with initial data if a replanning decision is increasing project duration by a year`, async () => {
        addDecision = getProjectDecision(ProjectDecisionType.replanned, mockProject.startYear, mockProject.endYear + 1);
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        const interventions: IEnrichedIntervention[] = await interventionTestClient.findByIds(project.interventionIds);
        for (const intervention of interventions) {
          assert.lengthOf(
            intervention.annualDistribution.annualPeriods,
            mockIntervention.annualDistribution.annualPeriods.length + 1
          );
          const lastIndex = intervention.annualDistribution.annualPeriods.length - 1;
          const ap = intervention.annualDistribution.annualPeriods[lastIndex];
          assertCommonInterventionAnnualPeriod(ap, {
            year: ap.year,
            annualAllowance: 0,
            annualLength: 0,
            accountId: 0,
            rank: lastIndex
          });
        }
      });

      it(`C64824 - Positive - Should remove last annual period if a replanning decision is shrinking project duration by a year`, async () => {
        addDecision = getProjectDecision(ProjectDecisionType.replanned, mockProject.startYear, mockProject.endYear - 1);
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        const interventions: IEnrichedIntervention[] = await interventionTestClient.findByIds(project.interventionIds);
        for (const intervention of interventions) {
          assert.lengthOf(
            intervention.annualDistribution.annualPeriods,
            mockIntervention.annualDistribution.annualPeriods.length - 1
          );
        }
      });

      it(`C65153 - Positive - Should add a comment if accountId is removed when a replanning decision is shrinking project duration`, async () => {
        addDecision = getProjectDecision(
          ProjectDecisionType.replanned,
          mockProject.startYear + 1,
          mockProject.endYear - 1
        );
        mockIntervention.annualDistribution.annualPeriods[
          mockIntervention.annualDistribution.annualPeriods.length - 2
        ].accountId = 123456789;
        mockIntervention.annualDistribution.annualPeriods[
          mockIntervention.annualDistribution.annualPeriods.length - 2
        ].accountId = 123456789;
        mockIntervention.annualDistribution.annualPeriods[
          mockIntervention.annualDistribution.annualPeriods.length - 1
        ].accountId = 987654321;
        await interventionDataGenerator.update(mockIntervention);
        const mockCommentSize = mockIntervention.comments?.length || 0;
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        const interventions: IEnrichedIntervention[] = await interventionTestClient.findByIds(project.interventionIds);
        const intervention = interventions.find(i => i.id === mockIntervention.id);
        assert.lengthOf(intervention.comments, mockCommentSize + 1);
        assert.strictEqual(
          intervention.comments[intervention.comments.length - 1].categoryId,
          CommentCategory.historic
        );
        assert.isTrue(intervention.comments[intervention.comments.length - 1].text.includes('987654321'));
      });
      // restrictions
      projectRestrictionsTestData.forEach(test => {
        it(test.scenario, async () => {
          const props = mergeProperties(mockProject, test.props);
          const project = await createAndSaveProject(props);
          addDecision = getProjectDecision(ProjectDecisionType.replanned, project.startYear, project.endYear - 1);

          userMocker.mockRestrictions(test.useRestrictions);
          const response = await projectDecisionTestClient.create(project.id, addDecision);

          assertRestrictions(test.expectForbidden, response);
          // remove user restrictions
          userMocker.mockRestrictions({});
        });
      });
    });

    // Postponed decision
    describe('postponed', () => {
      const currentYear = appUtils.getCurrentYear();
      let mockProject: IEnrichedProject;
      let mockAnnualProgram: AnnualProgram;
      let mockProgramBook: ProgramBook;
      let addDecision: any;
      before(() => {
        addDecision = getProjectDecision(ProjectDecisionType.postponed);
        addDecision.startYear = currentYear + 2;
        addDecision.endYear = currentYear + 2;
      });
      beforeEach(async () => {
        mockProject = await projectDataGenerator.store({
          status: ProjectStatus.preliminaryOrdered
        });
        mockIntervention = await interventionDataGenerator.store(
          createInterventionModel({ status: InterventionStatus.integrated }),
          mockProject
        );
        mockAnnualProgram = await createAndSaveAnnualProgram({
          status: AnnualProgramStatus.programming
        });
        mockProgramBook = await createAndSaveProgramBook({
          annualProgram: mockAnnualProgram,
          status: ProgramBookStatus.programming
        });
        await projectDataCoupler.coupleThem({
          project: mockProject,
          interventions: [mockIntervention],
          programBooksCoupler: [{ year: mockAnnualProgram.year, programBook: mockProgramBook }]
        });
      });
      afterEach(async () => {
        await destroyDBTests();
      });

      it(`C54562 - Positive - Should have 201 status when project status changed from finalOrdered to postponed`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.finalOrdered
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54566 - Positive - Should the plannificationYear of an intervention be the same as the targetYear
        when decision to postponed`, async () => {
        mockProject = await createMockProject({ status: ProjectStatus.finalOrdered });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        mockProject = await projectRepository.findById(mockProject.id);
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const response = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        mockIntervention = await interventionRepository.findById(mockIntervention.id);
        assert.isTrue(addDecision.startYear === mockIntervention.planificationYear);
      });

      it(`C54567 - Negative - Should have 400 status when status changed from wrong status to postponed`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.planned
        });
        mockIntervention = await interventionDataGenerator.store({ status: InterventionStatus.wished }, mockProject);
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });

      it(`C54568 - Negative - Should have 400 status when status changed to postponed with same year as the project startyear`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.preliminaryOrdered,
          interventionIds: [mockIntervention.id],
          startYear: addDecision.startYear,
          endYear: addDecision.endYear
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.BAD_REQUEST);
      });

      it(`C60103 - Positive - Should add the programmed project id to the program book removed project ids when adding a postponing decision`, async () => {
        mockProject = await createMockProject({ status: ProjectStatus.preliminaryOrdered });
        await projectDataCoupler.coupleThem({
          project: mockProject,
          interventions: [mockIntervention],
          programBooksCoupler: [{ year: mockAnnualProgram.year, programBook: mockProgramBook }]
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        const persistedProgramBook: ProgramBook = await programBookRepository.findById(mockProgramBook.id, [
          ProgramBookExpand.projectsInterventions,
          ProgramBookExpand.removedProjects
        ]);
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.include(
          persistedProgramBook.removedProjects.map(rp => rp.id),
          mockProject.id
        );
      });

      it(`C64925 - Negative - Should return 409 status when project is on valid submission `, async () => {
        const submission = await createAndSaveSubmission({ status: SubmissionStatus.VALID });
        mockProject = await createMockProject({
          status: ProjectStatus.preliminaryOrdered,
          interventionIds: [mockIntervention.id],
          startYear: addDecision.startYear,
          endYear: addDecision.endYear,
          submissionNumber: submission.id
        });

        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CONFLICT);
      });

      it(`C54569 - Positive - Should  return 201 status when submission status is invalid`, async () => {
        const submission = await createAndSaveSubmission({ status: SubmissionStatus.INVALID });
        mockProject = await createMockProject({
          status: ProjectStatus.preliminaryOrdered,
          interventionIds: [mockIntervention.id],
          startYear: addDecision.startYear + 2,
          endYear: addDecision.endYear + 2,
          submissionNumber: submission.id
        });

        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C64825 - Positive - Should remain the same annual periods budget if a postponing decision is made without changing geolocalized project duration`, async () => {
        const interventionYear = mockProject.startYear + 1;
        addDecision.endYear = mockProject.endYear + 2;
        addDecision.startYear = mockProject.startYear + 2;
        let mockIntervention2: IEnrichedIntervention = Object.assign({}, mockIntervention, {
          interventionYear,
          planificationYear: interventionYear
        });
        mockIntervention2.annualDistribution.annualPeriods = mockIntervention.annualDistribution.annualPeriods.map(
          (annualPeriod, index) => {
            annualPeriod.annualAllowance = 10 * (index + 1);
            return annualPeriod;
          }
        );
        mockIntervention2 = await interventionDataGenerator.store(mockIntervention2, mockProject);

        mockProject = await projectDataCoupler.coupleThem({
          project: mockProject,
          interventions: [mockIntervention, mockIntervention2]
        });
        const mockInterventions = await interventionTestClient.findByIds(mockProject.interventionIds);

        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        const project: IEnrichedProject = response.body;

        const interventions: IEnrichedIntervention[] = await interventionTestClient.findByIds(project.interventionIds);

        assert.isNotEmpty(interventions);
        const delta = project.startYear - mockProject.startYear;
        for (const intervention of interventions) {
          const currentMockIntervention = mockInterventions.find(i => i.id === intervention.id);
          intervention.annualDistribution.annualPeriods.forEach(ap => {
            // const mockAnnualPeriods = currentMockIntervention.annualDistribution.annualPeriods;
            const mockAnnualPeriod = currentMockIntervention.annualDistribution.annualPeriods.find(
              mockAp => mockAp.year === ap.year - delta
            );
            assertCommonInterventionAnnualPeriod(ap, mockAnnualPeriod);
          });
        }
      });

      it(`C64826 - Positive - Should remain the same annual periods budget if a postponing decision is made without changing non-geolocalized project duration`, async () => {
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        assert.deepEqual(
          project.annualDistribution.distributionSummary,
          mockProject.annualDistribution.distributionSummary
        );
      });

      it(`C64827 - Positive - Should add an annual period with initial data if a postponing decision is increasing project duration by a year`, async () => {
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        const interventions: IEnrichedIntervention[] = await interventionTestClient.findByIds(project.interventionIds);
        assert.deepEqual(
          project.annualDistribution.distributionSummary,
          mockProject.annualDistribution.distributionSummary
        );
        for (const intervention of interventions) {
          const lastIndex = intervention.annualDistribution.annualPeriods.length - 1;
          const ap = intervention.annualDistribution.annualPeriods[lastIndex];
          assertCommonInterventionAnnualPeriod(ap, {
            year: ap.year,
            annualAllowance: 0,
            annualLength: 0,
            accountId: 0,
            rank: lastIndex
          });
        }
      });

      it(`C64828 - Positive - Should remove last annual period if a postponing decision is shrinking project duration by a year`, async () => {
        addDecision.startYear = mockProject.startYear + 1;
        addDecision.endYear = mockProject.endYear;
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);

        const project: IEnrichedProject = response.body;
        const interventions: IEnrichedIntervention[] = await interventionTestClient.findByIds(project.interventionIds);
        assert.deepEqual(
          project.annualDistribution.distributionSummary,
          mockProject.annualDistribution.distributionSummary
        );
        for (const intervention of interventions) {
          const aps = intervention.annualDistribution.annualPeriods;
          assert.lengthOf(aps, mockIntervention.annualDistribution.annualPeriods.length - 1);
        }
      });
    });

    describe('canceled', () => {
      let mockProject: IEnrichedProject;
      let addDecision: any;
      beforeEach(async () => {
        addDecision = getProjectDecision(ProjectDecisionType.canceled);
        delete addDecision.startYear;
        delete addDecision.endYear;
        mockProject = await createMockProject({
          status: ProjectStatus.planned
        });

        mockIntervention = await interventionDataGenerator.store(
          createInterventionModel({ status: InterventionStatus.integrated }),
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
      });
      afterEach(async () => {
        await projectModel.deleteMany({}).exec();
      });
      it(`C54570 - Positive - Should have 201 status when project status changed from planned to canceled`, async () => {
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54571 - Positive - Should have 201 status when status changed from replanned to canceled`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.replanned,
          interventionIds: [mockIntervention.id]
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54572 - Positive - Should have 201 status when status changed from programmed to canceled`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.programmed
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54573 - Positive - Should have 201 status when status changed from preliminaryOrdered to canceled`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.preliminaryOrdered
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54854 - Positive - Should have 201 status when status changed from finalOrdered to canceled`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.finalOrdered,
          interventionIds: [mockIntervention.id]
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C54574 - Positive - Should have 201 status when status changed from postponed to canceled`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.postponed
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      [
        {
          description: `to waiting`,
          intervention: {
            programId: undefined
          },
          expected: {
            status: InterventionStatus.waiting
          }
        },
        {
          description: `to accepted`,
          intervention: {
            programId: 'aProgramId'
          },
          expected: {
            status: InterventionStatus.accepted
          }
        }
      ].forEach(test => {
        it(`Positive - Intervention status should go ${test.description} when project status changed to canceled`, async () => {
          mockProject = await createMockProject({
            status: ProjectStatus.postponed
          });
          mockIntervention = await interventionDataGenerator.store(
            {
              status: InterventionStatus.integrated,
              ...test.intervention
            },
            mockProject
          );
          await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
          const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
          await requestService.post(decisionUrl, { body: { decision: addDecision } });
          const intervention = await requestService.get(`${apiUrlIntervention}/${mockIntervention.id}`, {});
          assert.strictEqual(intervention.body.status, test.expected.status);
        });
      });

      it(`C55466 - Positive - Project should have empty program book`, async () => {
        mockProject = await createMockProject(
          {
            status: ProjectStatus.postponed,
            interventionIds: [mockIntervention.id]
          },
          {
            projectGeoAnnualDistribution: {
              annualPeriods: [{ programBookId: mongoose.Types.ObjectId() as any }]
            }
          }
        );
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const response = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.isNotOk(response.body.programBookId);
      });

      it(`C64837 - Positive - Should cancel every annual periods upon canceling decision`, async () => {
        const response = await projectDecisionTestClient.create(mockProject.id, addDecision);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        const project: IEnrichedProject = response.body;
        assert.isTrue(project.annualDistribution.annualPeriods.every(ap => ap.status === ProjectStatus.canceled));
      });
    });

    describe('save in history', () => {
      let mockProject: IEnrichedProject;
      let addDecision: any;
      let decisionUrl: string;
      beforeEach(async () => {
        addDecision = getProjectDecision(ProjectDecisionType.replanned, appUtils.getCurrentYear(), getFutureYear());
        mockProject = await createMockProject({
          status: ProjectStatus.planned
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        await historyModel.deleteMany({}).exec();
      });
      afterEach(async () => {
        await destroyDBTests();
      });

      it(`C54789 - Positive - Should add an project history entry`, async () => {
        let projectsHistory = await historyModel.find({ referenceId: mockProject.id }).exec();

        assert.isFalse(projectsHistory.length > 0);
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        await requestService.post(decisionUrl, { body: { decision: addDecision } });

        projectsHistory = await historyModel
          .find({ referenceId: mockProject.id })
          .lean()
          .exec();

        assert.isTrue(projectsHistory.length > 0);
        assert.hasAnyKeys(projectsHistory[0], getHistoryObjectKeys());
      });

      it(`C54790 - Positive - Should add an intervention history entry`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.planned,
          interventionIds: [mockIntervention.id]
        });
        let interventionHistory = await historyModel.find({ referenceId: mockIntervention.id }).exec();
        assert.isFalse(interventionHistory.length > 0);
        await projectDataCoupler.coupleThem({ project: mockProject, interventions: [mockIntervention] });
        await requestService.post(decisionUrl, { body: { decision: addDecision } });
        interventionHistory = await historyModel.find({ referenceId: mockIntervention.id }).exec();
        assert.isTrue(interventionHistory.length > 0);
        assert.hasAnyKeys(interventionHistory[0].toObject(), getHistoryObjectKeys());
      });
    });

    // Décision de retrait
    describe('remove program book', () => {
      async function postDecision(
        projectId: string,
        decision: IProjectDecision,
        annualPeriodYear: number
      ): Promise<request.Response> {
        return requestService.post(`${apiUrl}/${projectId}/decisions`, { body: { decision, annualPeriodYear } });
      }

      async function mockSecondAnnualPeriod(): Promise<void> {
        mockSecondAnnualProgram = await createAndSaveAnnualProgram({
          year: nextYear,
          status: AnnualProgramStatus.programming
        });
        mockSecondProgramBook = await createAndSaveProgramBook({
          annualProgram: mockSecondAnnualProgram,
          status: ProgramBookStatus.programming
        });
        await projectDataCoupler.coupleThem({
          project: mockProject,
          interventions: [mockIntervention],
          programBooksCoupler: [{ year: mockSecondAnnualProgram.year, programBook: mockSecondProgramBook }]
        });
      }

      const currentYear = appUtils.getCurrentYear();
      const nextYear = currentYear + 1;

      let mockProject: IEnrichedProject;
      let mockAnnualProgram: AnnualProgram;
      let mockProgramBook: ProgramBook;
      let mockSecondAnnualProgram: AnnualProgram;
      let mockSecondProgramBook: ProgramBook;
      let mockProgramBookNew: ProgramBook;
      let addDecision: IProjectDecision;
      beforeEach(async () => {
        addDecision = getProjectDecision(ProjectDecisionType.removeFromProgramBook);
        mockIntervention = await createIntervention(createInterventionModel({ status: InterventionStatus.integrated }));

        mockAnnualProgram = await createAndSaveAnnualProgram({
          status: AnnualProgramStatus.programming
        });
        mockProgramBook = await createAndSaveProgramBook({
          annualProgram: mockAnnualProgram,
          status: ProgramBookStatus.programming
        });

        mockProgramBookNew = await createAndSaveProgramBook({
          annualProgram: mockAnnualProgram,
          status: ProgramBookStatus.new
        });

        mockProject = await createMockProject({
          status: ProjectStatus.programmed
        });
        mockIntervention = await interventionDataGenerator.store(
          { status: InterventionStatus.integrated },
          mockProject
        );
        await projectDataCoupler.coupleThem({
          project: mockProject,
          interventions: [mockIntervention],
          programBooksCoupler: [{ year: mockAnnualProgram.year, programBook: mockProgramBook }]
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.planned,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
      });
      afterEach(async () => {
        await projectModel.deleteMany({}).exec();
        await db()
          .models.Intervention.deleteMany({})
          .exec();
        await historyModel.deleteMany({}).exec();
      });

      it(`C55752 - Positive - Should set priorityScenarios isOutdated property to true when removing a project from a programBook or adding a decision to project`, async () => {
        await mockSecondAnnualPeriod();
        await postDecision(mockProject.id, addDecision, nextYear);

        const response = await requestService.get(`${programBooksUrl}/${mockSecondProgramBook.id}`, {});
        const updatedProgramBook: IEnrichedProgramBook = response.body;

        mockSecondProgramBook.priorityScenarios.forEach(ps => assert.isFalse(ps.isOutdated));
        updatedProgramBook.priorityScenarios.forEach(ps => assert.isTrue(ps.isOutdated));
      });

      it(`C55744 - Positive - Should remove the project from the program book only while its status is not yet marked as "final ordered"`, async () => {
        await mockSecondAnnualPeriod();
        const res = await postDecision(mockProject.id, addDecision, nextYear);
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        const project: IEnrichedProject = res.body;
        assert.isUndefined(project.annualDistribution.annualPeriods.find(ap => ap.year === nextYear).programBookId);
      });

      it(`C55745 - Positive - Should remove project from program book when its status is "programming"`, async () => {
        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C55746 - Positive - Should have status "replanned" after the project is removed from program book`, async () => {
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.replanned,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(res.body.status, ProjectStatus.replanned);
      });

      it(`C60111 - Positive - Should have status "postponed" after the project is removed from program book`, async () => {
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.postponed,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(ProjectStatus.postponed, res.body.status);
      });

      it(`C60112 - Positive - Should have status "planned" after the project is removed from program book`, async () => {
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.planned,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(ProjectStatus.planned, res.body.status);
      });

      it(`C55747 - Positive - Should replan a project to a different year automatically when removed from program book`, async () => {
        const addDecision2 = getProjectDecision(
          ProjectDecisionType.replanned,
          appUtils.getCurrentYear(),
          getFutureYear()
        );
        addDecision2.startYear = addDecision2.startYear + 2;
        addDecision2.endYear = addDecision2.endYear + 2;
        const res = await postDecision(mockProject.id, addDecision2, currentYear);

        assert.strictEqual(res.body.status, ProjectStatus.replanned);
        assert.isNull(res.body.annualDistribution.annualPeriods[0].programBookId);
      });

      it(`C55748 - Positive - Should log into history when removing project from program book`, async () => {
        const addDecision2 = getProjectDecision(
          ProjectDecisionType.replanned,
          appUtils.getCurrentYear(),
          getFutureYear()
        );
        addDecision2.startYear = addDecision2.startYear + 2;
        addDecision2.endYear = addDecision2.endYear + 2;

        await postDecision(mockProject.id, addDecision2, currentYear);
        const historyEntity: IHistory[] = await historyModel
          .find({
            referenceId: mockProject.id,
            'summary.statusFrom': ProjectStatus.programmed,
            'summary.statusTo': ProjectStatus.replanned
          })
          .lean()
          .exec();

        assert.lengthOf(historyEntity, 1);
      });

      it(`C60942	Positive - Should change the program book status to opened when removing last project from program book`, async () => {
        const projectUrl = `${apiUrl}/${mockProject.id}`;
        const projectRes = await requestService.get(projectUrl);
        const response = await postDecision(mockProject.id, addDecision, currentYear);

        const programBook = await programBookRepository.findById(
          projectRes.body.annualDistribution.annualPeriods[0].programBookId
        );
        if (!programBook.projects) {
          _.set(programBook, 'projects', []);
        }
        assert.strictEqual(programBook.projects.length, 0);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assert.strictEqual(programBook.status, ProgramBookStatus.programming);
      });

      it(`C60943  Positive - Should sync the annual program status to programming when removing last phase from program book`, async () => {
        const response = await postDecision(mockProject.id, addDecision, currentYear);
        const annualProgram = await annualProgramRepository.findById(mockProgramBook.annualProgram.id);

        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assert.strictEqual(annualProgram.status, AnnualProgramStatus.programming);
      });

      it(`C55749 - Positive - Should remove project from program book when it has status "final ordered"`, async () => {
        mockProject = await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          status: ProjectStatus.finalOrdered,
          interventionIds: [mockIntervention.id],
          programBookId: mockProgramBook.id
        });

        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      });

      it(`C55750 - Negative - Should not remove project from program book when status is not "programming"`, async () => {
        mockProject = await programBooksData.createMockProjectInProgramBook(mockProgramBookNew, {
          status: ProjectStatus.programmed,
          interventionIds: [mockIntervention.id],
          programBookId: mockProgramBookNew.id
        });

        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(res.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });

      it(`C55751 - Negative - Should not remove project from program book when it is not in a program book`, async () => {
        mockProject = await createMockProject({
          status: ProjectStatus.replanned,
          interventionIds: [mockIntervention.id]
        });

        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(res.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });
      it(`C60104 - Positive - Should add the programmed project id to the program book removed project ids when adding a removing decision`, async () => {
        mockProject = await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          interventionIds: [mockIntervention.id],
          programBookId: mockProgramBook.id,
          status: ProjectStatus.programmed
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.postponed,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const projectUrl = `${apiUrl}/${mockProject.id}?expand=${ProjectExpand.programBook}&expand=${ProjectExpand.annualProgram}`;
        const projectRes = await requestService.get(projectUrl);
        const res = await requestService.post(decisionUrl, {
          body: { decision: addDecision, annualPeriodYear: currentYear }
        });
        const persistedProgramBook: ProgramBook = await programBookRepository.findById(
          projectRes.body.annualDistribution.annualPeriods[0].programBookId,
          [ProgramBookExpand.projectsInterventions, ProgramBookExpand.removedProjects]
        );
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.include(
          persistedProgramBook.removedProjects.map(rp => rp.id),
          mockProject.id
        );
      });

      it(`C60105 - Positive - Should set project status to planned: last status in history different from programmed when adding a removing decision`, async () => {
        mockProject = await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          status: ProjectStatus.programmed,
          interventionIds: [mockIntervention.id],
          programBookId: mockProgramBook.id
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.planned,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.programmed,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, {
          body: { decision: addDecision, annualPeriodYear: currentYear }
        });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.strictEqual(res.body.status, ProjectStatus.planned);
      });

      it(`C60119 - Positive - Should set project status to replanned: last status in history different from programmed when adding a removing decision`, async () => {
        mockProject = await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          status: ProjectStatus.programmed,
          interventionIds: [mockIntervention.id],
          programBookId: mockProgramBook.id
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.replanned,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.programmed,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, {
          body: { decision: addDecision, annualPeriodYear: currentYear }
        });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.strictEqual(res.body.status, ProjectStatus.replanned);
      });

      it(`C60120 - Positive - Should set project status to postponed: last status in history different from programmed when adding a removing decision`, async () => {
        mockProject = await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          status: ProjectStatus.programmed,
          interventionIds: [mockIntervention.id],
          programBookId: mockProgramBook.id
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.postponed,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        await createMockProjectHistory({
          objectTypeId: EntityType.project.toString() as any,
          referenceId: mockProject.id,
          actionId: constants.operation.CREATE as any,
          summary: {
            comments: constants.systemMessages.DECISION_ADDED,
            statusFrom: ProjectStatus.programmed,
            statusTo: ProjectStatus.programmed
          },
          audit: auditService.buildAudit()
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, {
          body: { decision: addDecision, annualPeriodYear: currentYear }
        });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.strictEqual(res.body.status, ProjectStatus.postponed);
      });

      it(`Positive - Should keep the project status as ${ProjectStatus.preliminaryOrdered} if project belongs to another programBook with status ${ProgramBookStatus.submittedPreliminary}`, async () => {
        const [programmedProgramBook, submittedPreliminaryProgramBook] = await Promise.all(
          [ProgramBookStatus.programming, ProgramBookStatus.submittedPreliminary].map(async (status, i) => {
            const annualProgram = await createAndSaveAnnualProgram({
              status: AnnualProgramStatus.programming,
              year: currentYear + i
            });
            return createAndSaveProgramBook({
              annualProgram,
              status
            });
          })
        );

        let project = await projectDataGenerator.store({
          status: ProjectStatus.preliminaryOrdered
        });
        // add programBooks to project annual distribution
        for (const [index, pb] of [submittedPreliminaryProgramBook, programmedProgramBook].entries()) {
          project.annualDistribution.annualPeriods.find(ap => ap.rank === index).programBookId = pb.id;
        }
        project = (await projectRepository.save(project)).getValue();

        const decisionUrl = `${apiUrl}/${project.id}/decisions`;
        const res = await requestService.post(decisionUrl, {
          body: { decision: addDecision, annualPeriodYear: currentYear + 1 }
        });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.strictEqual(res.body.status, ProjectStatus.preliminaryOrdered);
      });

      it(`Positive - Should set the project status as ${ProjectStatus.programmed} if project still belong to another program book
      ,then ${ProjectStatus.planned} when project do not belong to any other programBook`, async () => {
        const [firstProgramBook, secondProgramBook] = await Promise.all(
          [ProgramBookStatus.programming, ProgramBookStatus.programming].map(async (status, i) => {
            const annualProgram = await createAndSaveAnnualProgram({
              status: AnnualProgramStatus.programming,
              year: currentYear + i
            });
            return createAndSaveProgramBook({
              annualProgram,
              status
            });
          })
        );

        let project = await projectDataGenerator.store({
          status: ProjectStatus.preliminaryOrdered
        });
        // add programBooks to project annual distribution
        for (const [index, pb] of [secondProgramBook, firstProgramBook].entries()) {
          project.annualDistribution.annualPeriods.find(ap => ap.rank === index).programBookId = pb.id;
        }
        const intervention = await interventionDataGenerator.store(undefined, project);
        project.interventionIds = [intervention.id];
        project.interventions = [intervention];
        project = (await projectRepository.save(project)).getValue();

        // Remove project from second program book (current year + 1)
        const decisionUrl = `${apiUrl}/${project.id}/decisions`;
        const res = await requestService.post(decisionUrl, {
          body: { decision: addDecision, annualPeriodYear: currentYear + 1 }
        });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        assert.strictEqual(res.body.status, ProjectStatus.programmed);

        // Remove project from first program book (current year)
        const resFinal = await requestService.post(decisionUrl, {
          body: { decision: addDecision, annualPeriodYear: currentYear }
        });
        assert.strictEqual(resFinal.status, HttpStatusCodes.CREATED);
        assert.strictEqual(resFinal.body.status, ProjectStatus.planned);
      });

      it('C60971 - Positive - Should call the programbook compute objetive after the remove', async () => {
        const spyProgramBookComputeObjectives = sandbox.spy(ProgramBook.prototype, 'computeObjectives');
        const projectUrl = `${apiUrl}/${mockProject.id}`;
        const res = await requestService.get(projectUrl);
        const project = res.body as IEnrichedProject;

        await postDecision(project.id, addDecision, project.annualDistribution.annualPeriods[0].year);
        assert.isTrue(spyProgramBookComputeObjectives.calledOnce);
      });

      it('C64362 - Negative - Should not remove project from program book when its previous annual period is programmed', async () => {
        const annualProgramOpen = await createAndSaveAnnualProgram({
          year: getAnnualProgramProps().year + 1,
          status: AnnualProgramStatus.new
        });

        const programBook = await createAndSaveProgramBook({
          annualProgram: annualProgramOpen,
          status: ProgramBookStatus.programming,
          boroughIds: [mockProject.boroughId]
        });
        const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
          body: { projectId: mockProject.id }
        });
        assert.strictEqual(response.status, HttpStatusCodes.OK);

        const res = await postDecision(mockProject.id, addDecision, currentYear);
        assert.strictEqual(res.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });
    });
  });

  describe('/projects/:id/decisions > GET', () => {
    let mockProject: IEnrichedProject;
    let decision1: IProjectDecision;
    let decision2: IProjectDecision;
    let apiDecisionProjectUrl: string;
    beforeEach(async () => {
      mockProject = await createMockProject({
        status: ProjectStatus.planned
      });
      await interventionDataGenerator.store({ status: InterventionStatus.integrated }, mockProject);
      decision1 = getProjectDecision(ProjectDecisionType.replanned, appUtils.getCurrentYear(), getFutureYear());
      decision2 = getProjectDecision(ProjectDecisionType.canceled);
      delete decision2.startYear;
      delete decision2.endYear;
      apiDecisionProjectUrl = `${apiUrl}/${mockProject.id}/decisions`;
      await requestService.post(apiDecisionProjectUrl, { body: { decision: decision1 } });
      await requestService.post(apiDecisionProjectUrl, { body: { decision: decision2 } });
    });
    afterEach(async () => {
      await db()
        .models.Intervention.deleteMany({})
        .exec();
      await projectModel.deleteMany({}).exec();
    });

    it(`C54869 - Positive - Should have status 200 and return an array of decision`, async () => {
      const response = await requestService.get(apiDecisionProjectUrl, {});
      const enrichedDecision: IProjectDecision = _.cloneDeep(decision1);
      enrichedDecision.previousStartYear = mockProject.startYear;
      enrichedDecision.previousEndYear = mockProject.endYear;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      delete response.body[0].audit;
      delete response.body[1].audit;
      delete response.body[0].id;
      delete response.body[1].id;
      assert.deepEqual(response.body, [decision2, enrichedDecision]);
    });
  });
});

import {
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  IPlainProject,
  ProjectCategory,
  ProjectDecisionType,
  ProjectStatus,
  ProjectSubCategory
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { Express } from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { createDefaultApp } from '../../../src/core/app';
import { db } from '../../../src/features/database/DB';
import { InterventionModel } from '../../../src/features/interventions/mongo/interventionModel';
import { createIntervention } from '../../../src/features/interventions/tests/interventionTestHelper';
import { ProjectModel } from '../../../src/features/projects/mongo/projectModel';
import { appUtils } from '../../../src/utils/utils';
import { createInterventionModel, getProjectInterventionToIntegrate } from '../../data/interventionData';
import {
  createEnrichedProject,
  createMockProject,
  createProjectsSubCategories,
  enrichedToPlain,
  getInitialPlainProject,
  getProjectDecision
} from '../../data/projectData';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable: max-func-body-length
describe('Project controller (categories/subCategoryIds)', () => {
  let testApp: Express;
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  let projectModel: ProjectModel;
  let interventionModel: InterventionModel;

  before(async () => {
    testApp = await createDefaultApp();
    projectModel = db().models.Project;
    interventionModel = db().models.Intervention;
  });

  after(async () => {
    await integrationAfter();
  });

  beforeEach(() => {
    spatialAnalysisServiceStub.init(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
  });

  // tslint:disable-next-line:max-func-body-length
  describe('/projects > POST', () => {
    let interventionId: string;

    beforeEach(async () => {
      const intervention = getProjectInterventionToIntegrate();
      const doc = await createIntervention(intervention);
      interventionId = doc.id;
    });

    afterEach(async () => {
      await interventionModel.deleteMany({}).exec();
      await destroyDBTests();
    });

    it(`C58480 - Positive - Should assign new to categoryId property of annualPeriods when creating`, async () => {
      const currentYear = appUtils.getCurrentYear();
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionId];
      project.startYear = currentYear;
      project.endYear = currentYear;
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const proj: IEnrichedProject = response.body;
      const annualPeriods = proj.annualDistribution.annualPeriods;
      assert.isTrue(annualPeriods.every(annualPeriod => annualPeriod.categoryId === ProjectCategory.new));
    });

    it(`C58481 - Negative - Should not be able to create a project with categories`, async () => {
      const project: any = getInitialPlainProject();
      project.interventionIds = [interventionId];
      project.categories = [{ categoryId: ProjectCategory.new, year: project.startYear }];
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C58482 - Positive - Should be able to add sub-categories to project`, async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionId];
      const subCategories = [
        ProjectSubCategory.priority,
        ProjectSubCategory.recurrent,
        ProjectSubCategory.successive,
        ProjectSubCategory.urgent
      ];
      project.subCategoryIds = subCategories;
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const proj: IEnrichedProject = response.body;
      assert.deepStrictEqual(proj.subCategoryIds.sort(), subCategories.sort());
    });

    it(`C58483 - Negative - Should not be able to add sub-categories to project with a wrong sub-category`, async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionId];
      const subCategories = ['Wrong'];
      project.subCategoryIds = subCategories;
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C58487 - Positive - Should assign categoryId new to the first annualPeriod and  categoryId completing to other annualPeriods when creating`, async () => {
      const currentYear = appUtils.getCurrentYear();
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionId];
      project.startYear = currentYear;
      project.endYear = currentYear + 5;
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const proj: IEnrichedProject = response.body;
      const annualPeriods = proj.annualDistribution.annualPeriods;

      assert.isTrue(annualPeriods[0].categoryId === ProjectCategory.new);
      assert.isTrue(
        annualPeriods
          .slice(1, annualPeriods.length)
          .every(annualPeriod => annualPeriod.categoryId === ProjectCategory.completing)
      );
    });
  });

  describe('/projects/:id > PUT', () => {
    let interventionIds: string[];
    beforeEach(async () => {
      const intervention = getProjectInterventionToIntegrate();
      const docs = await Promise.all([intervention, intervention].map(mock => createIntervention(mock)));
      interventionIds = docs.map(x => x.id.toString());
    });
    afterEach(async () => {
      await interventionModel.deleteMany({}).exec();
      await db()
        .models.Project.deleteMany({})
        .exec();
    });

    it(`C58484 - Positive - Should be able to modify sub-categories`, async () => {
      const mockProject = createEnrichedProject(getInitialPlainProject());
      createProjectsSubCategories([mockProject]);
      const mockResult = enrichedToPlain(await createMockProject(mockProject));
      const project = _.cloneDeep(mockResult);
      project.interventionIds = [interventionIds[0]];
      project.subCategoryIds = [ProjectSubCategory.successive];
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${mockResult.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.deepStrictEqual(putResponse.body.subCategoryIds, project.subCategoryIds);
    });

    it(`C58485 - Negative - Should not be able to modify sub-categories with a wrong sub-category`, async () => {
      const mockProject = createEnrichedProject(getInitialPlainProject());
      createProjectsSubCategories([mockProject]);
      mockProject.interventionIds = interventionIds;
      const mockResult = await createMockProject(mockProject);
      const project = _.cloneDeep(mockResult);
      project.subCategoryIds = ['wrong'];
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${mockResult.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
  describe('/projects/:id/decisions > POST', () => {
    let mockIntervention: IEnrichedIntervention;
    afterEach(async () => {
      await interventionModel.deleteMany({}).exec();
    });
    describe('postponed', () => {
      const currentYear = appUtils.getCurrentYear();
      let mockProject: IEnrichedProject;
      let addDecision: any;
      before(() => {
        addDecision = getProjectDecision(ProjectDecisionType.postponed);
        addDecision.startYear = currentYear + 2;
        addDecision.endYear = currentYear + 2;
      });
      afterEach(async () => {
        await projectModel.deleteMany({}).exec();
        await interventionModel.deleteMany({}).exec();
      });

      // TODO: correct when refactoring decisions
      it.skip(`C58488 - Positive - Should change all categoryId of categories to postponed`, async () => {
        mockIntervention = await createIntervention(createInterventionModel({ status: InterventionStatus.integrated }));
        mockProject = await createMockProject({
          status: ProjectStatus.programmed,
          interventionIds: [mockIntervention.id],
          startYear: currentYear,
          endYear: currentYear
        });
        const decisionUrl = `${apiUrl}/${mockProject.id}/decisions`;
        const res = await requestService.post(decisionUrl, { body: { decision: addDecision } });
        assert.strictEqual(res.status, HttpStatusCodes.CREATED);
        const proj: IEnrichedProject = res.body;
        const annualPeriods = proj.annualDistribution.annualPeriods;
        assert.isTrue(annualPeriods.every(annualPeriod => annualPeriod.categoryId === ProjectCategory.postponed));
      });
    });
  });
});

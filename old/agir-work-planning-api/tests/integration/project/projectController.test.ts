import {
  AnnualProgramStatus,
  IAdditionalCostsTotalAmount,
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IHistory,
  InterventionStatus,
  IPlainProject,
  IPlainProjectAnnualDistribution,
  ITaxonomy,
  PriorityCode,
  ProjectExpand,
  ProjectStatus,
  ProjectSubCategory,
  ProjectType
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { Express } from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import { cloneDeep, get, omit, range } from 'lodash';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { createDefaultApp } from '../../../src/core/app';
import { annualProgramMapperDTO } from '../../../src/features/annualPrograms/mappers/annualProgramMapperDTO';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { AnnualProgramModel } from '../../../src/features/annualPrograms/mongo/annualProgramModel';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { getAsset, getFeature, getInitialAssetId } from '../../../src/features/asset/tests/assetTestHelper';
import { Comment } from '../../../src/features/comments/models/comment';
import { IPlainCommentProps } from '../../../src/features/comments/models/plainComment';
import { getComment, getPlainCommentProps } from '../../../src/features/comments/tests/commentTestHelper';
import { db } from '../../../src/features/database/DB';
import { HistoryModel } from '../../../src/features/history/mongo/historyModel';
import { historyRepository } from '../../../src/features/history/mongo/historyRepository';
import { InterventionFindOptions } from '../../../src/features/interventions/models/interventionFindOptions';
import { InterventionModel } from '../../../src/features/interventions/mongo/interventionModel';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import {
  createAndSaveIntervention,
  createIntervention
} from '../../../src/features/interventions/tests/interventionTestHelper';
import { programBookMapperDTO } from '../../../src/features/programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { ProgramBookModel } from '../../../src/features/programBooks/mongo/programBookModel';
import { programBookRepository } from '../../../src/features/programBooks/mongo/programBookRepository';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { ProjectModel } from '../../../src/features/projects/mongo/projectModel';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import {
  createAndSaveProject,
  getProjectProps,
  projectRestrictionsTestData,
  updateProjectRestrictionsTestData
} from '../../../src/features/projects/tests/projectTestHelper';
import { TaxonomyModel } from '../../../src/features/taxonomies/mongo/taxonomyModel';
import { geolocatedAnnualDistributionService } from '../../../src/services/annualDistribution/geolocatedAnnualDistributionService';
import { spatialAnalysisService } from '../../../src/services/spatialAnalysisService';
import { Result } from '../../../src/shared/logic/result';
import { assertRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { EXECUTOR_OTHER, SERVICE_SE, SERVICE_SUM } from '../../../src/shared/taxonomies/constants';
import { appUtils, IApiError, IErrorResponse, isPaginatedResult } from '../../../src/utils/utils';
import { projectDataCoupler } from '../../data/dataCouplers/projectDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import {
  createInterventionModel,
  createMockIntervention,
  getCompleteEnrichedIntervention,
  getProjectInterventionToIntegrate
} from '../../data/interventionData';
import { programBooksData } from '../../data/programBooksData';
import {
  createEnrichedProject,
  createMockProject,
  createNonGeolocatedProject,
  createProjectList,
  enrichedToPlain,
  getBadGeometriesProject,
  getEnrichedCompleteProject,
  getInitialPlainProject,
  getInitialProject,
  getInitialProjectTypeOther,
  getProjectInsideViewport,
  getProjectOutsideViewport,
  getSmallGeometriesProject
} from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { projectTestClient } from '../../utils/testClients/projectTestClient';
import { destroyDBTests, mergeProperties, NOT_FOUND_UUID, removeEmpty } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable: max-func-body-length
describe('Project controller', () => {
  let testApp: Express;
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  let annualProgramModel: AnnualProgramModel;
  let projectModel: ProjectModel;
  let interventionModel: InterventionModel;
  let taxonomyModel: TaxonomyModel;
  let historyModel: HistoryModel;

  after(async () => {
    await integrationAfter();
  });

  before(async () => {
    testApp = await createDefaultApp();
    projectModel = db().models.Project;
    interventionModel = db().models.Intervention;
    taxonomyModel = db().models.Taxonomy;
    annualProgramModel = db().models.AnnualProgram;
    historyModel = db().models.History;
  });

  function setupStubs() {
    const featureMock = getFeature({
      properties: {
        id: 'R145'
      }
    });
    spatialAnalysisServiceStub.init(sandbox);
    sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([featureMock]));
  }

  beforeEach(() => {
    setupStubs();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function putProject(id: string, project: IEnrichedProject): Promise<request.Response> {
    const plainProject: IPlainProject = enrichedToPlain(project);
    return requestService.put(`${apiUrl}/${id}`, { body: plainProject });
  }

  // tslint:disable-next-line:max-func-body-length
  describe('/projects > POST', () => {
    let interventionId: string;
    let taxonomyList: ITaxonomy[];
    let mockPlainProjectTypeOther: IPlainProject;
    let mockEnrichProjectTypeOther: IEnrichedProject;
    let project: IEnrichedProject;

    beforeEach(async () => {
      let intervention = getProjectInterventionToIntegrate();

      project = getInitialProject();
      project = (await projectRepository.save(project)).getValue();
      intervention = await interventionDataGenerator.store(intervention, project);
      interventionId = intervention.id;
      project.interventionIds = [interventionId];
      await projectDataGenerator.update(project);
      taxonomyList = (await taxonomyModel
        .find({ $and: [{ group: 'projectType' }, { code: 'other' }] })
        .exec()) as ITaxonomy[];
      mockEnrichProjectTypeOther = getInitialProjectTypeOther(taxonomyList[0].code);
      mockPlainProjectTypeOther = projectDataGenerator.createPlainNonGeo(
        projectDataGenerator.createPlainFromEnriched(mockEnrichProjectTypeOther)
      );
      project = projectDataGenerator.createPlain(project);
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    it('C47245  Positive - Create a new project and interventions are integrated', async () => {
      project = enrichedToPlain(project);
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      const doc = await interventionModel.findById(interventionId).exec();
      const historyEntity: IHistory[] = await historyModel
        .find({
          referenceId: interventionId,
          'summary.statusFrom': InterventionStatus.waiting
        })
        .exec();
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(get(doc, 'project.id', undefined), response.body.id);
      assert.strictEqual(doc.status, InterventionStatus.integrated);
      assert.strictEqual(historyEntity.length, 1);
    });

    it('C60717 - Positive - Project length should be total length of interventions', async () => {
      const projectInterventionIds = [];
      for (let i = 0; i < 2; i++) {
        const intervention = getProjectInterventionToIntegrate();
        const createdIntervention = await createIntervention(intervention);
        projectInterventionIds.push(createdIntervention.id);
      }
      project.interventionIds = projectInterventionIds;
      project = enrichedToPlain(project);
      const response = await requestService.post(apiUrl, { body: project });

      const intervention1 = await interventionModel.findById(project.interventionIds[0]).exec();
      const intervention2 = await interventionModel.findById(project.interventionIds[1]).exec();

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(
        response.body.length.value,
        intervention1.assets[0].length.value + intervention2.assets[0].length.value
      );
    });

    it('C65148 - Positive - Removing an intervention from project recalculates its global budget allowance', async () => {
      // Arrange:
      async function arrangeTest(): Promise<any> {
        await destroyDBTests();
        const interventions = [
          await createMockIntervention(
            Object.assign({}, getProjectInterventionToIntegrate(), {
              estimate: { allowance: 10, balance: 10, burnedDown: 0 }
            })
          ),
          await createMockIntervention(
            Object.assign({}, getProjectInterventionToIntegrate(), {
              estimate: { allowance: 20, balance: 20, burnedDown: 0 }
            })
          )
        ];
        const data = {
          interventions,
          project: await createMockProject(
            Object.assign({}, getInitialProject(), {
              status: ProjectStatus.planned,
              projectTypeId: ProjectType.other,
              interventionIds: interventions.map(i => i.id)
            })
          )
        };
        data.interventions.map(async (intervention: IEnrichedIntervention) => {
          const myIntervention = await interventionModel.findById(intervention.id).exec();
          assert.exists(myIntervention);
        });
        return data;
      }
      const mock = await arrangeTest();

      // Act:
      mock.project.interventionIds = [mock.interventions[0].id];
      const putResponse = await putProject(mock.project.id, mock.project);
      const myProject = putResponse.body;

      // Assert:
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(myProject.globalBudget.allowance, mock.interventions[0].estimate.allowance);
    });

    it('C65149 - Positive - Removing an intervention from project recalculates its length', async () => {
      project = await projectDataGenerator.update(project);
      const projectInterventionIds = [];
      for (let i = 0; i < 2; i++) {
        const intervention = getProjectInterventionToIntegrate();
        const createdIntervention = await interventionDataGenerator.store(intervention, project);
        projectInterventionIds.push(createdIntervention.id);
      }
      project.interventionIds = projectInterventionIds;
      const postResponse = await projectTestClient.create(projectDataGenerator.createPlainFromEnriched(project));

      const intervention1 = await interventionModel.findById(project.interventionIds[0]).exec();
      const intervention2 = await interventionModel.findById(project.interventionIds[1]).exec();

      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      assert.strictEqual(
        postResponse.body.length.value,
        intervention1.assets[0].length.value + intervention2.assets[0].length.value
      );

      project.interventionIds = [projectInterventionIds[0]];
      const plainProject = projectDataGenerator.createPlainFromEnriched(project);
      const putResponse = await requestService.put(`${apiUrl}/${postResponse.body.id}`, { body: plainProject });
      const updatedProjectIntervention = await interventionModel.findById(projectInterventionIds[0]).exec();

      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(putResponse.body.length.value, updatedProjectIntervention.assets[0].length.value);
    });

    it('Negative - Should return an error when interventions executor mismatch project executor', async () => {
      project.executorId = EXECUTOR_OTHER;
      project = enrichedToPlain(project);
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C47246  Negative - Validation error received when geometry has a bad format', async () => {
      project = getBadGeometriesProject();
      project.interventionIds = [interventionId];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.strictEqual((response.body as IErrorResponse).error.details[0].target, 'geometry');
    });

    it('C47248  Negative - Empty project is not saved', async () => {
      const response = await projectTestClient.create({} as IPlainProject);
      assert.property(response.body, 'error');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it("C47249  Negative - Sent data misses an attribute and doesn't match project model", async () => {
      project = getInitialPlainProject();
      project.interventionIds = [interventionId];
      delete project.startYear;
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C47250  Negative - List of interventions of project is empty, error thrown', async () => {
      project.interventionIds = [];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(
        (response.body as IErrorResponse).error.details[0].message,
        'Project must contain interventions to be created or updated'
      );
    });

    it("C47251  Negative - One intervention id doesn't exist, error thrown", async () => {
      const falseId = 'I00045';
      project.interventionIds = [falseId];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      const body = response.body as IErrorResponse;
      assert.strictEqual(body.error.details[0].message, 'Intervention was not found based on given id');
      assert.strictEqual(body.error.details[0].code, falseId);
    });

    it('C47252  Negative - One intervention is already integrated in another project, error thrown', async () => {
      project.interventionIds = [interventionId];
      await projectTestClient.create(enrichedToPlain(project));
      const response = await projectTestClient.create(enrichedToPlain(project));
      const body = response.body as IErrorResponse;
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      const detail = body.error.details.filter(
        (x: any) => x.message === 'Intervention is already integrated in another project'
      );
      assert.isNotEmpty(detail);
      assert.strictEqual(body.error.details[0].code, interventionId);
    });

    it('C47247  Negative - One or more taxonomy codes not found in taxonomy collection, error thrown', async () => {
      project.interventionIds = [interventionId];
      project.executorId = 'eau';
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it("C47253  Negative - Project doesn't contain intervention geometry", async () => {
      project = getSmallGeometriesProject();
      project.interventionIds = [interventionId];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(
        (response.body as IErrorResponse).error.details[0].message,
        'Project geometry is not containing this intervention area'
      );
    });

    it('C47604  Negative - Intervention has an earlier date than project', async () => {
      const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
      intervention.planificationYear = 1800;
      const doc = await createIntervention(intervention);
      project.interventionIds = [doc.id];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C47605  Negative - Intervention has later date than project', async () => {
      const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
      intervention.planificationYear = 3000;
      const doc = await createIntervention(intervention);
      project.interventionIds = [doc.id];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(
        (response.body as IErrorResponse).error.details[0].message,
        'Project end year must be equal or greater than latest intervention'
      );
    });

    it('C47606  Negative - Historique is not created, final projet status is empty', async () => {
      sinon.stub(historyRepository, 'save').throws(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      const history = await historyModel.find({}).exec();
      const historyLength = history.length;
      project.interventionIds = [interventionId];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.INTERNAL_SERVER_ERROR);
      const finalHistory = await historyModel.find({}).exec();
      assert.equal(finalHistory.length, historyLength);
      sinon.restore();
    });

    it('C47607  Negative - One Intervention has not a valid status to be integrated in a project ', async () => {
      const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
      intervention.status = InterventionStatus.canceled;
      const doc = await createIntervention(intervention);
      project.interventionIds = [doc.id];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55132  Negative - Should have 400 status when inChargeId invalid code', async () => {
      project.inChargeId = 'invalidChargeId';
      project.interventionIds = [interventionId];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.property(response.body, 'error');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C55134 - Positive - Should have 200 status when inChargeId is in interventions requestorId', async () => {
      const intervention = getProjectInterventionToIntegrate();
      intervention.requestorId = 'dep';
      const doc = await createIntervention(intervention);
      project.inChargeId = 'dep';
      project.interventionIds = [doc.id];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
    });
    it('C55135  Negative - Should be unprocessable when inChargeId is not in interventions requestorId', async () => {
      const intervention = getProjectInterventionToIntegrate();
      intervention.requestorId = 'bell';
      const doc = await createIntervention(intervention);
      project.inChargeId = 'dep';
      project.interventionIds = [doc.id];
      const response = await projectTestClient.create(enrichedToPlain(project));
      assert.property(response.body, 'error');
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55244  Positive - Should have current username in audit createdBy field', async () => {
      const intervention = await createIntervention(getProjectInterventionToIntegrate());
      project.interventionIds = [intervention.id];

      const response = await projectTestClient.create(enrichedToPlain(project));

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);

      const createdProject: IEnrichedProject = response.body;
      assert.strictEqual(createdProject.audit.createdBy.userName, userMocker.currentMock.userName);
    });

    it('C55703 - Positive - Should be able to create a project with other type and with geometry', async () => {
      project.projectTypeId = ProjectType.other;
      project.status = ProjectStatus.planned;
      const response = await projectTestClient.create(enrichedToPlain(project));
      delete response.body.audit;
      delete response.body.id;
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.body.projectTypeId, ProjectType.other);
      assert.deepEqual(response.body.geometry, project.geometry);
    });

    it('C55704 - Positive - Should be able to create a project with other type and without geometry', async () => {
      const response = await requestService.post(apiUrl, {
        body: mockPlainProjectTypeOther
      });
      delete mockEnrichProjectTypeOther.audit;
      project = omit(response.body, 'audit', 'id');
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.deepEqual(
        project.annualDistribution.annualPeriods,
        mockEnrichProjectTypeOther.annualDistribution.annualPeriods
      );
      assert.strictEqual(project.boroughId, mockEnrichProjectTypeOther.boroughId);
      assert.strictEqual(project.endYear, mockEnrichProjectTypeOther.endYear);
      assert.strictEqual(project.executorId, mockEnrichProjectTypeOther.executorId);
      assert.deepEqual(project.globalBudget, mockEnrichProjectTypeOther.globalBudget);
      assert.strictEqual(project.importFlag, mockEnrichProjectTypeOther.importFlag);
      assert.strictEqual(project.projectTypeId, mockEnrichProjectTypeOther.projectTypeId);
      const annualPeriodsLength = project.annualDistribution.annualPeriods.length;
      assert.lengthOf(mockEnrichProjectTypeOther.annualDistribution.annualPeriods, annualPeriodsLength);
      const annualPeriodsIndexes = range(0, annualPeriodsLength);
      annualPeriodsIndexes.forEach(idx => {
        assert.deepEqual(
          omit(project.annualDistribution.annualPeriods[idx], 'id'),
          omit(mockEnrichProjectTypeOther.annualDistribution.annualPeriods[idx], 'id')
        );
      });
      assert.notExists(project.geometry);
      assert.strictEqual(project.status, mockEnrichProjectTypeOther.status);
    });

    it('C55705 - Negative - Should not be able to create a project when project type is different than other without interventions', async () => {
      delete project.interventionIds;
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55709 - Negative - Should not be able to create a project when project type is other with interventions and without a geometry', async () => {
      project.projectTypeId = ProjectType.other;
      project.interventionIds = [interventionId];
      delete project.geometry;
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
    it('Negative - Should not be able to create a project when project service priority is not defined in the list of available services', async () => {
      project.interventionIds = [interventionId];
      project.servicePriorities = [
        {
          service: SERVICE_SE,
          priorityId: PriorityCode.lowPriority
        }
      ];
      const response = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(
        response.body.error.details[0].message,
        'At least one service priority is not defined in the list of available services for this project'
      );
    });
  });
  // tslint:disable-next-line: max-func-body-length
  describe('/projects/:id > PUT', () => {
    let interventionIds: string[];

    beforeEach(async () => {
      const intervention = getProjectInterventionToIntegrate();
      const docs = await Promise.all([intervention, intervention].map(i => createIntervention(i)));
      interventionIds = docs.map(x => x.id.toString());
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    it('C47254  Positive - Updates project and its interventions ', async () => {
      let project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      const postResponse = await requestService.post(apiUrl, { body: project });
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      project = postResponse.body;
      project.interventionIds = interventionIds;

      let interventionFindOptions = InterventionFindOptions.create({
        criterias: {
          id: project.interventionIds
        }
      }).getValue();
      let interventions = await interventionRepository.findAll(interventionFindOptions);
      project = projectDataGenerator.createPlainFromEnriched(postResponse.body);
      const putResponse = await requestService.put(`${apiUrl}/${postResponse.body.id}`, { body: project });
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);

      interventionFindOptions = InterventionFindOptions.create({
        criterias: {
          id: putResponse.body.interventionIds
        }
      }).getValue();
      interventions = await interventionRepository.findAll(interventionFindOptions);
      for (const intervention of interventions) {
        assert.strictEqual(get(intervention, 'project.id', undefined), postResponse.body.id);
        assert.strictEqual(intervention.status, InterventionStatus.integrated);
      }
    });
    it('C55077  Positive - Updates project shoud keep same status when object request contains status property', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      const postResponse = await projectTestClient.create(project);
      project.status = ProjectStatus.canceled;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(putResponse.body.status, postResponse.body.status);
    });
    it('C47802  Positive - An intervention was removed from project, intervention loses link to project', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds = [interventionIds[0]];
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      const doc = await interventionModel.findById(interventionIds[1]).exec();
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(get(doc, 'project.id', undefined), undefined);
    });
    it('C47803  Positive - Project geometry has been updated', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds = [interventionIds[0]];
      project.geometry.coordinates = [
        [
          [-74.0863037109375, 45.238151606298864],
          [-73.15658569335936, 45.238151606298864],
          [-73.15658569335936, 45.816357959181374],
          [-74.0863037109375, 45.816357959181374],
          [-74.0863037109375, 45.238151606298864]
        ]
      ];
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.notDeepEqual(putResponse.body.geometry.coordinates, postResponse.body.geometry.coordinates);
    });

    it('C47255  Negative - One intervention id is not valid, error thrown', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds.push('qwerty1234');
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });
    it("C47256  Negative - One intervention id doesn't exist, error thrown", async () => {
      const project: IPlainProject = getInitialPlainProject();
      const falseId = '5b0b0b0b0b0f6e1f4537459b';
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds.push(falseId);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C47257  Negative - Project id is not valid', async () => {
      const project: IPlainProject = getInitialPlainProject();
      const response = await request(testApp)
        .put(`${apiUrl}/qwerty1234`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C47258  Negative - Project id does not exist', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const response = await request(testApp)
        .put(`${apiUrl}/P99999`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C54146  Negative - One intervention is already integrated in another project, error thrown', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      await projectTestClient.create(project);
      project.interventionIds = [interventionIds[1]];
      const postResponse = await projectTestClient.create(project);
      project.interventionIds = interventionIds;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      const detail: IApiError = putResponse.body.error.details.filter(
        (x: any) => x.message === 'Intervention is already integrated in another project'
      );
      assert.isNotEmpty(detail);
      assert.strictEqual(detail.code, putResponse.body.id);
    });
    it('C47804  Negative - Validation error received when geometry has bad format', async () => {
      let project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project = getBadGeometriesProject();
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
      assert.strictEqual(putResponse.body.error.details[0].target, 'geometry');
    });
    it('C47805 Negative - One or more taxonomy codes not found in taxonomy collection, error thrown', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.executorId = 'omegalul';
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C47806  Negative - Empty project is not saved', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send({});
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });
    it("C47807  Negative - Sent data misses an attribute and doesn't match project model", async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      delete project.startYear;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send();
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C47808  Negative - List of interventions of project is empty, error thrown', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds = [];
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(
        putResponse.body.error.details[0].message,
        'Project must contain interventions to be created or updated'
      );
    });
    it("C47809  Negative - Project doesn't contain intervention geometry", async () => {
      let project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project = getSmallGeometriesProject();
      project.interventionIds = interventionIds;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(
        putResponse.body.error.details[0].message,
        'Project geometry is not containing this intervention area'
      );
    });
    it('C47810  Negative - Intervention has an earlier date than project', async () => {
      const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
      intervention.planificationYear = 1800;
      const doc = await createIntervention(intervention);
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds.push(doc.id);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
    it('C47811  Negative - Intervention has later date than project', async () => {
      const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
      intervention.planificationYear = 3000;
      const doc = await createIntervention(intervention);
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds.push(doc.id);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(
        putResponse.body.error.details[0].message,
        'Project end year must be equal or greater than latest intervention'
      );
    });
    it('C47812  Negative - One Intervention has not a valid status to be integrated in a project', async () => {
      const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
      intervention.status = InterventionStatus.canceled;
      const project: IPlainProject = getInitialPlainProject();
      const doc = await createIntervention(intervention);
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      project.interventionIds.push(doc.id);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
    it('C47813  Negative - Historique is not created because server is down, error thrown', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      const postResponse = await projectTestClient.create(project);
      sinon.stub(historyRepository, 'save').throws(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      project.interventionIds.push(interventionIds[1]);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.INTERNAL_SERVER_ERROR);
      sinon.restore();
    });
    it('Negative - Should return an error when interventions executor mismatch project executor', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      const postResponse = await projectTestClient.create(project);
      project.executorId = EXECUTOR_OTHER;
      project.status = ProjectStatus.canceled;
      const putResponse = await requestService.put(`${apiUrl}/${postResponse.body.id}`, { body: project });
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55243  Positive - Should have current username in audit lastModifiedBy field', async () => {
      const { pilot, planner } = userMocks;

      try {
        let project = getInitialProject();
        project.interventionIds = [interventionIds[0]];

        // Create project with planner
        userMocker.mock(planner);
        const postResponse = await projectTestClient.create(enrichedToPlain(project));
        assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
        project = postResponse.body;

        // Update project with pilot
        userMocker.mock(pilot);
        project.interventionIds = interventionIds;
        const projectId = project.id;
        project = enrichedToPlain(project);
        const putResponse = await putProject(projectId, project);
        assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
        project = putResponse.body;

        assert.strictEqual(project.audit.createdBy.userName, planner.userName);
        assert.strictEqual(project.audit.lastModifiedBy.userName, pilot.userName);
      } finally {
        userMocker.mock(planner);
      }
    });

    it('C60970 - Positive - Should call the compute objetives after the put', async () => {
      const spyProgramBookComputeObjectives = sandbox.spy(ProgramBook.prototype, 'computeObjectives');
      const annualProgram = await createAndSaveAnnualProgram();
      const programBook = await createAndSaveProgramBook({
        annualProgram
      });
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      const responseProject = await projectDataGenerator.store(project);
      const intervention: IEnrichedIntervention = await interventionRepository.findById(interventionIds[0]);
      await projectDataCoupler.coupleThem({
        project: responseProject,
        interventions: [intervention, intervention],
        programBooksCoupler: [{ year: annualProgram.year, programBook }]
      });
      await projectTestClient.update(responseProject.id, project);
      assert.isTrue(spyProgramBookComputeObjectives.called);
    });

    it('C60972 - Positive - Should add intervention annual periods from intervention planification year until the project end year', async () => {
      let mockProject = await projectDataGenerator.store({
        status: ProjectStatus.planned,
        startYear: appUtils.getCurrentYear(),
        endYear: appUtils.getCurrentYear() + 1
      });

      const projectIntervention = await interventionDataGenerator.store({}, mockProject);
      let partialProjectInterventionIds = { interventionIds: [projectIntervention.id] };
      mockProject = await projectDataGenerator.update(mockProject, partialProjectInterventionIds);

      const interventionToAdd = await interventionDataGenerator.store();
      partialProjectInterventionIds = { interventionIds: [projectIntervention.id, interventionToAdd.id] };

      const plainProject = projectDataGenerator.createPlain({
        ...partialProjectInterventionIds,
        startYear: appUtils.getCurrentYear(),
        endYear: appUtils.getCurrentYear() + 1
      });

      const updateResponse = await projectTestClient.update(mockProject.id, plainProject);
      assert.strictEqual(updateResponse.status, HttpStatusCodes.OK);

      const addedIntervention = await interventionRepository.findById(interventionToAdd.id);
      const addedInterventionAnnualPeriods = addedIntervention.annualDistribution.annualPeriods.map(ap => ap.year);
      assert.deepEqual(addedInterventionAnnualPeriods, [appUtils.getCurrentYear(), appUtils.getCurrentYear() + 1]);
    });

    it('Negative - Should not be able to create a project when project service priority is not defined in the list of available services', async () => {
      const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
      const doc = await createIntervention(intervention);
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds.push(doc.id);
      project.servicePriorities = [
        {
          service: SERVICE_SUM,
          priorityId: PriorityCode.lowPriority
        }
      ];
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);

      project.servicePriorities[0].service = SERVICE_SE;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(
        putResponse.body.error.details[0].message,
        'At least one service priority is not defined in the list of available services for this project'
      );
    });

    it('Positive - Should set priorityScenarios isOutdated property to true when updating project priority service', async () => {
      const annualProgram = await createAndSaveAnnualProgram();
      const programBook = await createAndSaveProgramBook({
        annualProgram
      });
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      const responseProject = await projectDataGenerator.store(project);
      const intervention: IEnrichedIntervention = await interventionRepository.findById(interventionIds[0]);
      await projectDataCoupler.coupleThem({
        project: responseProject,
        interventions: [intervention, intervention],
        programBooksCoupler: [{ year: annualProgram.year, programBook }]
      });
      const updateResponse = await projectTestClient.update(responseProject.id, project);
      assert.strictEqual(updateResponse.status, HttpStatusCodes.OK);

      const updatedProgramBook = await programBookRepository.findById(programBook.id);

      programBook.priorityScenarios.forEach(ps => assert.isFalse(ps.isOutdated));
      updatedProgramBook.priorityScenarios.forEach(ps => assert.isTrue(ps.isOutdated));
    });

    it('Positive - Should set priorityScenarios isOutdated property to true when updating project subCategories', async () => {
      const annualProgram = await createAndSaveAnnualProgram();
      const programBook = await createAndSaveProgramBook({
        annualProgram
      });
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = [interventionIds[0]];
      const responseProject = await projectDataGenerator.store(project);
      const intervention: IEnrichedIntervention = await interventionRepository.findById(interventionIds[0]);
      await projectDataCoupler.coupleThem({
        project: responseProject,
        interventions: [intervention],
        programBooksCoupler: [{ year: annualProgram.year, programBook }]
      });
      project.subCategoryIds = [ProjectSubCategory.recurrent];
      const updateResponse = await projectTestClient.update(responseProject.id, project);
      assert.strictEqual(updateResponse.status, HttpStatusCodes.OK);

      const updatedProgramBook = await programBookRepository.findById(programBook.id);

      programBook.priorityScenarios.forEach(ps => assert.isFalse(ps.isOutdated));
      updatedProgramBook.priorityScenarios.forEach(ps => assert.isTrue(ps.isOutdated));
    });
    // test project restrictions
    updateProjectRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const props = mergeProperties(getProjectProps(), test.props);
        const updateProps = mergeProperties(getProjectProps(), test.updateProps || test.props);
        const project = await createAndSaveProject(props);
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);

        const response = await requestService.put(`${apiUrl}/${project.id}`, { body: updateProps });
        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/projects/:id > GET', () => {
    let interventionIds: string[];

    beforeEach(async () => {
      const intervention = getProjectInterventionToIntegrate();
      const intervention2 = cloneDeep(intervention);
      intervention.assets[0].id = getInitialAssetId();
      const docs = await Promise.all([intervention, intervention2].map(i => createIntervention(i)));
      interventionIds = docs.map(x => x.id.toString());
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    it('C47799  Positive - expand Project is returned with its list of interventions with assets properties', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      const getResponse = await request(testApp)
        .get(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .query({ expand: 'interventions,assets' })
        .send();
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(getResponse.body.id, postResponse.body.id);
      assert.property(getResponse.body, 'interventions');
      assert.property(getResponse.body.interventions[0], 'interventionName');
      assert.property(getResponse.body.interventions[0].assets[0], 'properties');
      assert.property(getResponse.body.interventions[0].assets[0].properties, 'installationDate');
    });
    it('C47238  Positive - expand Project is returned with its list of interventions without assets properties', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      const getResponse = await requestService.get(
        `${apiUrl}/${postResponse.body.id}`,
        {},
        { expand: 'interventions' }
      );
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(getResponse.body.id, postResponse.body.id);
      assert.property(getResponse.body, 'interventions');
      assert.property(getResponse.body.interventions[0], 'interventionName');
      assert.notProperty(getResponse.body.interventions[0].assets[0], 'properties');
    });
    it('C47814  Positive - Project exists and is returned', async () => {
      const project: IPlainProject = getInitialPlainProject();
      project.interventionIds = interventionIds;
      const postResponse = await projectTestClient.create(project);
      const getResponse = await request(testApp)
        .get(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.property(getResponse.body, 'id');
      assert.strictEqual(get(getResponse.body, 'interventions', undefined), undefined);
    });
    it("C47800  Negative - Specified project id doesn't exist", async () => {
      const response = await projectTestClient.get('P12312');
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
    it('C58443	Negative - Specified project id is not valid', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/qwerty1234`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  // tslint:disable-next-line:max-func-body-length
  describe('/projects > GET', () => {
    let enrichedIntervention: IEnrichedIntervention;
    let enrichedProject: IEnrichedProject;
    beforeEach(async () => {
      const projectList = createProjectList();
      projectList[0].status = ProjectStatus.replanned;
      projectList[1].status = ProjectStatus.programmed;
      await projectModel.create(projectList);
      enrichedIntervention = await createAndSaveIntervention({ assets: [getAsset({ id: 'R145' })] });
      enrichedProject = await createAndSaveProject();
      enrichedProject.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(
        enrichedProject
      );
      await projectDataCoupler.coupleThem({
        project: enrichedProject,
        interventions: [enrichedIntervention]
      });
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    it('C52676 - Positive - Received paginated list of projects', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
    });
    it('Positive - Received paginated list of non geolocated projects', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .query({ isGeolocated: false })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(response.body.items[0].geometry, null);
    });
    it('C52678 - Positive - Received list of projects that corresponds with specified param', async () => {
      const project: IPlainProject = getInitialPlainProject();
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: project.boroughId })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      for (const item of response.body.items) {
        assert.strictEqual(item.boroughId, project.boroughId);
      }
    });
    it('C52679 - Positive - Received list of projects that corresponds with mixt params', async () => {
      const project: IPlainProject = getInitialPlainProject();
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: project.boroughId, status: project.status })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      for (const item of response.body.items) {
        assert.strictEqual(item.boroughId, project.boroughId);
        assert.strictEqual(item.status, project.status);
      }
    });
    it('C52680 - Positive - One query is passed multiple times, received a list matching one of the values', async () => {
      const projects1 = (await projectModel
        .find({
          status: ProjectStatus.programmed
        })
        .exec()) as IEnrichedProject[];
      const projects2 = (await projectModel
        .find({
          status: ProjectStatus.planned
        })
        .exec()) as IEnrichedProject[];
      const projectStatus1: IEnrichedProject = projects1[0];
      const projectStatus2: IEnrichedProject = projects2[0];
      const response = await request(testApp)
        .get(apiUrl)
        .query({ status: [projectStatus1.status, projectStatus2.status] })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.isAbove(response.body.items.length, 1);
      for (const item of response.body.items) {
        assert.oneOf(item.status, [projectStatus1.status, projectStatus2.status]);
      }
    });
    it('C52681 - Positive - If param "limit" is specified and more than 0 then returns a limited list of interventions', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .query({ limit: 2 })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.limit, 2);
      assert.lengthOf(response.body.items, 2);
    });
    it('C52682 - Positive - If param "offset" is specified and more than 0 then returns a list begining at that offset', async () => {
      const responseNoOffset = await request(testApp)
        .get(apiUrl)
        .query({ offset: 0 })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      const responseWithOffset = await request(testApp)
        .get(apiUrl)
        .query({ offset: 1 })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(responseWithOffset.status, HttpStatusCodes.OK);
      assert.strictEqual(responseWithOffset.body.items[0].id, responseNoOffset.body.items[1].id);
    });
    it('C52684 - Negative - Specified param is not an attribute of project returns entire list', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .query({ qwerty: '1234' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C52685 - Negative - Value of specified param is not an existing value in project, returns empty list', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: 'GHOST' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.deepEqual(response.body.items, []);
    });
    it("C52686 - Negative - If one param is an existing attribute of project and another that isn't, returns list matching only existing param", async () => {
      const project: IPlainProject = getInitialPlainProject();
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: project.boroughId, qwerty: '1234' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C52687 - Positive - Should get only interventions intersecting a viewport', async () => {
      const projectInside = getProjectInsideViewport();
      const projectOutside = getProjectOutsideViewport();
      await projectModel.create([projectInside, projectOutside]);
      const response = await request(testApp)
        .get(apiUrl)
        .query({
          bbox: '-73.673892,45.522706,-73.670137,45.524840'
        })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, 1);
      assert.notInclude(response.body.items, projectOutside);
    });
    it('C52688 - Negative - Should have status 400 when viewport is invalid', async () => {
      const response = await request(testApp)
        .post(apiUrl)
        .query({ geometry: 'test' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C55557 - Positive - Should return paginated projects which ids correspond the sent search parameter', async () => {
      const projectsResponse = await requestService.get(apiUrl, {});
      const response = await requestService.get(apiUrl, {}, { q: projectsResponse.body.items[0].id });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
      assert.strictEqual(response.body.items.length, 1);
      assert.strictEqual(response.body.items[0].id, projectsResponse.body.items[0].id);
    });
    it('C55558 - Positive - Should return paginated projects which labels correspond the the sent search parameter', async () => {
      const response = await requestService.get(apiUrl, {}, { q: 'st libell' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
      assert.strictEqual(response.body.items.length, 1);
      assert.strictEqual(response.body.items[0].projectName, 'test libellé');
    });
    it('Positive - Should return paginated projects which drmNumber corresponds to the sent search parameter', async () => {
      const response = await requestService.get(apiUrl, {}, { q: '500' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
      const projects: IEnrichedProject[] = response.body.items;
      assert.strictEqual(projects.length, 1);
      assert.isTrue(projects[0].drmNumber.toString().indexOf('500') >= 0);
    });
    it('Positive - Should return paginated projects which submissionNumber corresponds to the sent search parameter', async () => {
      const response = await requestService.get(apiUrl, {}, { q: '12345' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
      const projects: IEnrichedProject[] = response.body.items;
      assert.strictEqual(projects.length, 1);
      assert.isTrue(projects[0].submissionNumber.indexOf('12345') >= 0);
    });
    it('C55559 - Positive - Should return empty paginated projects if no projects correspond to the sent search parameter', async () => {
      const response = await requestService.get(apiUrl, {}, { q: 'testestestestest random value' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
      assert.strictEqual(response.body.items.length, 0);
    });
    it('C55560 - Positive - Should return projects containing the search parameter in the id and the label', async () => {
      const projectsResponse = await requestService.get(apiUrl, {});
      const project1: IEnrichedProject = projectsResponse.body.items[0];
      const project2: IEnrichedProject = projectsResponse.body.items[1];
      project1.projectName = project2.id;
      await projectModel.create(project1);
      const response = await requestService.get(apiUrl, {}, { q: project2.id, orderBy: 'id' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
      assert.strictEqual(response.body.items.length, 2);
      assert.strictEqual(response.body.items[0].id, project2.id);
      assert.strictEqual(response.body.items[1].projectName, project2.id);
    });
    it('C55564 - Positive - Should return paginated projects even if the case is not the same', async () => {
      const response = await requestService.get(apiUrl, {}, { q: 'TesT LIbeLLé' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
      assert.strictEqual(response.body.items.length, 1);
      assert.strictEqual(response.body.items[0].projectName, 'test libellé');
    });
    it('C55583 - Negative - Should return invalid parameter error if the search parameter is more than 100 characters', async () => {
      const longResearchParameter =
        'dwadwadwadwadwadwadadwadwadwadwadwadwadadwadwadwadwadwadwadadwadwadwadwadwadwadadwadwadwadwadwadwadaa';
      const response = await requestService.get(apiUrl, {}, { q: longResearchParameter });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C52584 - Positive - Should get projects and interventions with related assets', async () => {
      const response = await requestService.get(apiUrl, {}, { expand: 'interventions,assets' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const resultEnrichedProject = (response.body.items as IEnrichedProject[]).find(item => item.interventions.length);
      // only one intervention and one asset.
      assert.property(resultEnrichedProject.interventions.shift().assets.shift(), 'properties');
    });
    it('C52585 - Positive - Should get projects and interventions without related assets', async () => {
      const response = await requestService.get(apiUrl, {}, { expand: 'interventions' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const resultEnrichedProject = (response.body.items as IEnrichedProject[]).find(item => item.interventions.length);
      // only one intervention and one asset.
      assert.notProperty(resultEnrichedProject.interventions.shift().assets.shift(), 'properties');
    });
    it('C52586 - Negative -  Should get projects without neither interventions nor assets', async () => {
      const response = await requestService.get(apiUrl, {}, { expand: 'assets' });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const resultEnrichedProject = (response.body.items as IEnrichedProject[]).find(
        item => item.interventions?.length
      );
      assert.isUndefined(resultEnrichedProject);
    });
  });

  describe('/projects > GET (projection)', () => {
    before(async () => {
      await projectModel.create(getInitialProject());
    });
    after(async () => {
      await destroyDBTests();
    });
    [
      {
        fields: ['startYear']
      },
      {
        fields: ['endYear']
      },
      {
        fields: ['geometry']
      },
      {
        fields: ['geometryPin']
      },
      {
        fields: ['projectName']
      },
      {
        fields: ['interventionIds']
      },
      {
        fields: ['startYear', 'endYear', 'geometry', 'geometryPin', 'projectName', 'interventionIds']
      }
    ].forEach(test => {
      it(`should only return the id and these properties : [${test.fields.join(',')}]`, async () => {
        const response = await requestService.get(apiUrl, null, { fields: test.fields.join(',') });
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const project: IEnrichedProject = response.body.items[0];
        assert.exists(project.id);
        test.fields.forEach(field => {
          assert.exists(project[field], `${field} not found`);
        });
        assert.lengthOf(Object.keys(project), test.fields.length + 2);
      });
    });
  });

  describe('/projects/:id/comments/:idComment > DELETE', () => {
    let mockProject: IEnrichedProject;
    let mockIntervention: IEnrichedIntervention;
    const mockId = 'P99999';
    beforeEach(async () => {
      mockIntervention = await createIntervention(getCompleteEnrichedIntervention());
    });
    afterEach(async () => {
      await destroyDBTests();
    });

    it(`C54682 - Positive - Should have 204 status on comment suppresion`, async () => {
      mockProject = getEnrichedCompleteProject();
      mockProject.interventionIds = [mockIntervention.id];
      const docs = await projectModel.create([mockProject]);
      mockProject = docs[0] as IEnrichedProject;

      const response = await request(testApp)
        .delete(`${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();

      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      // it was two requirements before delete
      const updatedProject = await projectRepository.findById(mockProject.id);
      assert.strictEqual(updatedProject.comments.length, 1);
    });

    it(`C54683 - Positive - Should have a new entry in historical log after deletion`, async () => {
      mockProject = getEnrichedCompleteProject();
      mockProject.interventionIds = [mockIntervention.id];
      const docs = await projectModel.create([mockProject]);
      mockProject = docs[0] as IEnrichedProject;
      const response = await request(testApp)
        .delete(`${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      const historyEntity: IHistory[] = await historyModel
        .find({
          referenceId: mockProject.id,
          categoryId: constants.historyCategoryId.COMMENT
        })
        .exec();

      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const updatedProject = await projectRepository.findById(mockProject.id);
      assert.strictEqual(updatedProject.comments.length, 1);
      assert.strictEqual(historyEntity.length, 1);
    });

    it(`C54684 - Negative - Should return an error object with a 404 if project doesn't exist`, async () => {
      const response = await request(testApp)
        .delete(`${apiUrl}/${mockId}/comments/${NOT_FOUND_UUID}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it(`C65201 - Positive - Should delete comment from the project`, async () => {
      try {
        userMocker.mock(userMocks.executor);
        mockProject = getEnrichedCompleteProject();
        mockProject.interventionIds = [mockIntervention.id];
        const docs = await projectModel.create([mockProject]);
        mockProject = docs[0] as IEnrichedProject;

        let updatedProject = await projectRepository.findById(mockProject.id);
        assert.strictEqual(updatedProject.comments.length, 1);

        const response = await requestService.delete(
          `${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`
        );

        assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
        updatedProject = await projectRepository.findById(mockProject.id);
        assert.strictEqual(updatedProject.comments.length, 0);
      } finally {
        userMocker.mock(userMocks.planner);
      }
    });

    it(`C54700 - Positive - Should delete the last comment`, async () => {
      const comments: Comment[] = [getComment()];
      const project = await createAndSaveProject({ comments });
      const response = await request(testApp)
        .delete(`${apiUrl}/${project.id}/comments/${project.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const updatedProject = await projectRepository.findById(project.id);
      assert.strictEqual(updatedProject.comments.length, 0);
    });
  });

  describe('/projects/:id/comments > POST', () => {
    let mockProject: IEnrichedProject;
    let mockResult: IEnrichedProject;
    let mockIntervention: IEnrichedIntervention;

    beforeEach(async () => {
      mockIntervention = await createIntervention(createInterventionModel({ status: InterventionStatus.integrated }));
      mockResult = createEnrichedProject(getEnrichedCompleteProject());
      mockResult.interventionIds = [mockIntervention.id];
      const docs = await projectModel.create([mockResult]);
      mockProject = docs[0] as IEnrichedProject;
    });
    afterEach(async () => {
      await projectModel.deleteMany({ id: mockProject.id }).exec();
    });
    it(`C54685 - Positive - Should have 201 status on comment creation`, async () => {
      const comment = getPlainCommentProps();
      const response = await request(testApp)
        .post(`${apiUrl}/${mockProject.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const updatedProject = await projectRepository.findById(mockProject.id);
      const lastCommentIndex = updatedProject.comments.length - 1;
      assert.strictEqual(updatedProject.comments[lastCommentIndex].categoryId, comment.categoryId);
      assert.strictEqual(updatedProject.comments[lastCommentIndex].isPublic, comment.isPublic);
      assert.strictEqual(updatedProject.comments[lastCommentIndex].text, comment.text);
    });
    it(`C54686 - Positive - Should save a modification in history`, async () => {
      const comment = getPlainCommentProps();
      await request(testApp)
        .post(`${apiUrl}/${mockProject.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      const response = await request(testApp)
        .get(`${apiUrl}/${mockProject.id}/history`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.exists(response.body);
    });
    it(`C54687 - Negative - Should return an error object with 400 status if no categoryId`, async () => {
      const comment = getPlainCommentProps({
        categoryId: undefined
      });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockProject.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
    it(`C54688 - Negative - Should return an error object with 400 status if no text`, async () => {
      const comment = getPlainCommentProps({
        text: undefined
      });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockProject.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
    it(`C54689 - Negative - Should return an error object with 404 status with an invalid verb`, async () => {
      const comment = getPlainCommentProps();
      const response = await request(testApp)
        .patch(`${apiUrl}/${mockProject.id}/commentsa`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it(`C54690 - Negative - Should return an error object with a 400 status if an unacceptable categoryId taxonomy is sent`, async () => {
      const comment = getPlainCommentProps({
        categoryId: 'categoryId'
      });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockProject.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`C65202 - Negative - Should return error 403 when user dont have permission PROJECT:COMMENT:WRITE:PRIVATE and status isPublic = false`, async () => {
      try {
        const comment = getPlainCommentProps();
        comment.isPublic = false;
        userMocker.mock(userMocks.executor);
        const response = await requestService.post(`${apiUrl}/${mockProject.id}/comments`, { body: comment });
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      } finally {
        userMocker.mock(userMocks.planner);
      }
    });
  });

  describe('/projects/:id/comments/:idComment > PUT', () => {
    let mockProject: IEnrichedProject;
    let mockResult: IEnrichedProject;
    let mockIntervention: IEnrichedIntervention;
    let comment: IPlainCommentProps;
    beforeEach(async () => {
      comment = getPlainCommentProps();
      mockIntervention = await createIntervention(createInterventionModel({ status: InterventionStatus.integrated }));
      mockResult = createEnrichedProject(getEnrichedCompleteProject());
      mockResult.interventionIds = [mockIntervention.id];
      const docs = await projectModel.create([mockResult]);
      mockProject = docs[0] as IEnrichedProject;
    });

    afterEach(async () => {
      await projectModel.deleteMany({ id: mockProject.id }).exec();
    });

    it(`C54692 - Positive - Should update a comment and have a 200 status`, async () => {
      comment.text = 'other';
      const response = await request(testApp)
        .put(`${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });
    it(`C54693 - Positive - Should save updated comment in history`, async () => {
      await request(testApp)
        .put(`${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      const response = await request(testApp)
        .get(`${apiUrl}/${mockProject.id}/history`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.exists(response.body);
    });
    it(`C54694 - Negative - Should return an error object with a 400 status if an unacceptable categoryId taxonomy is sent`, async () => {
      comment.categoryId = 'categoryId';
      const response = await request(testApp)
        .put(`${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
    it(`C54695 - Negative - Should return an error object with a 400 status if no body is sent`, async () => {
      comment = {} as IPlainCommentProps;
      const response = await request(testApp)
        .put(`${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
    it(`C54696 - Negative - Should return an error object with a 400 status if invalid body is sent`, async () => {
      const params = { noGoodArg: 'noGoodArg' };
      const response = await request(testApp)
        .put(`${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(params);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`C65203 - Negative - Should return error 403 when user dont have permission PROJECT:COMMENT:WRITE:PRIVATE and comment status isPublic = false`, async () => {
      try {
        comment = {} as IPlainCommentProps;
        comment.isPublic = false;
        comment.text = 'other';
        comment.categoryId = 'conception';
        userMocker.mock(userMocks.executor);
        const response = await requestService.put(
          `${apiUrl}/${mockProject.id}/comments/${mockProject.comments[0].id}`,
          { body: comment }
        );

        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      } finally {
        userMocker.mock(userMocks.planner);
      }
    });
  });

  describe('/projects/:id?expand=programBook&expand=annualProgram > GET', () => {
    let mockIntervention: IEnrichedIntervention;
    let programBookModel: ProgramBookModel;
    let mockProjects: IEnrichedProject[];
    let mockAnnualProgram: AnnualProgram;
    let mockProgramBook: ProgramBook;
    let projectAnnualProgramUrl: string;
    beforeEach(async () => {
      programBookModel = db().models.ProgramBook;

      mockIntervention = await createIntervention(createInterventionModel({ status: InterventionStatus.integrated }));
      mockAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      mockProgramBook = await createAndSaveProgramBook({
        annualProgram: mockAnnualProgram
      });
    });
    afterEach(async () => {
      await destroyDBTests();
    });

    it(`C55552 - Positive - Should return annual program and program book of a programmed project`, async () => {
      mockProjects = [
        await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          startYear: mockAnnualProgram.year,
          interventionIds: [mockIntervention.id],
          status: ProjectStatus.programmed
        })
      ];

      projectAnnualProgramUrl = `${apiUrl}/${mockProjects[0].id}?expand=${ProjectExpand.programBook},${ProjectExpand.annualProgram}`;
      const response = await requestService.get(projectAnnualProgramUrl, {});
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.status, ProjectStatus.programmed);
      const enrichedAnnualProgram = removeEmpty(await annualProgramMapperDTO.getFromModel(mockAnnualProgram));
      const enrichedProgramBook = removeEmpty(await programBookMapperDTO.getFromModel(mockProgramBook));
      // TODO reactivate full compairson when project as domain model
      assert.strictEqual(
        response.body.annualDistribution.annualPeriods[0].programBook.annualProgram.id,
        enrichedAnnualProgram.id
      );
      assert.deepInclude(response.body.annualDistribution.annualPeriods[0].programBook.id, enrichedProgramBook.id);
      // assert.deepInclude(
      //   response.body.annualDistribution.annualPeriods[0].programBook.annualProgram,
      //   enrichedAnnualProgram
      // );
      // assert.deepInclude(response.body.annualDistribution.annualPeriods[0].programBook, enrichedProgramBook);
    });

    it(`C55553 - Negative - Should not return a program book and annual program if project has different status from ${ProjectStatus.programmed}`, async () => {
      const mockProject = await createMockProject({
        startYear: mockAnnualProgram.year,
        interventionIds: [mockIntervention.id],
        status: ProjectStatus.planned
      });
      mockProjects = [mockProject];
      projectAnnualProgramUrl = `${apiUrl}/${mockProjects[0].id}?expand=programBook&expand=annualProgram`;
      const response = await requestService.get(projectAnnualProgramUrl, {});
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isUndefined(response.body.annualProgram);
      assert.isUndefined(response.body.programBook);
    });

    it(`C55554 - Negative - Should return empty annual program and empty program book`, async () => {
      mockProjects = [
        await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          startYear: mockAnnualProgram.year,
          interventionIds: [mockIntervention.id],
          status: ProjectStatus.programmed
        })
      ];
      await programBookModel.deleteMany({}).exec();
      await annualProgramModel.deleteMany({}).exec();
      projectAnnualProgramUrl = `${apiUrl}/${mockProjects[0].id}?expand=programBook&expand=annualProgram`;
      const response = await requestService.get(projectAnnualProgramUrl, {});
      assert.isUndefined(response.body.annualProgram);
      assert.isUndefined(response.body.programBook);
    });

    it(`C55555 - Negative - Should return an empty program book`, async () => {
      mockProjects = [
        await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          startYear: mockAnnualProgram.year,
          interventionIds: [mockIntervention.id],
          status: ProjectStatus.programmed
        })
      ];
      await programBookModel.deleteMany({}).exec();
      projectAnnualProgramUrl = `${apiUrl}/${mockProjects[0].id}?expand=programBook`;
      const response = await requestService.get(projectAnnualProgramUrl, {});
      assert.isUndefined(response.body.programBook);
    });

    it(`C55556 - Negative - Should return invalid input if expand param is invalid`, async () => {
      mockProjects = [
        await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
          startYear: mockAnnualProgram.year,
          interventionIds: [mockIntervention.id],
          status: ProjectStatus.programmed
        })
      ];
      projectAnnualProgramUrl = `${apiUrl}/${mockProjects[0].id}?expand=badExpand`;
      const response = await requestService.get(projectAnnualProgramUrl, {});
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/projects/:id/annualDistribution > PUT', () => {
    let mockProject1: IEnrichedProject;
    let mockResult: IEnrichedProject;
    let mockNonGeolocatedResult: IEnrichedProject;
    let mockNonGeolocatedProject: IEnrichedProject;
    beforeEach(async () => {
      mockResult = createEnrichedProject();
      mockNonGeolocatedResult = createNonGeolocatedProject({ projectTypeId: ProjectType.other });
      const docs = await projectModel.create([mockResult, mockNonGeolocatedResult]);
      mockProject1 = docs[0] as IEnrichedProject;
      mockNonGeolocatedProject = docs[1] as IEnrichedProject;
    });
    afterEach(async () => {
      await projectModel.deleteMany({ id: mockProject1.id }).exec();
    });

    it(`C64845 - Positive - Should update the note of an annual budget of a non-geolocated project`, async () => {
      const totalAnnualBudgetNote = '123';
      const plainProjectAnnualDistribution: IPlainProjectAnnualDistribution = {
        annualProjectDistributionSummary: { totalAnnualBudgetNote }
      };

      const putResponse = await request(testApp)
        .put(`${apiUrl}/${mockNonGeolocatedProject.id}/annualDistribution`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(plainProjectAnnualDistribution);

      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(
        putResponse.body.annualDistribution.distributionSummary.totalAnnualBudget.note,
        totalAnnualBudgetNote
      );
    });

    it(`C65022 - Positive - Should update the accountId and amount of an additional cost`, async () => {
      const accountId = 123;
      const amount = 123;
      const plainProjectAnnualDistribution: IPlainProjectAnnualDistribution = {
        annualPeriods: [
          {
            year: mockProject1.startYear,
            additionalCosts: [
              {
                type: 'contingency',
                accountId,
                amount
              }
            ]
          }
        ]
      };

      const putResponse = await request(testApp)
        .put(`${apiUrl}/${mockProject1.id}/annualDistribution`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(plainProjectAnnualDistribution);

      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      const updatedAnnualPeriod: IEnrichedProjectAnnualPeriod = putResponse.body.annualDistribution.annualPeriods.find(
        (period: IEnrichedProjectAnnualPeriod) => period.year === mockProject1.startYear
      );
      const contingencyAdditionalCost = updatedAnnualPeriod.additionalCosts.find(ac => ac.type === 'contingency');
      assert.strictEqual(contingencyAdditionalCost.accountId, accountId);
      assert.strictEqual(contingencyAdditionalCost.amount, amount);
    });

    it(`C65023 - Positive - Should update the accountId and amount to 0 of an additional cost`, async () => {
      const accountId = 0;
      const amount = 0;
      const plainProjectAnnualDistribution: IPlainProjectAnnualDistribution = {
        annualPeriods: [
          {
            year: mockProject1.startYear,
            additionalCosts: [
              {
                type: 'contingency',
                accountId,
                amount
              }
            ]
          }
        ]
      };

      const putResponse = await request(testApp)
        .put(`${apiUrl}/${mockProject1.id}/annualDistribution`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(plainProjectAnnualDistribution);

      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      const updatedAnnualPeriod: IEnrichedProjectAnnualPeriod = putResponse.body.annualDistribution.annualPeriods.find(
        (period: IEnrichedProjectAnnualPeriod) => period.year === mockProject1.startYear
      );
      const contingencyAdditionalCost = updatedAnnualPeriod.additionalCosts.find(ac => ac.type === 'contingency');
      assert.strictEqual(contingencyAdditionalCost.accountId, accountId);
      assert.strictEqual(contingencyAdditionalCost.amount, amount);
    });

    it(`C65024 - Positive - Should update the note of an additional cost`, async () => {
      const note = '123';
      const plainProjectAnnualDistribution: IPlainProjectAnnualDistribution = {
        annualProjectDistributionSummary: { additionalCostsNotes: [{ type: 'contingency', note }] }
      };

      const putResponse = await request(testApp)
        .put(`${apiUrl}/${mockProject1.id}/annualDistribution`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(plainProjectAnnualDistribution);

      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      const updatedSummary: IAdditionalCostsTotalAmount = putResponse.body.annualDistribution.distributionSummary.additionalCostTotals.find(
        (a: IAdditionalCostsTotalAmount) => a.type === 'contingency'
      );
      assert.strictEqual(updatedSummary.note, note);
    });

    it(`C64846 - Negative - Should not update the note of an annual budget of a geolocated project`, async () => {
      const totalAnnualBudgetNote = '123';
      const plainProjectAnnualDistribution: IPlainProjectAnnualDistribution = {
        annualProjectDistributionSummary: { totalAnnualBudgetNote }
      };

      const putResponse = await request(testApp)
        .put(`${apiUrl}/${mockProject1.id}/annualDistribution`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(plainProjectAnnualDistribution);
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.notEqual(
        putResponse.body.annualDistribution.distributionSummary.totalAnnualBudget.note,
        totalAnnualBudgetNote
      );
    });
    // test project restrictions
    projectRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const props = mergeProperties({}, test.props);
        const project = await createAndSaveProject(props);

        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);

        const response = await requestService.put(`${apiUrl}/${project.id}/annualDistribution`, {
          body: project.annualDistribution
        });
        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });
});

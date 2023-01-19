import * as turf from '@turf/turf';
import {
  IApiError,
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  IInterventionDecision,
  InterventionDecisionType,
  InterventionStatus,
  MedalType,
  ProjectDecisionType,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { Express } from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import {
  createEnrichedInterventionModel,
  getDecisionMock
} from '../../../scripts/load_data/outils/interventionDataOutils';
import { createDefaultApp } from '../../../src/core/app';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { getRoadSections } from '../../../src/features/asset/tests/assetTestHelper';
import { db } from '../../../src/features/database/DB';
import { InterventionModel } from '../../../src/features/interventions/mongo/interventionModel';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import {
  createAndSaveIntervention,
  createIntervention,
  interventionRestrictionsData
} from '../../../src/features/interventions/tests/interventionTestHelper';
import { ESTIMATE_PRECISION } from '../../../src/features/interventions/validators/interventionValidator';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { assetService } from '../../../src/services/assetService';
import { spatialAnalysisService } from '../../../src/services/spatialAnalysisService';
import { ErrorCode } from '../../../src/shared/domainErrors/errorCode';
import { assertRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { appUtils } from '../../../src/utils/utils';
import { projectDataCoupler } from '../../data/dataCouplers/projectDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { getPolygon } from '../../data/importData';
import { getInterventionAreaGeometry } from '../../data/interventionData';
import { getInitialProject } from '../../data/projectData';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { interventionDecisionTestClient } from '../../utils/testClients/interventionDecisionTestClient';
import { interventionTestClient } from '../../utils/testClients/interventionTestClient';
import { mergeProperties } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe('Intervention controller', () => {
  let testApp: Express;
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  let interventionModel: InterventionModel;

  before(async () => {
    testApp = await createDefaultApp();
    interventionModel = db().models.Intervention;
    // Stubbing this method because it calls extern services
    const mockRoadSections = getRoadSections();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
  });

  after(async () => {
    sinon.restore(); // global défault sandbox
    await integrationAfter();
  });

  function setupStubs() {
    spatialAnalysisServiceStub.init(sandbox);
  }

  beforeEach(() => {
    setupStubs();
  });

  afterEach(() => {
    sandbox.restore(); // local sandbox
  });

  describe('/interventions/:id/decisions > POST', () => {
    let mockIntervention: IEnrichedIntervention;
    let mockInterventionReceived: IEnrichedIntervention;
    let mockResult: IEnrichedIntervention;
    let mockResultReceived: IEnrichedIntervention;
    beforeEach(async () => {
      mockResultReceived = createEnrichedInterventionModel({ status: InterventionStatus.waiting });
      mockInterventionReceived = await createIntervention(mockResultReceived);

      const project = await projectDataGenerator.store({
        status: ProjectStatus.planned,
        endYear: appUtils.getCurrentYear() + 8
      });
      mockResult = createEnrichedInterventionModel({ status: InterventionStatus.waiting });
      mockIntervention = await interventionDataGenerator.store(mockResult, project);

      mockIntervention.annualDistribution.annualPeriods = mockIntervention.annualDistribution.annualPeriods.map(
        (annualPeriod, index) => {
          annualPeriod.annualAllowance = 10 * (index + 1);
          return annualPeriod;
        }
      );
      const annualProgram = await createAndSaveAnnualProgram({ year: mockIntervention.planificationYear });
      const programBook = await createAndSaveProgramBook({ annualProgram });
      await projectDataCoupler.coupleThem({
        project,
        interventions: [mockIntervention],
        programBooksCoupler: [{ year: mockIntervention.planificationYear, programBook }]
      });
    });

    afterEach(async () => {
      await interventionModel.deleteMany({}).exec();
    });

    it(`C53715 - Positive - Should have 201 status on decision creation`, async () => {
      const targetYear = appUtils.getCurrentYear();
      const bodyReq = getDecisionMock();
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      delete response.body.decisions[0].id;
      delete response.body.decisions[0].audit;
      delete bodyReq.id;
      delete bodyReq.audit;

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.deepEqual(response.body.decisions[0], bodyReq);
      assert.equal(response.body.planificationYear, targetYear);
    });

    interventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const props = mergeProperties({}, test.props);
        const createdIntervention = await createAndSaveIntervention(props);
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        const bodyReq = getDecisionMock();
        const response = await requestService.post(`${apiUrl}/${createdIntervention.id}/decisions`, {
          body: bodyReq
        });

        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });

    it(`C53716 - Positive - should add cancel decision to project when last intervention is cancelled`, async () => {
      const project = mockIntervention.project;
      const bodyReq = getDecisionMock({ typeId: InterventionDecisionType.canceled });
      await requestService.post(`${apiUrl}/${mockIntervention.id}/decisions`, { body: bodyReq });
      const newProject: IEnrichedProject = await projectRepository.findById(project.id);
      const newIntervention: IEnrichedIntervention = await interventionRepository.findById(mockIntervention.id);
      assert.isTrue(newProject.decisions.some(el => el.typeId === ProjectDecisionType.canceled));
      assert.isTrue(newIntervention.decisions.some(el => el.typeId === ProjectDecisionType.canceled));
      assert.isNull(newIntervention.project);
      assert.equal(newIntervention.status, InterventionStatus.canceled);
      assert.equal(newProject.status, ProjectDecisionType.canceled);
      assert.isTrue(newProject.interventionIds.filter(el => el === newIntervention.id).length === 0);
    });

    it(`C53721 - Positive - Should save a modification in history`, async () => {
      const bodyReq = getDecisionMock();
      await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      const response = await request(testApp)
        .get(`${apiUrl}/${mockIntervention.id}/history`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.exists(response.body);
    });

    it('C60966 - Positive - Should call the calculate objectives achievements after the decision creation', async () => {
      const bodyReq = getDecisionMock();
      await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
    });

    it(`C53716 - Negative - Should return an error object with 400 status if no typeId`, async () => {
      const bodyReq = getDecisionMock();
      delete bodyReq.typeId;
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`C53717 - Negative - Should return an error object with 400 status if no comment`, async () => {
      const bodyReq = getDecisionMock();
      delete bodyReq.text;
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`C53720 - Negative - Should return an error object with 405 status with an invalid verb`, async () => {
      const bodyReq = getDecisionMock();
      const response = await request(testApp)
        .patch(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      assert.strictEqual(response.status, HttpStatusCodes.METHOD_NOT_ALLOWED);
    });

    it(`C53722 - Negative - Should return an error object with a 400 status if an unacceptable typeId taxonomy is sent`, async () => {
      const bodyReq = getDecisionMock();
      const params = Object.assign(bodyReq, { typeId: 'typeId' });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(params);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`Negative - Should return an error when the precision of the intervention's estimate properties are more than ${ESTIMATE_PRECISION} digits`, async () => {
      const bodyReq = getDecisionMock();
      mockIntervention.estimate = { allowance: 10.4657, burnedDown: 0.4566, balance: 0.4765 };
      await interventionRepository.saveBulk([mockIntervention], { upsert: true });
      const response = await requestService.post(`${apiUrl}/${mockIntervention.id}/decisions`, { body: bodyReq });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      const error: IApiError = response.body.error;
      assert.exists(error);
      const estimateKeys = Object.keys(mockIntervention.estimate);
      error.details.forEach((detail, idx) => {
        assert.strictEqual(detail.code, ErrorCode.INVALID);
        assert.strictEqual(detail.message, `${ESTIMATE_PRECISION} digits maximum after the point`);
        assert.exists(detail.target, `estimate.${estimateKeys[idx]}`);
      });
    });

    it(`C54218 - Positive - Should change the status of the intervention on sending a revision and set decisionRequired flag to true`, async () => {
      let bodyReq = getDecisionMock();
      bodyReq.typeId = InterventionDecisionType.refused;
      bodyReq.refusalReasonId = 'plannedIntegrated';
      await interventionDecisionTestClient.create(mockInterventionReceived.id, bodyReq);
      bodyReq.typeId = InterventionDecisionType.revisionRequest;
      delete bodyReq.refusalReasonId;
      const response = await interventionDecisionTestClient.create(mockInterventionReceived.id, bodyReq);
      response.body.decisions[0] = _.omit(response.body.decisions[0], ['id', 'audit']);
      response.body.decisions[1] = _.omit(response.body.decisions[1], ['id', 'audit']);
      bodyReq = _.omit(bodyReq, ['id', 'audit']);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.deepEqual(response.body.decisions[0], bodyReq);
      assert.equal(response.body.status, InterventionStatus.waiting);
      assert.equal(response.body.decisionRequired, true);
    });

    it(`C54220 - Negative - Should throw error when making a revision when the last decision is not refused`, async () => {
      const bodyReq = getDecisionMock();
      bodyReq.typeId = InterventionDecisionType.revisionRequest;
      const response = await interventionDecisionTestClient.create(mockIntervention.id, bodyReq);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.strictEqual(response.body.decisions, undefined);
    });

    it(`C54241 - Negative - Should return an error object with 400 status if no refusalReasonId`, async () => {
      const bodyReq = getDecisionMock();
      bodyReq.typeId = InterventionStatus.refused;
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`C54242 - Negative - Should return an error object with 400 status if unacceptable refusalReasonId taxonomy is sent`, async () => {
      const bodyReq = getDecisionMock();
      bodyReq.typeId = InterventionStatus.refused;
      Object.assign(bodyReq, { refusalReasonId: 'pcq' });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`C54243 - Positive - Should return a 201 status if acceptable refusalReasonId taxonomy is sent`, async () => {
      const bodyReq = getDecisionMock();
      bodyReq.typeId = InterventionStatus.refused;
      Object.assign(bodyReq, { refusalReasonId: 'mobility' });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockInterventionReceived.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
    });

    it(`C60811 Positive - Should create a decision and return the previousPlanificationYear matching intervention planificationYear`, async () => {
      const bodyReq = getDecisionMock();
      bodyReq.typeId = InterventionDecisionType.canceled;
      bodyReq.refusalReasonId = 'plannedIntegrated';

      const res = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);

      assert.strictEqual(res.status, HttpStatusCodes.CREATED);
      assert.property(res.body, 'decisions');
      assert.property(res.body.decisions[0], 'previousPlanificationYear');
      assert.equal(res.body.decisions[0].previousPlanificationYear, mockIntervention.planificationYear);
    });

    it(`C60812 Positive - Should create a decision and return the previousPlanificationYear matching previous decision targetYear`, async () => {
      const bodyFirstDecision = getDecisionMock({ targetYear: appUtils.getCurrentYear() + 1 });
      bodyFirstDecision.typeId = InterventionDecisionType.accepted;
      bodyFirstDecision.refusalReasonId = 'plannedIntegrated';
      const firstResponse = await interventionDecisionTestClient.create(mockIntervention.id, bodyFirstDecision);
      const bodySecondDecision = getDecisionMock({ targetYear: appUtils.getCurrentYear() + 2 });
      bodySecondDecision.typeId = InterventionDecisionType.canceled;
      bodySecondDecision.refusalReasonId = 'plannedIntegrated';
      const secondResponse = await interventionDecisionTestClient.create(mockIntervention.id, bodySecondDecision);

      const currentDecision = secondResponse.body.decisions[0];
      assert.strictEqual(firstResponse.status, HttpStatusCodes.CREATED);

      assert.strictEqual(secondResponse.status, HttpStatusCodes.CREATED);
      assert.equal(secondResponse.body.decisions.length, 2);
      assert.equal(currentDecision.previousPlanificationYear, bodyFirstDecision.targetYear);
    });

    it(`C64856 - Positive - Should not update project and intervention annual periods if the plannification year is changed`, async () => {
      const targetYear = appUtils.getCurrentYear();
      const decision = getDecisionMock({ targetYear });
      decision.typeId = InterventionDecisionType.canceled;
      const response = await interventionDecisionTestClient.create(mockIntervention.id, decision);
      const intervention: IEnrichedIntervention = response.body;
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(intervention.planificationYear, targetYear);
      assert.deepEqual(intervention.annualDistribution, mockIntervention.annualDistribution);
    });

    describe('cancellations', () => {
      let intervention: IEnrichedIntervention;
      let intervention2: IEnrichedIntervention;
      let project: IEnrichedProject;
      const projectGeometry: IGeometry = getPolygon();
      let canceledDecision: IInterventionDecision;

      beforeEach(async () => {
        project = getInitialProject();
        project.status = ProjectStatus.planned;
        project.geometry = projectGeometry;
        project.medalId = MedalType.silver;
        project = (await projectRepository.save(project)).getValue();

        const geometry = getInterventionAreaGeometry();
        intervention = await interventionDataGenerator.store(
          {
            interventionArea: { geometry, geometryPin: spatialAnalysisService.middlePoint(geometry as turf.Polygon) },
            medalId: MedalType.silver,
            status: InterventionStatus.integrated
          },
          project
        );
        intervention2 = await interventionDataGenerator.store(
          {
            interventionArea: { geometry, geometryPin: spatialAnalysisService.middlePoint(geometry as turf.Polygon) },
            medalId: MedalType.bronze,
            status: InterventionStatus.integrated
          },
          project
        );

        project.interventionIds = [intervention.id, intervention2.id];
        project.interventions = [intervention, intervention2];
        project = (await projectRepository.save(project)).getValue();
        canceledDecision = getDecisionMock();
        canceledDecision.typeId = 'canceled';
      });

      it('C55415  Positive - Should remove intervention from project when canceling intervention', async () => {
        const response = await interventionTestClient.createDecision(intervention.id, canceledDecision);
        project = await projectRepository.findById(project.id);
        intervention = await interventionRepository.findById(intervention.id);
        intervention2 = await interventionRepository.findById(intervention2.id);

        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assert.strictEqual(intervention.status, InterventionStatus.canceled);
        assert.strictEqual(intervention2.status, InterventionStatus.integrated);
        assert.strictEqual(project.status, ProjectStatus.planned);
        assert.strictEqual(project.interventionIds.length, 1);
        assert.strictEqual(project.interventionIds[0], intervention2.id);
        assert.isNotOk(intervention.project);
      });

      it('C55416  Positive - Should regenerate project work area when canceling intervention', async () => {
        const response = await request(testApp)
          .post(`${apiUrl}/${intervention.id}/decisions`)
          .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .send(canceledDecision);
        project = await projectRepository.findById(project.id);
        intervention = await interventionRepository.findById(intervention.id);
        intervention2 = await interventionRepository.findById(intervention2.id);

        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assert.strictEqual(intervention.status, InterventionStatus.canceled);
        assert.strictEqual(intervention2.status, InterventionStatus.integrated);
        assert.strictEqual(project.status, ProjectStatus.planned);
        assert.strictEqual(project.interventionIds.length, 1);
        assert.strictEqual(project.interventionIds[0], intervention2.id);
        assert.isNotOk(intervention.project);
        assert.notDeepEqual(project.geometry, projectGeometry); // Should be regenerated
      });

      it('C55417  Positive - Should cancel parent project when canceling the only intervention in project', async () => {
        project.interventionIds = [intervention.id];
        project = (await projectRepository.save(project)).getValue();
        intervention2.project = null;
        intervention2 = (await interventionRepository.save(intervention2)).getValue();

        const response = await interventionDecisionTestClient.create(intervention.id, canceledDecision);
        project = await db()
          .models.Project.findById(project.id)
          .exec();
        intervention = await interventionRepository.findById(intervention.id);

        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assert.strictEqual(intervention.status, InterventionStatus.canceled);
        assert.strictEqual(project.status, ProjectStatus.canceled);
      });

      it('C63458 - Positive - Should update project medal when cancelling intervention', async () => {
        const response = await request(testApp)
          .post(`${apiUrl}/${intervention.id}/decisions`)
          .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .send(canceledDecision);
        project = await projectRepository.findById(project.id);
        intervention = await interventionRepository.findById(intervention.id);
        intervention2 = await interventionRepository.findById(intervention2.id);

        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assert.strictEqual(project.medalId, intervention2.medalId);
      });
    });
  });

  describe('/interventions/:id/decisions > GET', () => {
    let mockIntervention: IEnrichedIntervention;
    let mockResult: IEnrichedIntervention;
    before(async () => {
      mockResult = createEnrichedInterventionModel({ status: InterventionStatus.integrated });
      mockIntervention = await createIntervention(mockResult);
      const bodyReq = getDecisionMock();
      mockIntervention = Object.assign(mockIntervention, { decisions: [bodyReq] });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(bodyReq);
      assert.equal(response.status, HttpStatusCodes.CREATED);
    });

    after(async () => {
      await interventionModel.deleteMany({ id: mockIntervention.id }).exec();
    });

    it(`C53723 - Positive - Should have a 200 status and get a decisions list`, async () => {
      const decision = getDecisionMock();
      const response = await request(testApp)
        .get(`${apiUrl}/${mockIntervention.id}/decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      delete response.body[0].id;
      delete response.body[0].audit;
      delete decision.id;
      delete decision.audit;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepEqual(response.body[0], decision);
    });

    it(`C53724 - Positive - Should update the planificationYear of the intervention`, async () => {
      const targetYear = appUtils.getCurrentYear();
      const response = await request(testApp)
        .get(`${apiUrl}/${mockIntervention.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(response.body.planificationYear, targetYear);
    });

    it(`C53725 - Negative - Should have status 404 when id doesn't exists`, async () => {
      const response = await request(testApp)
        .get(`${apiUrl}//decisions`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });
});

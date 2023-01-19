import { ErrorCodes, IApiError, InterventionStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { Express } from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { createDefaultApp } from '../../../src/core/app';
import { getFeature, getRoadSections } from '../../../src/features/asset/tests/assetTestHelper';
import { db } from '../../../src/features/database/DB';
import { HistoryModel } from '../../../src/features/history/mongo/historyModel';
import { InterventionFindOptions } from '../../../src/features/interventions/models/interventionFindOptions';
import { InterventionModel } from '../../../src/features/interventions/mongo/interventionModel';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { interventionRestrictionsData } from '../../../src/features/interventions/tests/interventionTestHelper';
import { ESTIMATE_PRECISION } from '../../../src/features/interventions/validators/interventionValidator';
import { assetService } from '../../../src/services/assetService';
import { spatialAnalysisService } from '../../../src/services/spatialAnalysisService';
import { ErrorCode } from '../../../src/shared/domainErrors/errorCode';
import { Result } from '../../../src/shared/logic/result';
import { assertRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { enumValues } from '../../../src/utils/enumUtils';
import { appUtils } from '../../../src/utils/utils';
import {
  createInterventionModel,
  getBadBoroughIdIntervention,
  getBadGeometriesIntervention,
  getPlainIntervention
} from '../../data/interventionData';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe('Intervention controller', () => {
  let testApp: Express;
  let historyModel: HistoryModel;
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  let interventionModel: InterventionModel;

  before(async () => {
    testApp = await createDefaultApp();
    interventionModel = db().models.Intervention;
    historyModel = db().models.History;
    // Stubbing this method because it calls extern services
    const mockRoadSections = getRoadSections();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
  });

  after(async () => {
    sinon.restore(); // global défault sandbox
    await integrationAfter();
  });

  function setupStubs() {
    const featureMock = getFeature({
      properties: {
        id: 'R145'
      },
      geometry: getPlainIntervention().assets.find(a => a).geometry
    });
    spatialAnalysisServiceStub.init(sandbox);
    sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([featureMock]));
  }

  beforeEach(() => {
    setupStubs();
  });

  afterEach(() => {
    sandbox.restore(); // local sandbox
  });
  describe('/interventions > POST', () => {
    afterEach(async () => {
      await interventionModel.remove({}).exec();
    });
    // interventions with a minimal intervention payload should be successful and return the newly created resource {id}.
    it('C28743	Positive - Post a new minimal intervention (only mandatory fields)', async () => {
      const postIntervention = getPlainIntervention();
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const historyEntity = await historyModel
        .find({
          referenceId: response.body.id,
          'summary.statusFrom': ''
        })
        .exec();
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(historyEntity.length, 1);
      assert.exists(response.body);
      assert.property(response.body, 'id');
    });

    it('C28744 Positive - Create a new complete intervention (all fields)', async () => {
      const postIntervention = getPlainIntervention();
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.exists(response.body);
      assert.property(response.body, 'id');
    });

    it('C42891	Positive - Adding new intervention calculate road sections based on intervention area', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      assert.deepEqual(postResponse.body.roadSections, getRoadSections());
    });

    const NON_EXISTENT_STATUS = 'none existent intervention';
    [
      {
        status: InterventionStatus.canceled
      },
      {
        status: NON_EXISTENT_STATUS
      }
    ].forEach(test => {
      it(`Positive - Should create an intervention with assets is in another intervention with status : ${test.status}`, async () => {
        if (test.status !== NON_EXISTENT_STATUS) {
          await interventionRepository.saveBulk([createInterventionModel({ status: test.status })]);
        }
        const postIntervention = getPlainIntervention();
        const postResponse = await requestService.post(apiUrl, { body: postIntervention });
        assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      });
    });

    it(`Negative - Intervention cannot create with estimate having a precision greater than ${ESTIMATE_PRECISION}`, async () => {
      const postIntervention = getPlainIntervention({ estimate: 2.1234 });
      const response = await requestService.post(apiUrl, { body: postIntervention });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      const error: IApiError = response.body.error;
      assert.exists(error);
      error.details.forEach(detail => {
        assert.strictEqual(detail.code, ErrorCode.INVALID);
        assert.strictEqual(detail.message, `${ESTIMATE_PRECISION} digits maximum after the point`);
        assert.strictEqual(detail.target, 'estimate');
      });
    });

    it('C28746 - Negative - Validation error received when interventionArea.geometry has a bad format', async () => {
      const postIntervention = getBadGeometriesIntervention();
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.property(response, 'body');
      assert.property(response.body, 'error');
      assert.property(response.body.error, 'code');
      assert.strictEqual(response.body.error.code, 'invalidParameter');
      assert.property(response.body.error, 'details');
      const errorAsset = {
        code: '',
        message: 'the geometry is not valid',
        target: 'interventionArea.geometry'
      };
      assert.deepInclude(response.body.error.details, errorAsset);
    });

    it('C28747	Negative - Empty intervention is not saved', async () => {
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C31706	Negative - When adding interventions one or more taxonomy codes not found in taxonomy collection, error thrown', async () => {
      const postIntervention = getBadBoroughIdIntervention();
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const errorTaxonomy = {
        code: '',
        message: "Taxonomy code: GHOST doesn't exist",
        target: 'boroughId'
      };
      assert.deepInclude(response.body.error.details, errorTaxonomy);
    });

    interventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        userMocker.mockRestrictions(test.useRestrictions);
        const putIntervention = getPlainIntervention(test.props);
        const response = await requestService.post(apiUrl, { body: putIntervention });
        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });

    describe('create a second intervention with the same asset', () => {
      beforeEach(async () => {
        await destroyDBTests();
      });

      [
        {
          description: `when an existing intervention has status ${InterventionStatus.waiting}`,
          intervention: { status: InterventionStatus.waiting },
          expected: {
            error: {
              code: ErrorCodes.InvalidStatus,
              message: 'Some assets are already in interventions having incorrect status:',
              target: 'assets'
            }
          }
        },
        {
          description: `when an existing intervention has status ${InterventionStatus.accepted} and the same year has the requested`,
          intervention: { status: InterventionStatus.accepted, planificationYear: appUtils.getCurrentYear() },
          expected: {
            error: {
              code: ErrorCodes.InvalidStatus,
              message: 'Some assets are already in interventions having incorrect status:',
              target: 'assets'
            }
          }
        },
        {
          description: `when an existing intervention has status ${InterventionStatus.integrated} and the same year has the requested`,
          intervention: { status: InterventionStatus.integrated, planificationYear: appUtils.getCurrentYear() },
          expected: {
            error: {
              code: ErrorCodes.InvalidStatus,
              message: 'Some assets are already in interventions having incorrect status:',
              target: 'assets'
            }
          }
        }
      ].forEach(test => {
        it(`Should not create an intervention ${test.description}`, async () => {
          const firstInterventionResult = await interventionRepository.save(createInterventionModel(test.intervention));
          assert.isFalse(firstInterventionResult.isFailure);
          const plainIntervention = getPlainIntervention();
          plainIntervention.assets = firstInterventionResult.getValue().assets;
          const response = await requestService.post(apiUrl, { body: plainIntervention });
          assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
          const errorDetails = response.body.error.details[0];
          assert.strictEqual(errorDetails.target, test.expected.error.target);
          assert.strictEqual(errorDetails.code, test.expected.error.code);
          assert.strictEqual(
            errorDetails.message,
            `${test.expected.error.message} [${firstInterventionResult
              .getValue()
              .assets.map(a => a.id)
              .join(',')}]`
          );
          const interventions = await interventionRepository.findAll(
            InterventionFindOptions.create({
              criterias: {
                status: enumValues(InterventionStatus)
              }
            }).getValue()
          );
          assert.lengthOf(interventions, 1);
        });
      });

      [
        {
          description: `when an existing intervention has status ${InterventionStatus.canceled}`,
          intervention: { status: InterventionStatus.canceled }
        },
        {
          description: `when an existing intervention has status ${InterventionStatus.refused}`,
          intervention: { status: InterventionStatus.refused }
        },
        {
          description: `when an existing intervention has status ${InterventionStatus.wished}`,
          intervention: { status: InterventionStatus.wished }
        },
        {
          description: `when an existing intervention has status ${InterventionStatus.accepted} and a different year`,
          intervention: { status: InterventionStatus.accepted, planificationYear: appUtils.getCurrentYear() + 1 }
        },
        {
          description: `when an existing intervention has status ${InterventionStatus.integrated} and a different year`,
          intervention: { status: InterventionStatus.integrated, planificationYear: appUtils.getCurrentYear() + 1 }
        }
      ].forEach(test => {
        it(`Should create an intervention ${test.description}`, async () => {
          const firstInterventionResult = await interventionRepository.save(createInterventionModel(test.intervention));
          assert.isFalse(firstInterventionResult.isFailure);
          const firstIntervention = firstInterventionResult.getValue();
          const plainIntervention = getPlainIntervention();
          plainIntervention.assets = firstIntervention.assets;
          const response = await requestService.post(apiUrl, { body: plainIntervention });
          assert.strictEqual(response.status, HttpStatusCodes.CREATED);
          assert.deepEqual(response.body.assets, firstIntervention.assets);
          assert.strictEqual(firstIntervention.status, test.intervention.status);
          const interventions = await interventionRepository.findAll(
            InterventionFindOptions.create({
              criterias: {
                status: enumValues(InterventionStatus)
              }
            }).getValue()
          );
          assert.lengthOf(interventions, 2);
        });
      });
    });
  });
});

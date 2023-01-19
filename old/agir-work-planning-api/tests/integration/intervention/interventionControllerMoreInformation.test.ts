import {
  CommentCategory,
  ErrorCodes,
  IEnrichedIntervention,
  InterventionExternalReferenceType,
  IPlainIntervention,
  MedalType
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
import { getRoadSections } from '../../../src/features/asset/tests/assetTestHelper';
import { getIComment } from '../../../src/features/comments/tests/commentTestHelper';
import { db } from '../../../src/features/database/DB';
import { HistoryFindOptions } from '../../../src/features/history/models/historyFindOptions';
import { historyRepository } from '../../../src/features/history/mongo/historyRepository';
import { InterventionModel } from '../../../src/features/interventions/mongo/interventionModel';
import { assetService } from '../../../src/services/assetService';
import { appUtils } from '../../../src/utils/utils';
import {
  createPlainInterventionFromEnrichedIntervention,
  getBadExternalReferenceCountIntervention,
  getBadExternalReferenceTaxoIntervention,
  getBadOtherCommentIntervention,
  getMinimalInitialIntervention,
  getPlainIntervention
} from '../../data/interventionData';
import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe('Intervention controller - MoreInformation', () => {
  let testApp: Express;
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  const writeAllowedRoles = normalizeUsernames([
    userMocks.admin,
    userMocks.pilot,
    userMocks.planner,
    userMocks.plannerSe,
    userMocks.requestor
  ]);
  let interventionModel: InterventionModel;
  before(async () => {
    testApp = await createDefaultApp();
    interventionModel = db().models.Intervention;
    // Stubbing this method because it calls extern services
    const mockRoadSections = getRoadSections();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
  });

  after(async () => {
    sinon.restore();
    await integrationAfter();
  });

  beforeEach(() => {
    spatialAnalysisServiceStub.init(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
    userMocker.reset();
  });

  describe('/interventions > POST', () => {
    afterEach(async () => {
      await interventionModel.deleteMany({}).exec();
    });

    it('C61692 - Positive - Should save more information', async () => {
      for (const role of writeAllowedRoles) {
        userMocker.mock(role);
        const postIntervention = getPlainIntervention();
        postIntervention.medalId = 'silver';
        postIntervention.externalReferenceIds = [
          { type: InterventionExternalReferenceType.ptiNumber, value: 'more information pti number' }
        ];
        postIntervention.externalReferenceIds.push({
          type: InterventionExternalReferenceType.requestorReferenceNumber,
          value: 'more information requerant reference number'
        });
        const response = await requestService.post(apiUrl, { body: postIntervention });
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      }
    });

    it('C61693 - Negative - Should not save none empty more information when using a forbidden user role', async () => {
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        userMocker.mock(role);
        const postIntervention = getMinimalInitialIntervention();
        postIntervention.medalId = 'silver';
        postIntervention.comments = [
          getIComment({
            text: 'more information comment other',
            categoryId: CommentCategory.other,
            isPublic: true
          })
        ];
        postIntervention.externalReferenceIds = [
          { type: InterventionExternalReferenceType.ptiNumber, value: 'more information pti number' }
        ];
        postIntervention.externalReferenceIds.push({
          type: InterventionExternalReferenceType.requestorReferenceNumber,
          value: 'more information requerant reference number'
        });
        const response = await request(testApp)
          .post(apiUrl)
          .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .send(postIntervention);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      }
    });

    it('C61694 - Negative - Should not save other comment when using wrong taxonomy', async () => {
      const postIntervention = getBadOtherCommentIntervention();
      postIntervention.comments[0].categoryId = 'wrong taxonomy';
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Negative - Should NOT save comments on create', async () => {
      const postIntervention = getPlainIntervention();
      (postIntervention as any).comments = [
        {
          text: 'test 1',
          categoryId: CommentCategory.other,
          isPublic: true
        },
        {
          text: 'test 2',
          categoryId: CommentCategory.other,
          isPublic: true
        }
      ];
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST, `should not be able to send comments on post`);
    });

    it('C61696 - Negative - Should not save an external reference when its wrong taxonomy', async () => {
      const postIntervention = getBadExternalReferenceTaxoIntervention();
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C61697 - Negative - Should not save more than one pti number external reference', async () => {
      const postIntervention = getBadExternalReferenceCountIntervention(InterventionExternalReferenceType.ptiNumber);
      assert.strictEqual(_.size(postIntervention.externalReferenceIds), 2);
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const errorDuplicate = {
        code: '',
        message: 'Intervention pti number already exist',
        target: ErrorCodes.Duplicate
      };
      assert.deepInclude(response.body.error.details, errorDuplicate);
    });

    it('C61698 - Negative - Should not save more than one requestor reference number external reference', async () => {
      const postIntervention = getBadExternalReferenceCountIntervention(
        InterventionExternalReferenceType.requestorReferenceNumber
      );
      assert.strictEqual(_.size(postIntervention.externalReferenceIds), 2);
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const errorDuplicate = {
        code: '',
        message: 'Intervention requestor reference number already exist',
        target: ErrorCodes.Duplicate
      };
      assert.deepInclude(response.body.error.details, errorDuplicate);
    });

    it('C61699 - Positive - Should save the more information audit', async () => {
      const postIntervention = getPlainIntervention();
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const myIntervention = response.body;
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isNotEmpty(myIntervention.moreInformationAudit);
      assert.strictEqual(myIntervention.moreInformationAudit.createdBy.userName, 'xplanner');
      assert.isNotEmpty(myIntervention.moreInformationAudit.createdAt);
      assert.isUndefined(myIntervention.moreInformationAudit.updatedBy);
      assert.isUndefined(myIntervention.moreInformationAudit.updatedAt);
    });
  });

  describe('/interventions/:id > GET', () => {
    it('C61700 - Positive - Should return the road network type id for the more information tab', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const getResponse = await request(testApp)
        .get(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      const myIntervention = getResponse.body;
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(myIntervention.id, postResponse.body.id);
      assert.strictEqual(myIntervention.roadNetworkTypeId, postResponse.body.roadNetworkTypeId);
    });

    it('C61701 - Positive - Should return the medal id for the more information tab', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const getResponse = await request(testApp)
        .get(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      const myIntervention = getResponse.body;
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(myIntervention.id, postResponse.body.id);
      assert.strictEqual(myIntervention.medalId, postIntervention.medalId);
    });
  });

  // tslint:disable:max-func-body-length
  describe('/interventions/:id > PUT', () => {
    afterEach(async () => {
      await interventionModel.deleteMany({}).exec();
    });

    it('C61702 - Positive - Should save more information', async () => {
      for (const role of writeAllowedRoles) {
        userMocker.mock(role);
        const postIntervention = getPlainIntervention();
        const postResponse = await request(testApp)
          .post(apiUrl)
          .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
          .send(postIntervention);
        assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
        const putIntervention = postResponse.body;
        putIntervention.medalId = 'silver';
        putIntervention.externalReferenceIds = [
          { type: InterventionExternalReferenceType.ptiNumber, value: 'more information pti number' }
        ];
        putIntervention.externalReferenceIds.push({
          type: InterventionExternalReferenceType.requestorReferenceNumber,
          value: 'more information requerant reference number'
        });
        const putResponse = await request(testApp)
          .put(`${apiUrl}/${postResponse.body.id}`)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
          .send(putIntervention);
        assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
        const myIntervention: IEnrichedIntervention = putResponse.body;
        assert.isAbove(myIntervention.externalReferenceIds.length, 0);
        userMocker.reset();
      }
    });

    it('C61703 - Negative - Should not save more information when using a forbidden user role', async () => {
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        const postIntervention = getPlainIntervention();
        const postResponse = await request(testApp)
          .post(apiUrl)
          .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
          .send(postIntervention);
        assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
        userMocker.mock(role);
        const putIntervention = postResponse.body;
        putIntervention.medalId = 'silver';
        putIntervention.externalReferenceIds = [
          { type: InterventionExternalReferenceType.ptiNumber, value: 'more information pti number' }
        ];
        putIntervention.externalReferenceIds.push({
          type: InterventionExternalReferenceType.requestorReferenceNumber,
          value: 'more information requerant reference number'
        });
        const putResponse = await request(testApp)
          .put(`${apiUrl}/${postResponse.body.id}`)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
          .send(putIntervention);
        assert.strictEqual(putResponse.status, HttpStatusCodes.FORBIDDEN);
        userMocker.reset();
      }
    });

    it('C61704 - Negative - Should not save other comment when using wrong taxonomy', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putIntervention = getBadExternalReferenceTaxoIntervention(postResponse.body);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Negative - Should NOT save comments on PUT', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putIntervention: IPlainIntervention = createPlainInterventionFromEnrichedIntervention(postResponse.body);
      (putIntervention as any).comments = [
        {
          text: 'test 1',
          categoryId: CommentCategory.other,
          isPublic: true
        },
        {
          text: 'test 2',
          categoryId: CommentCategory.other,
          isPublic: true
        }
      ];
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C61706 - Negative - Should not save an external reference when its wrong taxonomy', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putIntervention = getBadExternalReferenceTaxoIntervention(postResponse.body);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C61707 - Negative - Should not save more than one pti number external reference', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putIntervention = getBadExternalReferenceCountIntervention(
        InterventionExternalReferenceType.ptiNumber,
        postResponse.body
      );
      assert.strictEqual(_.size(putIntervention.externalReferenceIds), 2);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const errorDuplicate = {
        code: '',
        message: 'Intervention pti number already exist',
        target: ErrorCodes.Duplicate
      };
      assert.deepInclude(putResponse.body.error.details, errorDuplicate);
    });

    it('C61708 - Negative - Should not save more than one requestor reference number external reference', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putIntervention = getBadExternalReferenceCountIntervention(
        InterventionExternalReferenceType.requestorReferenceNumber,
        postResponse.body
      );
      assert.strictEqual(_.size(putIntervention.externalReferenceIds), 2);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const errorDuplicate = {
        code: '',
        message: 'Intervention requestor reference number already exist',
        target: ErrorCodes.Duplicate
      };
      assert.deepInclude(putResponse.body.error.details, errorDuplicate);
    });

    it('C61709 - Positive - Should save the more information audit', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putIntervention = postResponse.body;
      putIntervention.medalId = MedalType.gold;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const myIntervention = putResponse.body;
      assert.isNotEmpty(myIntervention.moreInformationAudit);
      assert.isDefined(myIntervention.moreInformationAudit.createdBy);
      assert.isNotEmpty(myIntervention.moreInformationAudit.createdAt);
      assert.strictEqual(myIntervention.moreInformationAudit.lastModifiedBy.userName, 'xplanner');
      assert.isNotEmpty(myIntervention.moreInformationAudit.lastModifiedAt);
    });

    it('C61710 - Negative - Should not save the more information audit when no change occurs', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postResponse.body);
      const myIntervention = putResponse.body;
      assert.isNotEmpty(myIntervention.moreInformationAudit);
      assert.isDefined(myIntervention.moreInformationAudit.createdBy);
      assert.isNotEmpty(myIntervention.moreInformationAudit.createdAt);
      assert.isUndefined(myIntervention.moreInformationAudit.lastModifiedBy);
      assert.isUndefined(myIntervention.moreInformationAudit.lastModifiedAt);
    });

    it('C61711 - Positive - Should save the change comment of more information in history', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putIntervention = postResponse.body;
      putIntervention.medalId = MedalType.gold;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const myIntervention = putResponse.body;
      const interventionHistoryFindOptions = HistoryFindOptions.create({
        criterias: {
          referenceId: myIntervention.id
        }
      }).getValue();
      const interventionHistory = await historyRepository.findAll(interventionHistoryFindOptions);
      assert.isTrue(interventionHistory.length > 0);
      assert.containsAllKeys(interventionHistory[0], [
        'objectTypeId',
        'referenceId',
        'actionId',
        'summary',
        'audit',
        'id'
      ]);
      const historyFindOptions = HistoryFindOptions.create({
        criterias: {},
        orderBy: '-id',
        limit: 1
      }).getValue();
      const results = await historyRepository.findAll(historyFindOptions);
      assert.exists(results[0].summary.comments);
    });

    it('C61712 - Negative - Should not save the change comment of more information in history when no change occurs', async () => {
      const postIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postResponse.body);
      const myIntervention = putResponse.body;
      const interventionHistoryFindOptions = HistoryFindOptions.create({
        criterias: {
          referenceId: myIntervention.id
        }
      }).getValue();
      const interventionHistory = await historyRepository.findAll(interventionHistoryFindOptions);

      assert.isTrue(interventionHistory.length > 0);
      assert.containsAllKeys(interventionHistory[0], ['objectTypeId', 'referenceId', 'actionId', 'summary']);
      const historyFindOptions = HistoryFindOptions.create({
        criterias: {},
        orderBy: '-id',
        limit: 1
      }).getValue();
      const results = await historyRepository.findAll(historyFindOptions);
      assert.isUndefined(results[0].summary);
    });
  });
});

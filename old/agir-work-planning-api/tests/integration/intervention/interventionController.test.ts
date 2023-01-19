import {
  AnnualProgramStatus,
  CommentCategory,
  IApiError,
  IComment,
  IEnrichedIntervention,
  IEnrichedProject,
  IHistory,
  IInterventionAnnualDistribution,
  InterventionStatus,
  IPlainIntervention,
  ProgramBookStatus,
  ProjectStatus,
  RequirementTargetType
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { Express } from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { createEnrichedInterventionModel } from '../../../scripts/load_data/outils/interventionDataOutils';
import { createDefaultApp } from '../../../src/core/app';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import {
  getAssetProps,
  getFeature,
  getInitialAssetId,
  getRoadSections,
  getWorkArea
} from '../../../src/features/asset/tests/assetTestHelper';
import { getComment, getIComment, getPlainCommentProps } from '../../../src/features/comments/tests/commentTestHelper';
import { db } from '../../../src/features/database/DB';
import { HistoryModel } from '../../../src/features/history/mongo/historyModel';
import { InterventionFindOptions } from '../../../src/features/interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import {
  createAndSaveIntervention,
  createIntervention,
  getInterventionProps,
  interventionRestrictionsData,
  updateInterventionRestrictionsData
} from '../../../src/features/interventions/tests/interventionTestHelper';
import { ESTIMATE_PRECISION } from '../../../src/features/interventions/validators/interventionValidator';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { RequirementFindOptions } from '../../../src/features/requirements/models/requirementFindOptions';
import { requirementRepository } from '../../../src/features/requirements/mongo/requirementRepository';
import { getRequirement } from '../../../src/features/requirements/tests/requirementTestHelper';
import { assetService } from '../../../src/services/assetService';
import { spatialAnalysisService } from '../../../src/services/spatialAnalysisService';
import { ErrorCode } from '../../../src/shared/domainErrors/errorCode';
import { Result } from '../../../src/shared/logic/result';
import { assertRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { appUtils, isPaginatedResult } from '../../../src/utils/utils';
import { projectDataCoupler } from '../../data/dataCouplers/projectDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import {
  createInterventionList,
  createInterventionModel,
  getBadBoroughIdIntervention,
  getEnrichedCompleteIntervention,
  getInterventionAreaGeometryModified,
  getInterventionInsideViewport,
  getInterventionOutsideViewport,
  getMinimalInitialIntervention,
  getMinimalInitialPolygonIntervention,
  getPlainIntervention,
  interventionDataAssetForTest,
  interventionEnrichedToPlain
} from '../../data/interventionData';
import { enrichedToPlain, getInitialProject } from '../../data/projectData';
import { iConfigurationGeometryMock } from '../../data/spatialAnalysisData';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { interventionTestClient } from '../../utils/testClients/interventionTestClient';
import { createMany, destroyDBTests, mergeProperties } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe('Intervention controller', () => {
  let testApp: Express;
  let historyModel: HistoryModel;
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);

  before(async () => {
    testApp = await createDefaultApp();
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

  // tslint:disable:max-func-body-length
  describe('/interventions > GET', () => {
    let mockInterventions: IEnrichedIntervention[];
    beforeEach(async () => {
      mockInterventions = await createMany(createInterventionList(), interventionRepository);
    });
    afterEach(async () => {
      await db()
        .models.Intervention.deleteMany({})
        .exec();
    });

    it('C31674	Positive - Received paginated list of interventions', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(isPaginatedResult(response.body), true);
    });

    it('Positive - Received paginated list of interventions inside the ids asked ', async () => {
      const idsWanted = [mockInterventions[0].id, mockInterventions[1].id];
      const response = await requestService.get(apiUrl, {}, `id=${idsWanted.join(',')}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);

      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.notEqual(interventions.length, mockInterventions.length);
      assert.lengthOf(interventions, idsWanted.length);
      assert.isTrue(interventions.every(i => idsWanted.includes(i.id)));
      assert.isTrue(isPaginatedResult(response.body));
    });

    it('C54837  Positive - When role has correct permission, should have a status 200', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it('C54838	Negative - When role whitout permissions is sent, should have status 403 with a message : "Forbidden access"', async () => {
      const mockedUser = userMocker.currentMock;
      userMocker.mock(userMocks.noAccess);
      try {
        const response = await request(testApp)
          .get(apiUrl)
          .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .send();
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      } finally {
        userMocker.mock(mockedUser);
      }
    });
    it('C50034 - Positive - Received paginated list of interventions without project', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}?project=null`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      for (const item of response.body.items) {
        assert.notExists(item.project);
      }
    });
    it('C31675	Positive - Received list of interventions that corresponds with specified param', async () => {
      const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: intervention.boroughId })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      for (const item of response.body.items) {
        assert.strictEqual(item.boroughId, intervention.boroughId);
      }
    });
    it('C31676	Positive - Received list of interventions that corresponds with mixt params', async () => {
      const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
      intervention.status = InterventionStatus.waiting;
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: intervention.boroughId, status: intervention.status })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      // TODO getMinimalINtervention has a null status, correct ?
      // @Vincent On develop, the test passes because response.body.items is empty
      // so there is no problem with strict equal...
      for (const item of response.body.items) {
        assert.strictEqual(item.boroughId, intervention.boroughId);
        assert.strictEqual(item.status, intervention.status);
      }
    });
    it('C31677	Positive - One query is passed multiple times, received a list matching one of the values', async () => {
      const interventions: IEnrichedIntervention[] = await interventionRepository.findAll(
        InterventionFindOptions.create({
          criterias: {}
        }).getValue()
      );
      const interventionStatus1: IEnrichedIntervention = interventions[0];
      let interventionStatus2: IEnrichedIntervention = interventions[1];
      // verifies that the two mock interventions have different statuses, it avoids hardcoded intervention in test
      if (interventionStatus1.status === interventionStatus2.status) {
        // changes second intervention to have a different status than the first
        for (let i = 2; i < interventions.length; i++) {
          if (interventionStatus1.status !== interventions[i].status) {
            interventionStatus2 = interventions[i];
            break;
          }
        }
      }
      const response = await request(testApp)
        .get(apiUrl)
        .query({ status: [interventionStatus1.status, interventionStatus2.status] })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.isAbove(response.body.items.length, 1);
      for (const item of response.body.items) {
        assert.oneOf(item.status, [interventionStatus1.status, interventionStatus2.status]);
      }
    });
    it('C31678 - Positive - Received list of interventions that corresponds to a param found in subdocument asset', async () => {
      const assetIds = mockInterventions.map(intervention => intervention.assets[0].id);
      const response = await request(testApp)
        .get(apiUrl)
        .query({ assetId: assetIds.join(',') })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, assetIds.length);
      for (const item of response.body.items) {
        assert.isTrue(assetIds.includes(item.assets[0].id));
      }
    });
    it('C31679 - Positive - If param "limit" is specified and more than 0 then returns a limited list of interventions', async () => {
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
    it('C31680	Positive - If param "offset" is specified and more than 0 then returns a list begining at that offset', async () => {
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

    it('C31682	Negative - Specified param is not an attribute of intervention returns bad request', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .query({ qwerty: '1234' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C31685	Negative - Value of specified param is not an existing value in interventions, returns empty list', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: 'GHOST' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.deepEqual(response.body.items, []);
    });
    it("C31683	Negative - If one param is an existing attribute of intervention and another that isn't, returns bad request.", async () => {
      const intervention = getMinimalInitialIntervention();
      const response = await request(testApp)
        .get(apiUrl)
        .query({ boroughId: intervention.boroughId, qwerty: '1234' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C42746 Positive - Should get only interventions intersecting a viewport', async () => {
      const interventionInside = getInterventionInsideViewport();
      const interventionOutside = getInterventionOutsideViewport();
      await interventionRepository.saveBulk([interventionInside, interventionOutside]);
      const response = await request(testApp)
        .get(apiUrl)
        .query({ interventionAreaBbox: '-73.673893,45.522706,-73.670138,45.524841' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, 1);
      assert.notInclude(response.body.items, interventionOutside);
      await db()
        .models.Intervention.deleteMany({})
        .exec();
    });
    it('C42747 Negative - Should have status 400 when viewport is invalid', async () => {
      const response = await request(testApp)
        .post(apiUrl)
        .query({ interventionAreaBbox: 'test' })
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    [
      {
        description:
          'Received list of interventions within bbox , with  valid status , no project and decisionRequired=FALSE',
        searchQuery: {
          executorId: 'di',
          status: [InterventionStatus.integrated, InterventionStatus.waiting, InterventionStatus.accepted],
          project: null,
          decisionRequired: false
        },
        expected: {
          intervention: {
            decisionRequired: false
          }
        }
      },
      {
        description:
          'Received list of interventions within bbox , with  valid status , no project and decisionRequired=TRUE ',
        searchQuery: {
          executorId: 'di',
          status: [InterventionStatus.integrated, InterventionStatus.waiting, InterventionStatus.accepted],
          project: null,
          decisionRequired: true
        },
        expected: {
          intervention: {
            decisionRequired: true
          }
        }
      },
      {
        description:
          'Received list of interventions within bbox , with  valid status , no project and decisionRequired=UNDEFINED',
        searchQuery: {
          executorId: 'di',
          status: [InterventionStatus.integrated, InterventionStatus.waiting, InterventionStatus.accepted],
          project: null,
          decisionRequired: 'undefined'
        },
        expected: {
          intervention: {
            decisionRequired: false
          }
        }
      }
    ].forEach(test => {
      it(`Positive - ${test.description}`, async () => {
        const bbox = '-73.655659,45.525021,-73.653728,45.527148';

        const query: any = {
          interventionAreaBbox: bbox,
          executorId: test.searchQuery.executorId,
          status: test.searchQuery.status.join(','),
          project: test.searchQuery.project,
          decisionRequired: test.searchQuery.decisionRequired
        };

        const response = await request(testApp)
          .get(apiUrl)
          .query(query)
          .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .send();
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.equal(isPaginatedResult(response.body), true);

        for (const inter of response.body.items as IEnrichedIntervention[]) {
          assert.strictEqual(inter.executorId, test.searchQuery.executorId);
          assert.isTrue(test.searchQuery.status.includes(inter.status as InterventionStatus));

          if (!test.searchQuery.project) {
            assert.notProperty(inter, 'project');
          }

          let decisionRequiredCondition;
          if (test.searchQuery.decisionRequired === 'undefined' || test.searchQuery.decisionRequired === false) {
            decisionRequiredCondition =
              !inter.decisionRequired || inter.decisionRequired === test.expected.intervention.decisionRequired;
          } else {
            decisionRequiredCondition = inter.decisionRequired === test.expected.intervention.decisionRequired;
          }
          assert.isTrue(decisionRequiredCondition);
        }
      });
    });
  });

  describe('/interventions > GET (projection)', () => {
    before(async () => {
      await interventionRepository.save(
        createInterventionModel({
          decisionRequired: false,
          status: InterventionStatus.waiting
        })
      );
    });
    after(async () => {
      await destroyDBTests();
    });

    [
      {
        fields: ['decisionRequired']
      },
      {
        fields: ['interventionArea']
      },
      {
        fields: ['interventionName']
      },
      {
        fields: ['interventionTypeId']
      },
      {
        fields: ['planificationYear']
      },
      {
        fields: ['estimate']
      },
      {
        fields: ['requestorId']
      },
      {
        fields: ['programId']
      },
      {
        fields: ['status']
      },
      {
        fields: [
          'decisionRequired',
          'interventionArea',
          'interventionName',
          'interventionTypeId',
          'planificationYear',
          'estimate',
          'requestorId',
          'programId',
          'status'
        ]
      }
    ].forEach(test => {
      it(`should only return the id and these properties : [${test.fields}]`, async () => {
        const response = await requestService.get(apiUrl, null, { fields: test.fields.join(',') });
        assert.strictEqual(response.status, HttpStatusCodes.OK);

        const intervention: IEnrichedIntervention = response.body.items[0];
        assert.exists(intervention.id);
        test.fields.forEach(field => {
          assert.exists(intervention[field], `${field} not found`);
        });
        assert.lengthOf(Object.keys(intervention), test.fields.length + 2);
      });
    });
  });

  describe('/interventions > GET (empty DB)', () => {
    it('C31684	Negative - Specified params exist but DB is empty so it returns empty list', async () => {
      const response = await request(testApp)
        .get(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.deepEqual(response.body.items, []);
    });
  });

  describe('/interventions/:id > GET', () => {
    it('C28896	Positive - Retrieves only one complete intervention', async () => {
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
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(getResponse.body.id, postResponse.body.id);
      assert.notDeepEqual(getResponse.body, {});
    });
    // Tries to retrieve a non existing intervention, returns 404
    it("C28897	Negative - Specified intervention id doesn't exist and can't be retrieved", async () => {
      const reponse = await request(testApp)
        .get(`${apiUrl}/I99999`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send();
      assert.strictEqual(reponse.status, HttpStatusCodes.NOT_FOUND);
    });

    // Tries to retrieve an intervention with an invalid id, returns 400
    it("C58437	Negative - Can't retrieve specified id because it is invalid", async () => {
      const reponse = await request(testApp)
        .get(`${apiUrl}/qwerty1234`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send();
      assert.strictEqual(reponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    // Tries to retrieve an intervention and expand the assets
    it('Positive - Expand the assets', async () => {
      const postIntervention = getPlainIntervention({
        assets: [getAssetProps({ ...interventionDataAssetForTest, id: getInitialAssetId() })]
      });
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      const getResponse = await request(testApp)
        .get(`${apiUrl}/${postResponse.body.id}?expand=assets`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      const getIntervention: IEnrichedIntervention = getResponse.body;
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(getIntervention.id, postResponse.body.id);
      assert.notDeepEqual(getIntervention, {} as IEnrichedIntervention);
      assert.isTrue(getIntervention.assets.every(asset => asset.hasOwnProperty('properties')));
      assert.isTrue(getIntervention.assets.every(asset => asset.properties.hasOwnProperty('installationDate')));
    });
  });

  // tslint:disable:max-func-body-length
  describe('/interventions/:id > PUT', () => {
    after(async () => {
      await db()
        .models.Intervention.deleteMany({})
        .exec();
    });

    interface ISuggestedMainStreetProperties {
      streetName: string;
      streetFrom: string;
      streetTo: string;
    }

    function generateSuggestedMainStreetProperties(
      intervention: IEnrichedIntervention
    ): ISuggestedMainStreetProperties {
      return {
        streetName: intervention?.streetName || null,
        streetFrom: intervention?.streetFrom || null,
        streetTo: intervention?.streetTo || null
      };
    }

    // Sends an intervention to specified id and modifies that intervention, returns 204 if successful
    it('C28782	Positive - Modifies existing intervention, only specified attributes changed', async () => {
      const putIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.equal(postResponse.status, HttpStatusCodes.CREATED);
      const createdIntervention: IEnrichedIntervention = _.cloneDeep(postResponse.body);
      createdIntervention.interventionTypeId = 'opportunity';
      const updateIntervention = interventionEnrichedToPlain(_.cloneDeep(createdIntervention));

      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(updateIntervention);
      delete putResponse.body.audit;
      delete createdIntervention.audit;
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.notEqual(putResponse.body.interventionTypeId, putIntervention.interventionTypeId);
      for (const key of Object.keys(createdIntervention)) {
        if (key in putResponse.body) {
          assert.deepEqual(putResponse.body[key], createdIntervention[key]);
        }
      }
    });

    it('C42575 Positive - Changing status of intervention, history object is also created', async () => {
      const putIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);

      const modifiedIntervention: IEnrichedIntervention = _.cloneDeep(postResponse.body);
      modifiedIntervention.interventionTypeId = 'opportunity';
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(modifiedIntervention);
      const historyEntity = await historyModel
        .find({
          referenceId: putResponse.body.id
        })
        .exec();
      assert.strictEqual(historyEntity.length, 2);
    });
    it('C32641	Positive - Modifies subdocument of existing intervention, only specified attributes changed', async () => {
      const putIntervention = getPlainIntervention();

      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const createdIntervention: IEnrichedIntervention = _.cloneDeep(postResponse.body);
      createdIntervention.interventionName = 'TI99';
      const updateIntervention = interventionEnrichedToPlain(_.cloneDeep(createdIntervention));

      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(updateIntervention);
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      const myIntervention: IEnrichedIntervention = putResponse.body;
      assert.notEqual(myIntervention.interventionName, putIntervention.interventionName);
      delete myIntervention.audit;
      delete createdIntervention.audit;
      for (const key of Object.keys(createdIntervention)) {
        if (key in myIntervention) {
          assert.deepEqual(myIntervention[key], createdIntervention[key]);
        }
      }
    });

    it('C42792 - Positive - Modifying interventionArea recalculate new road sections based on intervention area', async () => {
      const putIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      putIntervention.interventionArea = { geometry: getWorkArea(), isEdited: false };
      putIntervention.status = postResponse.body.status;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.notDeepEqual(putResponse.body.roadSections, putIntervention.roadSections);
    });

    it('C64783 - Positive - Modifying interventionArea affect main street info based on intervention area', async () => {
      const putIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      spatialAnalysisServiceStub.initAnalyzeStub(sandbox, { streetName: 'new' }, true);
      const interventionSuggestedMainStreetProperties = generateSuggestedMainStreetProperties(postResponse.body);
      putIntervention.interventionArea = { geometry: iConfigurationGeometryMock, isEdited: false };
      putIntervention.status = postResponse.body.status;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const myUpdatedInterventionSuggestedMainStreetProperties = generateSuggestedMainStreetProperties(
        putResponse.body
      );
      assert.notDeepEqual(
        interventionSuggestedMainStreetProperties,
        myUpdatedInterventionSuggestedMainStreetProperties
      );
    });

    it('C60716 - Positive - Modifying interventionArea recalculates its project length', async () => {
      const projectApiPath = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
      const putIntervention = interventionEnrichedToPlain(getMinimalInitialPolygonIntervention());
      putIntervention.status = InterventionStatus.waiting;
      const originalInterventionResponse = await requestService.post(apiUrl, { body: putIntervention });
      assert.strictEqual(originalInterventionResponse.status, HttpStatusCodes.CREATED);
      const currentIntervention: IEnrichedIntervention = originalInterventionResponse.body;

      let project: IEnrichedProject = getInitialProject();
      project.geometry.coordinates = [
        [
          [-73.654505610466, 45.526492584043005],
          [-73.65478724241257, 45.52600589494234],
          [-73.65461826324463, 45.52596831259726],
          [-73.65428030490875, 45.52648318854036],
          [-73.654505610466, 45.526492584043005]
        ]
      ];
      project.interventionIds = [currentIntervention.id];
      project = enrichedToPlain(project);
      const originalProjectResponse = await requestService.post(projectApiPath, { body: project });

      assert.strictEqual(originalProjectResponse.status, HttpStatusCodes.CREATED);
      assert.strictEqual(originalProjectResponse.body.length.value, currentIntervention.assets[0].length.value);

      const getInterventionResponse = await requestService.get(`${apiUrl}/${currentIntervention.id}`);
      assert.strictEqual(getInterventionResponse.status, HttpStatusCodes.OK);
      const modifiedIntervention: IPlainIntervention = _.cloneDeep(
        interventionDataGenerator.createPlainFromEnriched(getInterventionResponse.body)
      );
      modifiedIntervention.interventionArea.geometry = getInterventionAreaGeometryModified();

      const updatedInterventionResponse = await requestService.put(`${apiUrl}/${currentIntervention.id}`, {
        body: modifiedIntervention
      });
      const getUpdatedProjectResponse = await requestService.get(
        `${projectApiPath}/${originalProjectResponse.body.id}`
      );
      assert.strictEqual(updatedInterventionResponse.status, HttpStatusCodes.OK);
      const savedIntervention: IEnrichedIntervention = updatedInterventionResponse.body;
      assert.isTrue(currentIntervention.assets[0].length.value !== savedIntervention.assets[0].length.value);
      assert.strictEqual(getUpdatedProjectResponse.body.length.value, savedIntervention.assets[0].length.value);
    });

    updateInterventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const createdIntervention = await createAndSaveIntervention(mergeProperties({}, test.props));
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        const response = await requestService.put(`${apiUrl}/${createdIntervention.id}`, {
          body: getInterventionProps(mergeProperties({}, test.updateProps || test.props))
        });

        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });

    it("C42793	Negative - interventionArea didn't change, roadSections won't change either", async () => {
      let putIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      putIntervention = postResponse.body;
      const putResponse = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.deepEqual(putResponse.body.roadSections, putIntervention.roadSections);
    });

    // Tries to update an intervention with an invalid id, returns 400
    it('C54201	Negative - Specified id is invalid', async () => {
      const putIntervention = getPlainIntervention();
      const reponse = await request(testApp)
        .put(`${apiUrl}/qwerty1234`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(reponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    // Tries to update a non existing intervention, returns 404
    it("C28783	Negative - Specified intervention id doesn't exist and can't be updated", async () => {
      const putIntervention = getPlainIntervention();
      const reponse = await request(testApp)
        .put(`${apiUrl}/I99999`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      assert.strictEqual(reponse.status, HttpStatusCodes.NOT_FOUND);
    });
    // Tries to update an intervention with empty object, returns
    it('C28791	Negative - Empty intervention cannot update specified id', async () => {
      const putIntervention = getPlainIntervention();
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const response = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send({});
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`Negative - Intervention cannot update with estimate having a precision greater than ${ESTIMATE_PRECISION}`, async () => {
      const putIntervention = getPlainIntervention();
      const postResponse = await requestService.post(apiUrl, { body: putIntervention });

      const response = await requestService.put(`${apiUrl}/${postResponse.body.id}`, {
        body: getPlainIntervention({ estimate: 10.4657 })
      });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      const error: IApiError = response.body.error;
      assert.exists(error);
      error.details.forEach(detail => {
        assert.strictEqual(detail.code, ErrorCode.INVALID);
        assert.strictEqual(detail.message, `${ESTIMATE_PRECISION} digits maximum after the point`);
        assert.strictEqual(detail.target, 'estimate');
      });
    });

    it('C31707	Negative - When updating intervention one or more taxonomy codes not found in taxonomy collection, error thrown', async () => {
      const putIntervention = getBadBoroughIdIntervention();
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(putIntervention);
      const errorTaxonomy = {
        code: '',
        message: "Taxonomy code: GHOST doesn't exist",
        target: 'boroughId'
      };
      assert.deepInclude(response.body.error.details, errorTaxonomy);
    });
  });

  describe('/interventions/:id > DELETE', () => {
    let mockIntervention: IEnrichedIntervention;
    beforeEach(async () => {
      mockIntervention = await interventionDataGenerator.store({ status: InterventionStatus.wished });
      const mockInterventionToKeep = await interventionDataGenerator.store({ status: InterventionStatus.waiting });
      const annualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.new });
      const programBook = await createAndSaveProgramBook({
        annualProgram,
        status: ProgramBookStatus.programming
      });
      const mockProject = await projectDataGenerator.store({});
      await projectDataCoupler.coupleThem({
        project: mockProject,
        interventions: [mockIntervention, mockInterventionToKeep],
        programBooksCoupler: [{ year: mockIntervention.planificationYear, programBook }]
      });
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    it(`C31699 - Positive - Should return a 204 status with a message : "The resource was deleted"`, async () => {
      userMocker.mock(userMocks.requestor);
      const response = await request(testApp)
        .delete(`${apiUrl}/${mockIntervention.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      const historyEntity: IHistory[] = await historyModel
        .find({
          referenceId: mockIntervention.id
        })
        .sort({ _id: -1 })
        .limit(1)
        .exec();
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      assert.strictEqual(historyEntity.length, 1);
      assert.strictEqual(historyEntity[0].actionId, constants.operation.DELETE);
      userMocker.mock(userMocks.admin);
    });

    it(`Positive - Should delete requirement associated with the intervention`, async () => {
      const intervention = await createIntervention(mockIntervention);
      const requirement = await getRequirement({
        items: [
          {
            type: RequirementTargetType.intervention,
            id: intervention.id
          }
        ]
      });
      await requirementRepository.save(requirement);
      const requirementFindOptions = RequirementFindOptions.create({
        criterias: {
          itemId: intervention.id
        }
      }).getValue();
      const originalRequirement = await requirementRepository.findAll(requirementFindOptions);
      assert.lengthOf(originalRequirement, 1);
      const response = await requestService.delete(`${apiUrl}/${intervention.id}`);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const requirementResponse = await requirementRepository.findAll(requirementFindOptions);
      assert.lengthOf(requirementResponse, 0);
    });

    it(`C31700 - Negative - Should have status 404 after delete by id`, async () => {
      const url = `${apiUrl}/${mockIntervention.id}`;
      const response = await request(testApp)
        .delete(url)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const getResponse = await request(testApp)
        .get(url)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(getResponse.status, HttpStatusCodes.NOT_FOUND);
    });

    it(`C58438  Negative - Should have status 400 with a message : "Invalid request"`, async () => {
      const getResponse = await request(testApp)
        .delete(`${apiUrl}/badrequest`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(getResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C31704 - Negative - Should have status 404 with a message : "The specified resource was not found" while using an inexistent id`, async () => {
      const getResponse = await request(testApp)
        .delete(`${apiUrl}/I99999`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(getResponse.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C60965 - Positive - Should call the program book compute objectives after the delete', async () => {
      const spyProgramBookComputeObjectives = sandbox.spy(ProgramBook.prototype, 'computeObjectives');
      const response = await interventionTestClient.delete(mockIntervention.id);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      assert.isTrue(spyProgramBookComputeObjectives.calledOnce, `computeObjectives should be called once`);
    });

    interventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const props = mergeProperties({}, test.props);
        const createdIntervention = await createAndSaveIntervention(props);
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        const response = await interventionTestClient.delete(createdIntervention.id);

        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/interventions/:id/comments > POST', () => {
    let mockIntervention: IEnrichedIntervention;
    let mockResult: IEnrichedIntervention;
    let mockResultReceived: IEnrichedIntervention;

    beforeEach(async () => {
      mockResultReceived = createEnrichedInterventionModel({ status: InterventionStatus.waiting });
      mockResult = createEnrichedInterventionModel({ status: InterventionStatus.waiting });
      mockIntervention = await createIntervention(mockResult);
      await createIntervention(mockResultReceived);
    });

    afterEach(async () => {
      await db()
        .models.Intervention.deleteMany({})
        .exec();
    });

    it(`C54464 - Positive - Should have 201 status on comment creation`, async () => {
      const expectedComment = getPlainCommentProps();
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(expectedComment);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const updatedIntervention = await interventionRepository.findById(mockIntervention.id);
      const createdComment = updatedIntervention.comments.find(c => c);
      assert.equal(createdComment.categoryId, expectedComment.categoryId);
      assert.equal(createdComment.text, expectedComment.text);
      assert.equal(createdComment.isPublic, expectedComment.isPublic);
      assert.equal(createdComment.isProjectVisible, expectedComment.isProjectVisible);
    });

    it(`C54465 - Positive - Should save a modification in history`, async () => {
      const comment = getPlainCommentProps();
      await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      const response = await request(testApp)
        .get(`${apiUrl}/${mockIntervention.id}/history`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.exists(response.body);
    });
    it(`C54467 - Negative - Should return an error object with 400 status if no categoryId`, async () => {
      const comment = getPlainCommentProps({
        categoryId: undefined
      });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
    it(`C54468 - Negative - Should return an error object with 400 status if no text`, async () => {
      const comment = getPlainCommentProps({
        text: undefined
      });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
    it(`C54469 - Negative - Should return an error object with 405 status with an invalid verb`, async () => {
      const comment = getPlainCommentProps();
      const response = await request(testApp)
        .patch(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.METHOD_NOT_ALLOWED);
    });

    it(`C54470 - Negative - Should return an error object with a 400 status if an unacceptable typeId taxonomy is sent`, async () => {
      const comment = getPlainCommentProps({ categoryId: 'categoryId' });
      const response = await request(testApp)
        .post(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(comment);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
  });

  describe('/interventions/:id/comments/:idComment > DELETE', () => {
    let mockIntervention: IEnrichedIntervention;
    after(async () => {
      await db()
        .models.Intervention.deleteMany({})
        .exec();
    });

    it(`C54479 - Positive - Should have 204 status on comment suppression`, async () => {
      mockIntervention = getEnrichedCompleteIntervention();
      mockIntervention = await createIntervention(mockIntervention);

      const response = await request(testApp)
        .delete(`${apiUrl}/${mockIntervention.id}/comments/${mockIntervention.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();

      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      // it was two comment before delete
      const updatedIntervention = await interventionRepository.findById(mockIntervention.id);
      assert.strictEqual(updatedIntervention.comments.length, 1);
      const remainingComment = updatedIntervention.comments.find(c => c);
      assert.equal(remainingComment.text, 'test 2');
      assert.equal(remainingComment.categoryId, CommentCategory.information);
      assert.equal(remainingComment.isPublic, true);
    });

    it(`C54480 - Positive - Should have a new entry in historical log after deletion"`, async () => {
      mockIntervention = getEnrichedCompleteIntervention();
      mockIntervention = await createIntervention(mockIntervention);
      const response = await request(testApp)
        .delete(`${apiUrl}/${mockIntervention.id}/comments/${mockIntervention.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      const historyEntity: IHistory[] = await historyModel
        .find({
          referenceId: mockIntervention.id,
          categoryId: constants.historyCategoryId.COMMENT,
          'summary.comments': constants.systemMessages.COMMENT_DELETED
        })
        .exec();

      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      // it was two comments before delete
      const updatedIntervention = await interventionRepository.findById(mockIntervention.id);
      assert.strictEqual(updatedIntervention.comments.length, 1);
      const remainingComment = updatedIntervention.comments.find(c => c);
      assert.equal(remainingComment.text, 'test 2');
      assert.equal(remainingComment.categoryId, CommentCategory.information);
      assert.equal(remainingComment.isPublic, true);
      assert.strictEqual(historyEntity.length, 1);
    });

    it(`C54481 - Negative - Should return an error object with a 404 if intervention doesn't exist"`, async () => {
      const response = await request(testApp)
        .delete(`${apiUrl}/I99999/comments/5d55a1e76d3b511353c37e97`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it(`C54482 - Negative - Should return an error object with a 404 if requirement in specific interventions was not found `, async () => {
      mockIntervention = getEnrichedCompleteIntervention();
      mockIntervention = await createIntervention(mockIntervention);

      const response = await request(testApp)
        .delete(`${apiUrl}/I99999/comments/5d55a1e76d3b511353c37e97`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });

  describe('/interventions/:id/comments > GET', () => {
    let mockIntervention: IEnrichedIntervention;
    before(async () => {
      mockIntervention = createEnrichedInterventionModel({ status: InterventionStatus.waiting });
      mockIntervention.comments = [getIComment()];
      mockIntervention = await createIntervention(mockIntervention);
    });
    after(async () => {
      await db()
        .models.Intervention.deleteMany({ id: mockIntervention.id })
        .exec();
    });
    it(`C54471 - Positive - Should have a 200 status and get a comments list`, async () => {
      const expectedComment = getComment();
      const response = await request(testApp)
        .get(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepEqual(response.body[0].categoryId, expectedComment.categoryId);
      assert.deepEqual(response.body[0].text, expectedComment.text);
      assert.deepEqual(response.body[0].isPublic, expectedComment.isPublic);
    });
    it(`C54472 - Negative - Should have status 404 when id doesn't exists`, async () => {
      const response = await request(testApp)
        .get(`${apiUrl}//comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });

  describe('/interventions/:id/comments/:idComment > PUT', () => {
    let mockIntervention: IEnrichedIntervention;
    const commentToUpdate = getPlainCommentProps();
    before(async () => {
      mockIntervention = createEnrichedInterventionModel({ status: InterventionStatus.waiting });
      mockIntervention.comments = [getIComment()];
      mockIntervention = await createIntervention(mockIntervention);
    });
    after(async () => {
      await db()
        .models.Intervention.deleteMany({ id: mockIntervention.id })
        .exec();
    });

    it(`C54473 - Positive - Should update an intervention comment and have a 200 status`, async () => {
      const fetchedComments = await request(testApp)
        .get(`${apiUrl}/${mockIntervention.id}/comments`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      commentToUpdate.isProjectVisible = true;
      const response = await request(testApp)
        .put(`${apiUrl}/${mockIntervention.id}/comments/${fetchedComments.body[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(commentToUpdate);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const updatedComment: IComment = response.body;
      assert.strictEqual(updatedComment.isProjectVisible, true);
    });
    it(`C54474 - Positive - Should save updated intervention in history`, async () => {
      await request(testApp)
        .put(`${apiUrl}/${mockIntervention.id}/comments/${mockIntervention.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(commentToUpdate);
      const response = await request(testApp)
        .get(`${apiUrl}/${mockIntervention.id}/history`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.exists(response.body);
    });

    it(`C54475 - Negative - Should return an error object with a 400 status if an unacceptable categoryId taxonomy is sent`, async () => {
      commentToUpdate.categoryId = 'categoryId';
      const response = await request(testApp)
        .put(`${apiUrl}/${mockIntervention.id}/comments/${mockIntervention.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(commentToUpdate);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });

    it(`C54477 - Negative - Should return an error object with a 400 status if no body is sent`, async () => {
      const params = {};
      const response = await request(testApp)
        .put(`${apiUrl}/${mockIntervention.id}/comments/${mockIntervention.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(params);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
    it(`C54478 - Negative - Should return an error object with a 400 status if invalid body is sent`, async () => {
      const params = { noGoodArg: 'noGoodArg' };
      const response = await request(testApp)
        .put(`${apiUrl}/${mockIntervention.id}/comments/${mockIntervention.comments[0].id}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(params);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.exists(response.body.error);
    });
  });

  describe('Tests setDecisionRequired', () => {
    it('C54197 - Positive - Should add decisionRequired to true with a valid programId', async () => {
      const postIntervention = getPlainIntervention();
      postIntervention.status = InterventionStatus.waiting;
      postIntervention.programId = 'pcpr';
      const response = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(postIntervention);
      assert.isTrue(response.body.decisionRequired);
    });

    it('C54202 - Positive - Should add decisionRequired to true with a valid programId on update', async () => {
      const putIntervention = getPlainIntervention();
      putIntervention.status = InterventionStatus.waiting;
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(putIntervention);
      const modifiedIntervention: IEnrichedIntervention = _.cloneDeep(postResponse.body);
      modifiedIntervention.programId = 'pcpr';
      const response = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(modifiedIntervention);
      assert.isTrue(response.body.decisionRequired);
    });

    it('C54203 - Positive - Should add decisionRequired to false with an empty programId on update', async () => {
      const postIntervention = getPlainIntervention();
      postIntervention.programId = 'pcpr';
      const postResponse = await request(testApp)
        .post(apiUrl)
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(postIntervention);
      assert.equal(postResponse.status, HttpStatusCodes.CREATED);
      const modifiedIntervention: IEnrichedIntervention = _.cloneDeep(postResponse.body);
      modifiedIntervention.programId = null;
      const response = await request(testApp)
        .put(`${apiUrl}/${postResponse.body.id}`)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
        .send(modifiedIntervention);
      assert.isFalse(response.body.decisionRequired);
    });
  });

  describe('/interventions/:id/annualDistribution > PUT', () => {
    let intervention: IEnrichedIntervention;
    let project: IEnrichedProject;
    let url: string;
    beforeEach(async () => {
      project = getInitialProject();
      project.status = ProjectStatus.planned;
      project = (await projectRepository.save(project)).getValue();

      intervention = await interventionDataGenerator.store(
        {
          status: InterventionStatus.waiting
        },
        project
      );

      project.interventionIds = [intervention.id];
      project.interventions = [intervention];
      project = (await projectRepository.save(project)).getValue();
      url = `${apiUrl}/${intervention.id}/annualDistribution`;
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    it(`C64850 - Positive - Should update the notes of an intervention's annual distribution`, async () => {
      const note = '123';
      const interventionAnnualDistribution: IInterventionAnnualDistribution = {
        distributionSummary: {
          note
        }
      };
      const putResponse = await requestService.put(url, {
        body: interventionAnnualDistribution
      });
      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(putResponse.body.annualDistribution.distributionSummary.note, note);
    });

    it(`C64851 - Negative - Should not update the note of an intervention's annual distribution if it is invalid`, async () => {
      const note = 123;
      const interventionAnnualDistribution: any = {
        distributionSummary: {
          note
        }
      };
      const putResponse = await requestService.put(url, {
        body: interventionAnnualDistribution
      });
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C64901 - Positive - Should update the budget of an intervention's annual distribution and recalculate the total`, async () => {
      const baseInterventionTotalAllowance = intervention.annualDistribution.distributionSummary.totalAllowance;

      const allowance1 = 123;
      const allowance2 = 321;

      const annualPeriods = intervention.annualDistribution.annualPeriods;
      annualPeriods[0].annualAllowance = allowance1;
      annualPeriods[1].annualAllowance = allowance2;

      const interventionAnnualDistribution: IInterventionAnnualDistribution = {
        annualPeriods
      };

      const putResponse = await requestService.put(url, {
        body: interventionAnnualDistribution
      });

      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(putResponse.body.annualDistribution.annualPeriods[0].annualAllowance, allowance1);
      assert.strictEqual(putResponse.body.annualDistribution.annualPeriods[1].annualAllowance, allowance2);
      assert.notEqual(
        putResponse.body.annualDistribution.distributionSummary.totalAllowance,
        baseInterventionTotalAllowance
      );
    });

    it(`C64902 - Positive - Should update the accountId of an intervention's annual distribution`, async () => {
      const accountId1 = 123;
      const accountId2 = 321;

      const annualPeriods = intervention.annualDistribution.annualPeriods;
      annualPeriods[0].accountId = accountId1;
      annualPeriods[1].accountId = accountId2;

      const interventionAnnualDistribution: IInterventionAnnualDistribution = {
        annualPeriods
      };

      const putResponse = await requestService.put(url, {
        body: interventionAnnualDistribution
      });

      assert.strictEqual(putResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(putResponse.body.annualDistribution.annualPeriods[0].accountId, accountId1);
      assert.strictEqual(putResponse.body.annualDistribution.annualPeriods[1].accountId, accountId2);
    });

    interventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        userMocker.mockRestrictions(test.useRestrictions);

        const interventionAnnualDistribution: IInterventionAnnualDistribution = {
          distributionSummary: {
            note: '123'
          }
        };
        const props = mergeProperties({}, test.props);
        const createdIntervention = await createAndSaveIntervention(props);

        const response = await requestService.put(`${apiUrl}/${createdIntervention.id}/annualDistribution`, {
          body: interventionAnnualDistribution
        });

        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });
});

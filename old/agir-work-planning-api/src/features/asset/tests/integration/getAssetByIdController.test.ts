import * as turf from '@turf/turf';
import { AssetType, IAsset, IFeature, IGeometry } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { Express } from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { getInitialAsset, getSuggestedStreetName } from '../../../../../tests/data/assetData';
import * as assetMocks from '../../../../../tests/data/assets/work-area';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { createDefaultApp } from '../../../../core/app';
import { assetService } from '../../../../services/assetService';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { Result } from '../../../../shared/logic/result';
import { appUtils } from '../../../../utils/utils';
import { getFeature, getRoadSections, getWorkArea, getWorkAreaFeature } from '../assetTestHelper';

// tslint:disable:max-func-body-length
const sandbox = sinon.createSandbox();

describe('Get asset by id controller', () => {
  let testApp: Express;
  const assetType = AssetType.fireHydrant;
  const assetSourceLayerId = 'fire-hydrants';
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.ASSETS, EndpointTypes.API);
  const assetId = 201858;
  const mockAsset: IAsset = getInitialAsset();
  const mockRoadSections = getRoadSections();

  before(async () => {
    testApp = await createDefaultApp();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/interventions > GET', () => {
    before(() => {
      sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([getFeature()]));
      sandbox.stub(spatialAnalysisService, 'getLayerNearbyFeatures').resolves([getWorkAreaFeature()]);
      sandbox.stub(spatialAnalysisService, 'getLayerIntersectingFeatures').resolves(mockRoadSections as any);
      sandbox.stub(spatialAnalysisService, 'getSuggestedName').returns('rue mock');
    });
    after(() => {
      sandbox.restore();
    });

    it('C31743 - Positive - Should have status 200 and return an IAsset', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/${assetType}/${assetId}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.containsAllDeepKeys(response.body, {
        id: mockAsset.id,
        typeId: mockAsset.typeId,
        ownerId: mockAsset.ownerId,
        geometry: mockAsset.geometry
      });
    });

    it('C31744 - Positive - Should have a typeId, an ownerId', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/${assetType}/${assetId}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.containsAllDeepKeys(response.body, {
        typeId: mockAsset.typeId,
        ownerId: mockAsset.ownerId
      });
    });

    it('C31745 - Positive - Should have a parameter expand that extend the source with workarea and return a geojson', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/${assetType}/${assetId}?expand=workArea`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.containsAllDeepKeys(response.body, {
        workArea: getWorkArea()
      });
    });

    it('C31746 - Positive - Should have a parameter expand that extend the source with roadSections and return a roadSection list', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/${assetType}/${assetId}?expand=roadSections`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.containsAllDeepKeys(response.body, {
        roadSections: getRoadSections()
      });
    });

    it('C31747 - Positive - Should have a parameter expand that extend the source with suggestedStreetName and return the street name with the biggest length', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/${assetType}/${assetId}?expand=suggestedStreetName`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.containsAllDeepKeys(response.body, {
        suggestedStreetName: getSuggestedStreetName()
      });
    });

    it('C31748 - Negative - Should have status 400 when source is invalid', async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/1/${assetId}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C31753 - Negative - Should have status 404 when id doesn't exist`, async () => {
      const response = await request(testApp)
        .get(`${apiUrl}/${assetType}/1`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it(`C31754 - Negative - Should have status 404 when source doesn't exist`, async () => {
      const response = await request(testApp)
        .get(`${apiUrl}//${assetId}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });

  describe('GET', () => {
    describe('Work Area', () => {
      function createFakeAssetFeature(geometry: IGeometry): IFeature {
        return {
          id: `${assetSourceLayerId}.${assetId}`,
          type: 'Feature',
          properties: {
            id: assetId,
            typeId: assetType
          },
          geometry: geometry as any
        };
      }

      function setupStubGetFeatures(geometry: IGeometry) {
        sandbox
          .stub(spatialAnalysisService, 'getFeaturesByIds')
          .resolves(Result.ok([createFakeAssetFeature(geometry)]));
      }

      function setupStubGetLayerNearbyFeatures(features = assetMocks.geometriesSet.features) {
        sandbox.stub(spatialAnalysisService, 'getLayerNearbyFeatures').returns(Promise.resolve(features as any));
      }

      function sendRequest(): request.Test {
        return request(testApp)
          .get(`${apiUrl}/${assetType}/${assetId}?expand=workArea`)
          .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
          .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
          .send();
      }

      async function testAssetWorkArea(assetGeometry: IGeometry, assetResult: IGeometry) {
        setupStubGetFeatures(assetGeometry);
        setupStubGetLayerNearbyFeatures();

        const response = await sendRequest();

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.isTrue(turf.booleanEqual(response.body.workArea.geometry, assetResult));
      }

      afterEach(() => {
        sandbox.restore();
      });

      it('C32956  Positive - Should get whole intersection work area', async () => {
        await testAssetWorkArea(assetMocks.intersectionAsset.geometry, assetMocks.intersectionResult);
      });

      it('C32957  Positive - Should get whole street work area', async () => {
        await testAssetWorkArea(assetMocks.streetAsset.geometry, assetMocks.streetResult);
      });

      it('C42591  Negative - Should return a null work area when not found', async () => {
        const defaultWorkArea = assetService.getDefaultWorkArea(assetMocks.streetAsset.geometry);
        setupStubGetFeatures(assetMocks.streetAsset.geometry);
        setupStubGetLayerNearbyFeatures(null);

        const response = await sendRequest();

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.deepEqual(response.body.workArea, defaultWorkArea);
      });

      it('C42786  Negative - Should not retrieve a work area if asset is 15 meters from closest road', async () => {
        const defaultWorkArea = assetService.getDefaultWorkArea(assetMocks.streetAssetTooFar);
        setupStubGetFeatures(assetMocks.streetAssetTooFar);
        setupStubGetLayerNearbyFeatures();

        const response = await sendRequest();

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.deepEqual(response.body.workArea, defaultWorkArea);
      });

      describe('Linear Asset', () => {
        it('C42593  Positive - Should retrieve a street work area', async () => {
          await testAssetWorkArea(assetMocks.assetLinearStreet, assetMocks.assetLinearStreetResult);
        });

        it('C42594  Positive - Should retrieve an intersection work area', async () => {
          await testAssetWorkArea(assetMocks.assetLinearIntersection, assetMocks.assetLinearIntersectionResult);
        });

        it('C42595  Positive - Should retrieve a street work area from a perpendicular linear asset', async () => {
          await testAssetWorkArea(
            assetMocks.assetLinearStreetPerpendicular,
            assetMocks.assetLinearStreetPerpendicularResult
          );
        });

        it('C42596  Positive - Should retrieve a street work area from a far linear asset', async () => {
          await testAssetWorkArea(assetMocks.assetLinearStreetFar, assetMocks.assetLinearStreetFarResult);
        });

        it('C42597  Positive - Should retrieve a combined work area from a 90 degrees linear asset', async () => {
          await testAssetWorkArea(assetMocks.assetLinear90Degrees, assetMocks.assetLinear90DegreesResult);
        });

        it('C42787  Negative - Should not retrieve a work area if linear asset is 15 meters from closest road', async () => {
          const defaultWorkArea = assetService.getDefaultWorkArea(assetMocks.assetLinearTooFar);
          setupStubGetFeatures(assetMocks.assetLinearTooFar);
          setupStubGetLayerNearbyFeatures();

          const response = await sendRequest();

          assert.strictEqual(response.status, HttpStatusCodes.OK);
          assert.deepEqual(response.body.workArea, defaultWorkArea);
        });
      });
    });
  });
});

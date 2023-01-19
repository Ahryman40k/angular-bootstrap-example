import * as turf from '@turf/turf';
import {
  AssetType,
  IAsset,
  IGeometry,
  IInterventionArea,
  ISearchAssetsRequest
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../../../config/constants';
import {
  createAssetModel,
  getBadPolygon,
  getInitialAsset,
  getInterventionAreaBig,
  getMultiPolygonInterventionArea
} from '../../../../../tests/data/assetData';
import { assetOpportunities } from '../../../../../tests/data/assets/assetOpportunities';
import { assetsData } from '../../../../../tests/data/assets/assets';
import * as assetMocks from '../../../../../tests/data/assets/work-area';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { createDefaultApp } from '../../../../core/app';
import { assetService } from '../../../../services/assetService';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { appUtils } from '../../../../utils/utils';
import { getFeature, getRoadSections } from '../assetTestHelper';

// tslint:disable: no-string-literal
// tslint:disable:max-func-body-length
const sandbox = sinon.createSandbox();

describe('Search assets controller', () => {
  const apiSearchUrl: string = appUtils.createPublicFullPath(constants.locationPaths.ASSETS_SEARCH, EndpointTypes.API);
  const mockAsset: IAsset = getInitialAsset();
  const mockRoadSections = getRoadSections();

  before(async () => {
    await createDefaultApp();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  function searchAssets(req: ISearchAssetsRequest): Promise<request.Response> {
    return requestService.post(apiSearchUrl, { body: req });
  }

  describe('search assets > POST', () => {
    let interventionArea: IInterventionArea;
    let asset: IAsset;
    let assetOutside: IAsset;
    let featureAssetStub: sinon.SinonStub;

    beforeEach(() => {
      sandbox
        .stub(spatialAnalysisService, 'getLayerIntersectingFeatures')
        .returns(Promise.resolve(getRoadSections()) as any);
      sandbox.stub(spatialAnalysisService['wfsService'], 'dWithin').returns(Promise.resolve(getRoadSections()) as any);
      sandbox.stub(spatialAnalysisService['wfsService'], 'cql').returns(Promise.resolve(getRoadSections()) as any);
      sandbox
        .stub(spatialAnalysisService['wfsService'], 'intersect')
        .returns(Promise.resolve(getRoadSections()) as any);
      interventionArea = getInterventionAreaBig();
      assetOutside = createAssetModel({ geometry: { type: 'Point', coordinates: [-73.627884, 45.52276] } });
      asset = createAssetModel({
        geometry: {
          type: 'Point',
          coordinates: [-73.66133451461792, 45.527742171908216]
        }
      });
      featureAssetStub = sandbox.stub(assetService, 'wfsFeatureToAsset').returns(Promise.resolve(asset));
    });

    afterEach(() => {
      featureAssetStub.restore();
      sandbox.restore();
    });

    it('C43439 - Negative - It should return a bad request status if a point is received', async () => {
      const response = await searchAssets({ geometry: asset.geometry });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C43440 - Negative - It should return a bad request status if an invalid polygon is received', async () => {
      const response = await searchAssets({ geometry: getBadPolygon() });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C43444 - Negative - Asset is out of the interventionArea`, async () => {
      featureAssetStub.restore();
      const stub = sandbox.stub(assetService, 'wfsFeatureToAsset').returns(Promise.resolve(assetOutside));
      const response = await searchAssets({ geometry: interventionArea.geometry });
      const polyGeomCoord = interventionArea.geometry.coordinates as number[][][];
      assert.isFalse(
        turf.booleanPointInPolygon(
          turf.point(response.body[0].geometry.coordinates as number[]),
          turf.polygon(polyGeomCoord)
        ),
        'Point is inside the polygon'
      );
      stub.restore();
    });

    it(`C43445 - Positive - It should return assets from all layers when a valid polygon with a 'planificateur' user is received`, async () => {
      sandbox.restore();
      const feature = getFeature();
      feature.geometry = interventionArea.geometry;
      const collection = turf.featureCollection([feature]);
      sandbox.stub(spatialAnalysisService, 'getLayerIntersectingFeatures').returns(Promise.resolve(collection));

      const response = await searchAssets({ geometry: interventionArea.geometry });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isOk(Array.isArray(response.body), 'body is an array'); // Asserts that object is truthy
      assert.containsAllDeepKeys(response.body[0], {
        id: mockAsset.id,
        typeId: mockAsset.typeId,
        ownerId: mockAsset.ownerId,
        geometry: mockAsset.geometry
      });
      assert.property(response.body[0], 'properties');
    });

    it(`Positive - It should return assets from all layers when a valid multi polygon is received`, async () => {
      sandbox.restore();
      const feature = getFeature();
      interventionArea = getMultiPolygonInterventionArea();
      feature.geometry = interventionArea.geometry;
      const collection = turf.featureCollection([feature]);
      sandbox.stub(spatialAnalysisService, 'getLayerIntersectingFeatures').returns(Promise.resolve(collection));

      const response = await searchAssets({ geometry: interventionArea.geometry });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isOk(Array.isArray(response.body), 'body is an array'); // Asserts that object is truthy
      assert.containsAllDeepKeys(response.body[0], {
        id: mockAsset.id,
        typeId: mockAsset.typeId,
        ownerId: mockAsset.ownerId,
        geometry: mockAsset.geometry
      });
      assert.property(response.body[0], 'properties');
    });

    it(`C43447 - Positive - Asset should be inside the interventionArea`, async () => {
      const response = await searchAssets({ geometry: interventionArea.geometry });
      const polyGeomCoord = interventionArea.geometry.coordinates as number[][][];
      assert.isTrue(
        turf.booleanPointInPolygon(
          turf.point(response.body[0].geometry.coordinates as number[]),
          turf.polygon(polyGeomCoord)
        ),
        'Point is outside the polygon'
      );
    });

    it(`C43448 - Positive - Asset should intersect the interventionArea`, async () => {
      featureAssetStub.restore();
      featureAssetStub = sandbox
        .stub(assetService, 'wfsFeatureToAsset')
        .returns(Promise.resolve(createAssetModel({ geometry: mockRoadSections.features[0].geometry })));

      const response = await searchAssets({ geometry: interventionArea.geometry });
      const polyGeomCoord = interventionArea.geometry.coordinates as number[][][];
      assert.isTrue(
        turf.booleanCrosses(turf.lineString(response.body[0].geometry.coordinates), turf.polygon(polyGeomCoord)),
        'Polygon intersect interventionArea'
      );
      featureAssetStub.restore();
    });

    it(`C43449 - Positive - It should call WFS through spatialAnalysis with a planner user and a constant asset array`, async () => {
      sandbox.restore();
      // tslint:disable-next-line: no-string-literal
      const spy = sandbox.stub(spatialAnalysisService['wfsService'], 'intersect').returns(Promise.resolve(null));
      await searchAssets({ geometry: interventionArea.geometry });
      assert.isTrue(spy.called);
      spy.restore();
    });
  });

  describe('Search assets - Advanced intersect', () => {
    let interventionArea: IGeometry;

    beforeEach(() => {
      interventionArea = assetMocks.streetResult;
    });

    it('C60053  Positive - Should return the asset opportunities', async () => {
      const pavementLayerIds = ['montreal:pavement-sections', 'montreal:intersections'];
      const assetsLayerIds = ['montreal:fire-hydrants'];

      sandbox
        .stub(spatialAnalysisService['wfsService'], 'dWithin')
        .withArgs(sinon.match.any, sinon.match.any, sinon.match.array.deepEquals(pavementLayerIds), sinon.match.any)
        .returns(Promise.resolve(assetOpportunities.wfsPavementResponse as any))
        .withArgs(sinon.match.any, sinon.match.any, sinon.match.array.contains(assetsLayerIds), sinon.match.any)
        .returns(Promise.resolve(assetOpportunities.wfsAssetsResponse as any));

      const response = await searchAssets({
        geometry: interventionArea,
        advancedIntersect: true
      });

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepEqual(response.body, assetOpportunities.goodResults);
    });
  });

  describe('Search assets - By ID', () => {
    interface ISearchAssetsPositiveSearchCase {
      request: ISearchAssetsRequest;
      stub: sinon.SinonStub;
    }

    async function testPositiveSearch(options: ISearchAssetsPositiveSearchCase): Promise<void> {
      const response = await searchAssets(options.request);

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(response.body.length);
      const assets = response.body as IAsset[];
      for (const asset of assets) {
        assert.ok(asset.id);
        assert.ok(asset.typeId);
        assert.ok(asset.ownerId);
        assert.property(asset, 'properties');
      }
      assert.isTrue(options.stub.calledWith("id = '345'", sinon.match.any, sinon.match.any));
    }

    it('C60652  Positive - Should return assets that match the id criteria', async () => {
      const stub = sandbox
        .stub(spatialAnalysisService['wfsService'], 'cql')
        .withArgs(sinon.match.any, sinon.match.any, sinon.match.any)
        .returns(Promise.resolve(assetsData.wfsAssetsResponse as any));

      const cases: ISearchAssetsPositiveSearchCase[] = [
        { request: { id: '345' }, stub },
        { request: { id: '345', assetTypes: [AssetType.fireHydrant] }, stub }
      ];

      for (const testCase of cases) {
        await testPositiveSearch(testCase);
      }
    });

    it('C60653  Negative - Should not return assets when input is invalid', async () => {
      const invalidInputs: ISearchAssetsRequest[] = [{}, { id: {} as any }];

      for (const invalidInput of invalidInputs) {
        const response = await searchAssets(invalidInput);
        assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      }
    });
  });
});

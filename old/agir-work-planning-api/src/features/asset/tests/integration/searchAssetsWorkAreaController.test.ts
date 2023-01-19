import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AssetExpand,
  AssetType,
  IAssetList,
  IAssetsWorkArea,
  IAssetsWorkAreaSearchRequest,
  IFeature
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { cloneDeep } from 'lodash';
import { createSandbox } from 'sinon';

import { assetsWorkAreaTestClient } from '../../../../../tests/utils/testClients/assetsWorkAreaTestClient';
import { INVALID_UUID } from '../../../../../tests/utils/testHelper';
import { assetService, IAssetSearchItem } from '../../../../services/assetService';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { workAreaService } from '../../../../services/workAreaService';
import { Result } from '../../../../shared/logic/result';
import {
  getAssetFeatureCollection,
  getAssetFeatureCollectionWorkArea,
  getPolygonsFromAssetFeatureCollection
} from '../assetsWorkAreaTestHelper';
import { getRoadSections, getSuggestedStreetName, getWorkAreaFeature } from '../assetTestHelper';

const sandbox = createSandbox();

function createInitialStubs(mockFeatures: IFeature[]) {
  sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok(mockFeatures));
  sandbox.stub(spatialAnalysisService, 'getLayerNearbyFeatures').resolves([getWorkAreaFeature()]);
  sandbox.stub(spatialAnalysisService, 'getSuggestedName').returns(getSuggestedStreetName());
  sandbox.stub(assetService, 'getRoadSections').resolves(getRoadSections());
  sandbox.stub(workAreaService, 'getPolygonsFromGeometries').resolves(getPolygonsFromAssetFeatureCollection());
  sandbox.stub(workAreaService, 'generateWorkAreaFromPolygons').resolves(getAssetFeatureCollectionWorkArea());
}

// tslint:disable:max-func-body-length
describe('SearchAssetsWorkAreaController', () => {
  const mockFeatures = getAssetFeatureCollection().features;
  const assetSearchItems: IAssetSearchItem[] = mockFeatures.map(el => {
    return { id: el.properties.id.toString(), type: AssetType.fireHydrant };
  });
  const assetIds = assetSearchItems.map(el => el.id);

  describe('/v1/search/assets/work-area - POST', () => {
    let searchAssetsWorkArea: IAssetsWorkAreaSearchRequest;
    beforeEach(() => {
      searchAssetsWorkArea = {
        assets: assetSearchItems,
        expand: []
      };
    });

    describe('Positive', () => {
      beforeEach(() => {
        createInitialStubs(mockFeatures);
      });
      afterEach(() => {
        sandbox.restore();
      });
      it('should return OK when optional field (expand) is undefined', async () => {
        const response = await assetsWorkAreaTestClient.post({ ...searchAssetsWorkArea, expand: undefined });
        assert.strictEqual(response.status, HttpStatusCodes.OK);
      });
      it('should get assets work area with given ids', async () => {
        const response = await assetsWorkAreaTestClient.post(searchAssetsWorkArea);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const assetsWorkArea: IAssetsWorkArea = response.body;
        assert.lengthOf(assetsWorkArea.assets, mockFeatures.length);
        assetsWorkArea.assets.forEach(asset => {
          assert.isTrue(assetIds.includes(asset.id));
        });
        assert.exists(assetsWorkArea.workArea);
        assert.strictEqual(assetsWorkArea.workArea.properties.suggestedStreetName, getSuggestedStreetName());
      });
      it('should get assets work area with given expand', async () => {
        const response = await assetsWorkAreaTestClient.post({
          ...searchAssetsWorkArea,
          expand: [AssetExpand.workArea]
        });
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const assets: IAssetList = (response.body as IAssetsWorkArea).assets;
        assets.forEach(asset => {
          assert.isDefined(asset[AssetExpand.workArea]);
        });
      });
    });

    describe('Negative', () => {
      beforeEach(() => {
        createInitialStubs(mockFeatures);
      });
      afterEach(() => {
        sandbox.restore();
      });

      it('should not get assets work area with invalid ids', async () => {
        const cloneSearchAssetsWorkArea = cloneDeep(searchAssetsWorkArea);
        cloneSearchAssetsWorkArea.assets.splice(1, 0, { id: INVALID_UUID, type: AssetType.fireHydrant });
        const response = await assetsWorkAreaTestClient.post(cloneSearchAssetsWorkArea);
        assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
      });

      it('should not get assets work area with invalid type ids', async () => {
        const cloneSearchAssetsWorkArea = cloneDeep(searchAssetsWorkArea);
        cloneSearchAssetsWorkArea.assets.splice(1, 0, { id: 3452 as any, type: AssetType.fireHydrant });

        const response = await assetsWorkAreaTestClient.post(cloneSearchAssetsWorkArea);
        assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      });

      it('should not get assets when spatialAnalysisService crash', async () => {
        sandbox.restore();
        sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').throws('error');
        const response = await assetsWorkAreaTestClient.post(searchAssetsWorkArea);
        assert.strictEqual(response.status, HttpStatusCodes.INTERNAL_SERVER_ERROR);
      });
    });
  });
});

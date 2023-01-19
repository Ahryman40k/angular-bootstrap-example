import { AssetExpand, AssetType, ErrorCodes, IFeature } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { cloneDeep } from 'lodash';
import { createSandbox } from 'sinon';

import { assertFailures, destroyDBTests, INVALID_UUID, mergeProperties } from '../../../../../tests/utils/testHelper';
import { IAssetSearchItem } from '../../../../services/assetService';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { enumValues } from '../../../../utils/enumUtils';
import { ISearchAssetsWorkAreaCommandProps } from '../../useCases/searchAssetsWorkArea/searchAssetsWorkAreaCommand';
import { searchAssetsWorkAreaUseCase } from '../../useCases/searchAssetsWorkArea/searchAssetsWorkAreaUseCase';
import { getAssetFeatureCollection } from '../assetsWorkAreaTestHelper';
import { getWorkAreaFeature } from '../assetTestHelper';

const sandbox = createSandbox();

function createInitialStubs(mockFeatures: IFeature[]) {
  sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok(mockFeatures));
  sandbox.stub(spatialAnalysisService, 'getLayerNearbyFeatures').returns(Promise.resolve([getWorkAreaFeature()]));
}

// tslint:disable:max-func-body-length
describe(`SearchAssetsWorkAreaUseCase`, () => {
  const mockFeatures = getAssetFeatureCollection().features;
  const assetSearchItems: IAssetSearchItem[] = mockFeatures.map(el => {
    return { id: el.properties.id.toString(), type: AssetType.fireHydrant };
  });
  beforeEach(() => {
    createInitialStubs(mockFeatures);
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    [
      {
        description: 'missing assets',
        requestError: {
          assets: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assets',
            code: ErrorCodes.MissingValue,
            message: `assets is null or undefined`
          }
        ]
      },
      {
        description: 'missing assetType',
        requestError: {
          assets: [{ type: undefined, id: assetSearchItems[0].id }]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assetType',
            code: ErrorCodes.MissingValue,
            message: `assetType is null or undefined`
          }
        ]
      },
      {
        description: 'assets is not an array',
        requestError: {
          assets: 34223
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assets',
            code: ErrorCodes.InvalidInput,
            message: `assets must be an array`
          }
        ]
      },
      {
        description: 'assets is an array of number',
        requestError: {
          assets: [201410, 201392]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'AssetsWorkAreaSearchRequest',
            code: 'openApiInputValidator',
            message: `Unable to validate a model with a type: number, expected: object; Unable to validate a model with a type: number, expected: object`
          }
        ]
      },
      {
        description: 'invalid assetType',
        requestError: {
          assets: [{ type: 'assetType', id: assetSearchItems[0].id }]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assetType',
            code: ErrorCodes.InvalidInput,
            message: `assetType isn't oneOf the correct values in ["${enumValues(AssetType).join(
              '","'
            )}"]. Got "assetType".`
          }
        ]
      },
      {
        description: 'invalid expands',
        requestError: {
          expand: ['wrong-expands']
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'expand',
            code: ErrorCodes.InvalidInput,
            message: `expand isn't oneOf the correct values in ["${enumValues(AssetExpand).join(
              '","'
            )}"]. Got "wrong-expands".`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const searchAssetsWorkAreaCommand: ISearchAssetsWorkAreaCommandProps = {
          assets: assetSearchItems
        };
        const result = await searchAssetsWorkAreaUseCase.execute(
          mergeProperties(searchAssetsWorkAreaCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return notFoundError when given asset id do not exists`, async () => {
      const cloneMockAssetsSearchItems = cloneDeep(assetSearchItems);
      cloneMockAssetsSearchItems.splice(1, 0, { id: INVALID_UUID, type: AssetType.fireHydrant });
      const searchAssetsWorkAreaCommand: ISearchAssetsWorkAreaCommandProps = {
        assets: cloneMockAssetsSearchItems
      };
      const result = await searchAssetsWorkAreaUseCase.execute(searchAssetsWorkAreaCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });
  });
});

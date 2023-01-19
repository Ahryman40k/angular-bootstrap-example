import {
  ErrorCodes,
  ExternalReferenceType,
  IAsset,
  IAssetLastIntervention,
  IEnrichedIntervention,
  InterventionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { createMockIntervention } from '../../../../../tests/data/interventionData';
import {
  assertFailures,
  destroyDBTests,
  INVALID_TYPE,
  INVALID_UUID,
  mergeProperties
} from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { appUtils } from '../../../../utils/utils';
import { EXISTING_NEXO_DOSSIER } from '../../../importNexo/tests/nexoTestHelper';
import { ISearchAssetsLastInterventionCommandProps } from '../../useCases/searchAssetsLastIntervention/searchAssetsLastInterventionCommand';
import { searchAssetsLastInterventionUseCase } from '../../useCases/searchAssetsLastIntervention/searchAssetsLastInterventionUseCase';
import { createAssetModel } from '../assetTestHelper';

const currentYear = appUtils.getCurrentYear();
const previousYear = currentYear - 1;
const assetIds = ['21', '22'];
async function createInitialIntervention(mockAssets: IAsset[]): Promise<IEnrichedIntervention[]> {
  return Promise.all(
    [
      {
        assets: [mockAssets[0]],
        planificationYear: previousYear,
        status: InterventionStatus.waiting
      },
      {
        assets: [mockAssets[1]],
        planificationYear: currentYear,
        status: InterventionStatus.canceled
      }
    ].map(interventionProps => createMockIntervention(interventionProps))
  );
}

// tslint:disable:max-func-body-length
describe(`SearchAssetsLastInterventionUseCase`, () => {
  const mockAssets = assetIds.map(id =>
    createAssetModel({
      id,
      externalReferenceIds: [
        {
          type: ExternalReferenceType.nexoAssetId,
          value: EXISTING_NEXO_DOSSIER
        }
      ]
    })
  );
  beforeEach(async () => {
    await createInitialIntervention(mockAssets);
  });
  afterEach(async () => {
    await destroyDBTests();
  });
  describe(`Negative`, () => {
    [
      {
        description: 'missing assetIds and assetExternalReferenceIds',
        requestError: {
          assetIds: undefined,
          assetExternalReferenceIds: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assetIds / assetExternalReferenceIds',
            code: ErrorCodes.MissingValue,
            message: `Must have a value for at least one of following fields: assetIds,assetExternalReferenceIds`
          }
        ]
      },
      {
        description: 'missing planificationYear',
        requestError: {
          planificationYear: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'planificationYear',
            code: ErrorCodes.MissingValue,
            message: `planificationYear is null or undefined`
          }
        ]
      },
      {
        description: 'assetIds must be an array',
        requestError: {
          assetIds: 34223
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assetIds',
            code: ErrorCodes.InvalidInput,
            message: `assetIds must be an array`
          }
        ]
      },
      {
        description: 'assetIds is an array of number',
        requestError: {
          assetIds: [201410, 201392]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'AssetsLastInterventionSearchRequest',
            code: 'openApiInputValidator',
            message: `assetIds0 (201410) is not a type of string; assetIds1 (201392) is not a type of string`
          }
        ]
      },
      {
        description: 'assetExternalReferenceIds must be an array',
        requestError: {
          assetExternalReferenceIds: 34223
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assetExternalReferenceIds',
            code: ErrorCodes.InvalidInput,
            message: `assetExternalReferenceIds must be an array`
          }
        ]
      },
      {
        description: 'assetExternalReferenceIds type and value are numbers',
        requestError: {
          assetExternalReferenceIds: [{ type: 201410, value: 201392 }]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'AssetsLastInterventionSearchRequest',
            code: 'openApiInputValidator',
            message: `type (201410) is not a type of string; value (201392) is not a type of string`
          }
        ]
      },
      {
        description: 'assetExternalReferenceIds is an array of number',
        requestError: {
          assetExternalReferenceIds: [201410, 201392]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'AssetsLastInterventionSearchRequest',
            code: 'openApiInputValidator',
            message: `Unable to validate a model with a type: number, expected: object; Unable to validate a model with a type: number, expected: object`
          }
        ]
      },
      {
        description: 'invalid assetType',
        requestError: {
          planificationYear: 'planificationYear'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'planificationYear',
            code: ErrorCodes.InvalidInput,
            message: `planificationYear has a bad format`
          }
        ]
      },
      {
        description: 'external reference type do not exists',
        requestError: {
          assetExternalReferenceIds: [
            {
              type: INVALID_TYPE,
              value: EXISTING_NEXO_DOSSIER
            }
          ]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'assetExternalReferenceIds[0].type',
            code: ErrorCodes.InvalidInput,
            message: `Taxonomy code: InvalidType doesn't exist`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const searchAssetsLastInterventionCommand: ISearchAssetsLastInterventionCommandProps = {
          assetIds,
          planificationYear: currentYear
        };
        const result = await searchAssetsLastInterventionUseCase.execute(
          mergeProperties(searchAssetsLastInterventionCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`Positive`, () => {
    [
      {
        description: 'asset id do not exists',
        commandProps: { assetIds: [INVALID_UUID] },
        expectedResult: {
          assetId: INVALID_UUID
        }
      },
      {
        description: 'external reference value do not exists',
        commandProps: {
          assetExternalReferenceIds: [
            {
              type: ExternalReferenceType.nexoAssetId,
              value: INVALID_UUID
            }
          ]
        },
        expectedResult: {
          assetExternalReferenceId: {
            type: ExternalReferenceType.nexoAssetId,
            value: INVALID_UUID
          }
        }
      }
    ].forEach(test => {
      it(`should return a null intervention when given ${test.description}`, async () => {
        const searchAssetsLastInterventionCommand: ISearchAssetsLastInterventionCommandProps = {
          planificationYear: currentYear,
          ...test.commandProps
        };
        const result = await searchAssetsLastInterventionUseCase.execute(searchAssetsLastInterventionCommand);
        assert.isTrue(result.isRight());
        const responses = result.value.getValue() as IAssetLastIntervention[];
        const response = responses.find(r => r);
        Object.keys(test.expectedResult).forEach(key => {
          assert.deepEqual(response[key], test.expectedResult[key]);
        });
        assert.isNull(response.intervention);
      });
    });

    it(`should return empty intervention when intervention is canceled`, async () => {
      const searchAssetsLastInterventionCommand: ISearchAssetsLastInterventionCommandProps = {
        assetIds: [assetIds[1]],
        planificationYear: currentYear
      };
      const result = await searchAssetsLastInterventionUseCase.execute(searchAssetsLastInterventionCommand);
      assert.isTrue(result.isRight());
      const responses = result.value.getValue() as IAssetLastIntervention[];
      const response = responses.find(r => r);
      assert.strictEqual(response.assetId, assetIds[1]);
      assert.isNull(response.intervention);
    });
  });
});

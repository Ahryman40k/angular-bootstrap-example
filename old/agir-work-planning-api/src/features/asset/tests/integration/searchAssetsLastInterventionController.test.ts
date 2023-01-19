import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  ExternalReferenceType,
  IAssetLastIntervention,
  IAssetsLastInterventionSearchRequest,
  IEnrichedIntervention,
  IExternalReferenceId,
  InterventionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isNil, omit } from 'lodash';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { createMockIntervention } from '../../../../../tests/data/interventionData';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { appUtils } from '../../../../utils/utils';
import { Audit } from '../../../audit/audit';
import { auditMapperDTO } from '../../../audit/mappers/auditMapperDTO';
import { EXISTING_NEXO_DOSSIER } from '../../../importNexo/tests/nexoTestHelper';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { getInterventionForAssetsLastIntervention } from '../assetLastInterventionTestHelper';
import { createAssetModel } from '../assetTestHelper';

// tslint:disable:max-func-body-length
describe('SearchAssetsLastInterventionController', () => {
  const currentYear = appUtils.getCurrentYear();
  const previousYear = currentYear - 1;
  const assetIds = ['21', '22', '23'];

  let mockInterventionCurrentYear0: IEnrichedIntervention;
  let mockInterventionPreviousYear2: IEnrichedIntervention;
  let mockClonedInterventionPreviousYear2: IEnrichedIntervention;
  const externalReferenceTypes = [
    ExternalReferenceType.nexoAssetId,
    ExternalReferenceType.infoRtuId,
    ExternalReferenceType.infoRtuId
  ];
  const mockAssets = assetIds.map((id, idx) =>
    createAssetModel({
      id,
      externalReferenceIds: [
        {
          type: externalReferenceTypes[idx],
          value: `${EXISTING_NEXO_DOSSIER}_${idx}`
        }
      ]
    })
  );

  describe('/v1/assets/search/lastIntervention - POST', () => {
    function assertAssetsLastIntervention(
      assetLastIntervention: IAssetLastIntervention,
      mockIntervention: IEnrichedIntervention,
      assetId?: string,
      assetExternalReferenceId?: IExternalReferenceId
    ): void {
      assertAssetId(assetId, assetLastIntervention);
      assertAssetExternalRefencenceId(assetExternalReferenceId, assetLastIntervention);

      assert.strictEqual(assetLastIntervention.intervention.id, mockIntervention.id);
      assert.strictEqual(assetLastIntervention.intervention.planificationYear, mockIntervention.planificationYear);
    }

    function assertAssetId(assetId: string, assetLastIntervention: IAssetLastIntervention): void {
      if (isNil(assetId)) {
        return;
      }
      assert.strictEqual(assetLastIntervention.assetId, assetId, assetLastIntervention.assetId);
    }

    function assertAssetExternalRefencenceId(
      assetExternalReferenceId: IExternalReferenceId,
      assetLastIntervention: IAssetLastIntervention
    ): void {
      if (isNil(assetExternalReferenceId)) {
        return;
      }
      assert.deepEqual(
        assetLastIntervention.assetExternalReferenceId,
        assetExternalReferenceId,
        `${assetLastIntervention.assetExternalReferenceId.type} : ${assetLastIntervention.assetExternalReferenceId.value}`
      );
    }

    async function createIntervention(props: Partial<IEnrichedIntervention>): Promise<IEnrichedIntervention> {
      return createMockIntervention({
        planificationYear: currentYear,
        status: InterventionStatus.waiting,
        ...props,
        audit: await auditMapperDTO.getFromModel(Audit.fromCreateContext())
      });
    }

    describe('Positive', () => {
      let mockInterventions: IEnrichedIntervention[];
      beforeEach(async () => {
        mockInterventionCurrentYear0 = await createIntervention({
          assets: [mockAssets[0]]
        });
        mockInterventionPreviousYear2 = await createIntervention({
          assets: [mockAssets[2]],
          planificationYear: previousYear
        });
        mockClonedInterventionPreviousYear2 = await createIntervention(omit(mockInterventionPreviousYear2, 'id'));
        await createIntervention({
          assets: [mockAssets[1]],
          status: InterventionStatus.canceled
        });
        mockInterventions = await interventionRepository.findAll(
          InterventionFindOptions.create({
            criterias: {},
            orderBy: '-createdAt'
          }).getValue()
        );
      });
      afterEach(async () => {
        await destroyDBTests();
      });

      it(`should return an array of assetLastIntervention`, async () => {
        const url = appUtils.createPublicFullPath(
          constants.locationPaths.ASSETS_SEARCH_LAST_INTERVENTION,
          EndpointTypes.API
        );
        const assetsLastInterventionSearchRequest: IAssetsLastInterventionSearchRequest = {
          assetIds,
          planificationYear: currentYear
        };
        const response = await requestService.post(url, { body: assetsLastInterventionSearchRequest });
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const assetsLastIntervention: IAssetLastIntervention[] = response.body;
        // Must returns only the valid last intervention
        assert.lengthOf(assetsLastIntervention, 3);

        assertAssetsLastIntervention(assetsLastIntervention[0], mockInterventionCurrentYear0, assetIds[0]);
        assertAssetsLastIntervention(assetsLastIntervention[2], mockClonedInterventionPreviousYear2, assetIds[2]);

        assert.strictEqual(assetsLastIntervention[1].assetId, assetIds[1]);
        assert.isNull(assetsLastIntervention[1].intervention);
      });

      [
        {
          description: 'asset id and external reference which are present on same asset',
          commandProps: {
            assetIds: [assetIds[0]],
            assetExternalReferenceIds: [{ type: externalReferenceTypes[0], value: `${EXISTING_NEXO_DOSSIER}_0` }]
          },
          expected: {
            count: 1,
            assetLastInterventions: [
              {
                assetId: assetIds[0],
                assetExternalReferenceId: { type: externalReferenceTypes[0], value: `${EXISTING_NEXO_DOSSIER}_0` },
                intervention: undefined
              }
            ] as IAssetLastIntervention[]
          }
        },
        {
          description: 'asset id and external reference which are present on different assets',
          commandProps: {
            assetIds: [assetIds[0]],
            assetExternalReferenceIds: [{ type: externalReferenceTypes[2], value: `${EXISTING_NEXO_DOSSIER}_2` }]
          },
          expected: {
            count: 2,
            assetLastInterventions: [
              {
                assetId: assetIds[0],
                intervention: undefined
              },
              {
                assetExternalReferenceId: { type: externalReferenceTypes[2], value: `${EXISTING_NEXO_DOSSIER}_2` },
                intervention: undefined
              }
            ] as IAssetLastIntervention[]
          }
        },
        {
          description: 'asset id and external reference grouped',
          commandProps: {
            assetIds: [assetIds[2]],
            assetExternalReferenceIds: [{ type: externalReferenceTypes[2], value: `${EXISTING_NEXO_DOSSIER}_2` }]
          },
          expected: {
            count: 1,
            assetLastInterventions: [
              {
                assetId: assetIds[2],
                intervention: undefined
              },
              {
                assetExternalReferenceId: { type: externalReferenceTypes[2], value: `${EXISTING_NEXO_DOSSIER}_2` },
                intervention: undefined
              }
            ] as IAssetLastIntervention[]
          }
        }
      ].forEach(test => {
        it(`should return ${test.expected.count} assetLastIntervention(s) when searching with ${test.description}`, async () => {
          const url = appUtils.createPublicFullPath(
            constants.locationPaths.ASSETS_SEARCH_LAST_INTERVENTION,
            EndpointTypes.API
          );

          test.expected.assetLastInterventions = test.expected.assetLastInterventions.map(
            (assetLastIntervention: IAssetLastIntervention) => {
              return getInterventionForAssetsLastIntervention(assetLastIntervention, mockInterventions);
            }
          );

          const assetsLastInterventionSearchRequest: IAssetsLastInterventionSearchRequest = {
            planificationYear: currentYear,
            ...test.commandProps
          };
          const response = await requestService.post(url, { body: assetsLastInterventionSearchRequest });
          assert.strictEqual(response.status, HttpStatusCodes.OK);
          const assetLastInterventions: IAssetLastIntervention[] = response.body;
          // Must returns only the valid intervention
          assert.lengthOf(assetLastInterventions, test.expected.count);

          assetLastInterventions.forEach((assetLastIntervention, idx) => {
            const expectedAssetLastIntervention = test.expected.assetLastInterventions[idx];
            assertAssetsLastIntervention(
              assetLastIntervention,
              expectedAssetLastIntervention.intervention as IEnrichedIntervention,
              expectedAssetLastIntervention.assetId,
              expectedAssetLastIntervention.assetExternalReferenceId
            );
          });
        });
      });
    });
  });
});

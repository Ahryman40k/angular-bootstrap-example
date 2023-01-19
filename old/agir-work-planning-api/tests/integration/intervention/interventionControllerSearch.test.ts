import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  IEnrichedIntervention,
  IEnrichedPaginatedInterventions,
  IInterventionPaginatedSearchRequest,
  InterventionExternalReferenceType,
  InterventionStatus,
  InterventionType,
  MedalType,
  ProgramBookStatus,
  ProjectStatus,
  Role
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { get } from 'lodash';
import sinon = require('sinon');
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import {
  createEnrichedInterventionList,
  getInterventionsSearch
} from '../../../scripts/load_data/outils/interventionDataOutils';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { getAssetProps, getFeature } from '../../../src/features/asset/tests/assetTestHelper';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { spatialAnalysisService } from '../../../src/services/spatialAnalysisService';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { appUtils, isPaginatedResult } from '../../../src/utils/utils';
import { createInterventionModel, interventionDataAssetForTest } from '../../data/interventionData';
import { programBooksData } from '../../data/programBooksData';
import { requestService } from '../../utils/requestService';
import { createMany, destroyDBTests } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe('Intervention Controller - Search', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);

  /**
   * Setup the interventions for the tests.
   * You can specify which roles the interventions are shared with.
   * Creates an annual program with program books and projects.
   * @param sharedRoles The roles that can access the interventions.
   */
  async function setupInterventions(sharedRoles?: Role[]): Promise<IEnrichedIntervention[]> {
    const interventions = await createMany(createEnrichedInterventionList(), interventionRepository);
    const annualProgram = await createAndSaveAnnualProgram({
      status: AnnualProgramStatus.programming,
      sharedRoles
    });
    const programBook = await createAndSaveProgramBook({
      annualProgram,
      status: ProgramBookStatus.programming,
      sharedRoles
    });
    const project = await programBooksData.createMockProjectInProgramBook(programBook, {
      interventionIds: interventions.map(i => i.id),
      status: ProjectStatus.programmed
    });
    for (const intervention of interventions) {
      intervention.project = { id: project.id };
      const interventionSaveResult = await interventionRepository.save(intervention);
      if (interventionSaveResult.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult)));
      }
    }

    return interventions;
  }

  after(async () => {
    await integrationAfter();
  });

  describe('POST /interventions/search', () => {
    let mockInterventions: IEnrichedIntervention[];
    beforeEach(async () => {
      mockInterventions = await setupInterventions();
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    after(() => {
      sandbox.restore();
    });

    function searchInterventions(searchRequest: IInterventionPaginatedSearchRequest): Promise<request.Response> {
      return requestService.post(`${apiUrl}/search`, { body: searchRequest });
    }

    it('C57776  Positive - Should return interventions when searching with a string', async () => {
      const searchRequest: IInterventionPaginatedSearchRequest = { boroughId: 'VM' };

      const response = await searchInterventions(searchRequest);
      const paginatedInterventions = response.body as IEnrichedPaginatedInterventions;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(paginatedInterventions);
      assert.ok(paginatedInterventions.items?.length);
      assert.isTrue(paginatedInterventions.items.every(i => i.boroughId === 'VM'));
    });

    it('Positive - Should return interventions when searching with ids', async () => {
      const idsWanted = [mockInterventions[0].id, mockInterventions[1].id];
      const searchRequest: IInterventionPaginatedSearchRequest = { id: idsWanted };

      const response = await searchInterventions(searchRequest);
      assert.strictEqual(response.status, HttpStatusCodes.OK);

      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.notEqual(interventions.length, mockInterventions.length);
      assert.lengthOf(interventions, idsWanted.length);
      assert.isTrue(interventions.every(i => idsWanted.includes(i.id)));
      assert.isTrue(isPaginatedResult(response.body));
    });

    it('C57777  Positive - Should return interventions when searching with a string array', async () => {
      const statuses: string[] = [InterventionStatus.integrated, InterventionStatus.wished];
      const searchRequest: IInterventionPaginatedSearchRequest = {
        status: statuses
      };

      const response = await searchInterventions(searchRequest);
      const paginatedInterventions = response.body as IEnrichedPaginatedInterventions;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(paginatedInterventions);
      assert.ok(paginatedInterventions.items?.length);
      assert.isTrue(paginatedInterventions.items.every(i => statuses.includes(i.status)));
    });

    it('C57778  Positive - Should return interventions when searching with a number', async () => {
      const searchRequest: IInterventionPaginatedSearchRequest = {
        interventionYear: appUtils.getCurrentYear()
      };

      const response = await searchInterventions(searchRequest);
      const paginatedInterventions = response.body as IEnrichedPaginatedInterventions;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(paginatedInterventions);
      assert.ok(paginatedInterventions.items?.length);
      assert.isTrue(paginatedInterventions.items.every(i => i.interventionYear === appUtils.getCurrentYear()));
    });

    it('C57779  Positive - Should return interventions when searching with a number range', async () => {
      const searchRequest: IInterventionPaginatedSearchRequest = {
        fromEstimate: 2000,
        toEstimate: 2500
      };

      const response = await searchInterventions(searchRequest);
      const paginatedInterventions = response.body as IEnrichedPaginatedInterventions;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(paginatedInterventions);
      assert.ok(paginatedInterventions.items?.length);
      assert.isTrue(
        paginatedInterventions.items.every(
          i => i.estimate.allowance >= searchRequest.fromEstimate && i.estimate.allowance <= searchRequest.toEstimate
        )
      );
    });

    it('C57780  Positive - Should return interventions when searching with a boolean', async () => {
      const searchRequest: IInterventionPaginatedSearchRequest = {
        interventionTypeId: InterventionType.initialNeed
      };

      const response = await searchInterventions(searchRequest);
      const paginatedInterventions = response.body as IEnrichedPaginatedInterventions;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(paginatedInterventions);
      assert.ok(paginatedInterventions.items?.length);
      assert.isTrue(paginatedInterventions.items.every(i => i.interventionTypeId === InterventionType.initialNeed));
    });

    it('C64819  Positive - Should return interventions when searching with medal ID', async () => {
      const searchRequests: IInterventionPaginatedSearchRequest[] = [
        { medalId: MedalType.bronze },
        { medalId: [MedalType.gold, MedalType.platinum] }
      ];

      for (const searchRequest of searchRequests) {
        const response = await searchInterventions(searchRequest);
        const paginatedInterventions = response.body as IEnrichedPaginatedInterventions;

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.ok(paginatedInterventions);
        assert.ok(paginatedInterventions.items?.length);
        assert.isTrue(paginatedInterventions.items.every(i => searchRequest.medalId.includes(i.medalId)));
      }
    });

    it('Positive - Should be able to search intervention and expand of assets', async () => {
      const searchRequest: IInterventionPaginatedSearchRequest = { id: 'I00864', expand: 'assets' };

      const response = await searchInterventions(searchRequest);
      const interventions = (response.body as IEnrichedPaginatedInterventions).items;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(interventions.every(intervention => intervention.id === 'I00864'));
      assert.isTrue(
        interventions.every(intervention => intervention.assets.every(asset => asset.hasOwnProperty('properties')))
      );
      assert.isTrue(
        interventions.every(intervention =>
          intervention.assets.every(asset => asset.properties.hasOwnProperty('installationDate'))
        )
      );
    });
  });

  describe('GET /interventions/search', () => {
    const INTERVENTION_NAME_PARTIAL: string = 'name';
    async function setupSearchInterventions() {
      const interventions: IEnrichedIntervention[] = [];
      const year = appUtils.getCurrentYear();
      const interventionSaveResult1 = await interventionRepository.save(
        createInterventionModel({
          interventionName: `Random ${INTERVENTION_NAME_PARTIAL} intervention`,
          assets: [getAssetProps({ ...interventionDataAssetForTest, id: 'R145' })],
          externalReferenceIds: [
            {
              type: InterventionExternalReferenceType.nexoReferenceNumber,
              value: '19-VMA-PTI-043-AQ1'
            }
          ]
        })
      );
      if (interventionSaveResult1.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult1)));
      }
      const interventionSaveResult2 = await interventionRepository.save(
        createInterventionModel({
          interventionName: `Random ${INTERVENTION_NAME_PARTIAL} intervention 2`,
          interventionYear: year + 1
        })
      );
      if (interventionSaveResult2.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult2)));
      }
      interventions.push(interventionSaveResult1.getValue());
      interventions.push(interventionSaveResult2.getValue());
      return interventions;
    }

    before(() => {
      const featureMock = getFeature({
        properties: {
          id: 'R145'
        }
      });
      sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([featureMock]));
    });

    after(() => {
      sandbox.restore();
    });

    let mockInterventions: IEnrichedIntervention[];
    beforeEach(async () => {
      mockInterventions = await setupSearchInterventions();
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    it('C57975 - Positive - Should be able to search intervention with id', async () => {
      const response = await getInterventionsSearch(apiUrl, `q=${mockInterventions[0].id}`);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(interventions.every(intervention => intervention.id === mockInterventions[0].id));
    });

    [
      {
        description: 'name',
        searchQuery: INTERVENTION_NAME_PARTIAL,
        expected: {
          path: 'interventionName',
          value: INTERVENTION_NAME_PARTIAL
        }
      },
      {
        description: 'externalReferenceIds',
        searchQuery: '19-VMA-PTI',
        expected: {
          path: 'externalReferenceIds[0].value',
          value: '19-VMA-PTI-043-AQ1'
        }
      }
    ].forEach(test => {
      it(`Positive - Should be able to search intervention by ${test.description}`, async () => {
        const response = await getInterventionsSearch(apiUrl, `q=${test.searchQuery}`);
        const interventions: IEnrichedIntervention[] = response.body.items;
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.isTrue(
          interventions.every(intervention => get(intervention, test.expected.path).includes(test.expected.value))
        );
      });
    });

    it('Positive - Should be able to search intervention and expand of assets', async () => {
      const response = await getInterventionsSearch(apiUrl, `q=${mockInterventions[0].id}&expand=assets`);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(interventions.every(intervention => intervention.id === mockInterventions[0].id));
      assert.isTrue(
        interventions.every(intervention => intervention.assets.every(asset => asset.hasOwnProperty('properties')))
      );
      assert.isTrue(
        interventions.every(intervention =>
          intervention.assets.every(asset => asset.properties.hasOwnProperty('installationDate'))
        )
      );
    });
  });
});

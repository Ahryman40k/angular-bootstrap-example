import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  BoroughCode,
  IEnrichedIntervention,
  InterventionStatus,
  InterventionType,
  ProgramBookStatus,
  ProjectStatus,
  Role
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { constants, EndpointTypes } from '../../../config/constants';
import {
  createEnrichedInterventionList,
  createEnrichedInterventionModel,
  getInterventionsSearch
} from '../../../scripts/load_data/outils/interventionDataOutils';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { db } from '../../../src/features/database/DB';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { EXECUTOR_BOROUGH, EXECUTOR_OTHER } from '../../../src/shared/taxonomies/constants';
import { enumValues } from '../../../src/utils/enumUtils';
import { appUtils } from '../../../src/utils/utils';
import { getMinimalInitialIntervention } from '../../data/interventionData';
import { programBooksData } from '../../data/programBooksData';
import { createMockProject } from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { createMany, destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable:max-func-body-length
describe('Intervention Controller - Filter', () => {
  const apiGetUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  let programBook: ProgramBook;

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
    programBook = await createAndSaveProgramBook({
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
      intervention.status = InterventionStatus.integrated;
      await interventionRepository.save(intervention);
    }

    return interventions;
  }

  after(async () => {
    await integrationAfter();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/interventions - filter by program book', () => {
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await interventionRepository.save(getMinimalInitialIntervention());
      await setupInterventions();
    });

    afterEach(() => {
      userMocker.reset();
    });

    it('C57560 - Positive - Should be able to filter by program book', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `programBookId=${programBook.id}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const project = await projectRepository.findById(response.body.items[0].project.id);
      assert.strictEqual(project.annualDistribution.annualPeriods[0].programBookId.toString(), programBook.id);
      assert.isTrue(project.interventionIds.includes(response.body.items[0].id));
    });
  });

  describe('/interventions - filter with a from/to estimate', () => {
    it('C57859 - Positive - Should be able to filter within the estimate range', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `fromEstimate=1&toEstimate=99999`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(interventions.every(intervention => intervention.estimate >= 1 && intervention.estimate <= 99999));
    });

    it('C57860 - Positive - Should return an empty array if no interventions fit within the estimate range', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `fromEstimate=1&toEstimate=2`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.lengthOf(response.body.items, 0);
    });

    it('C57861 - Negative - Should not be able to filter with a starting estimate bigger than the arriving estimate', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `fromEstimate=99999&toEstimate=1`);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C57862 - Positive - Should be able to filter with an arriving estimate', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `toEstimate=99999`);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(interventions.every(intervention => intervention.estimate <= 99999));
    });

    it('C57863 - Positive - Should be able to filter with a starting estimate range', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `fromEstimate=1`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(interventions.every(intervention => intervention.estimate >= 1));
    });
  });

  describe('/interventions - filter by borough', () => {
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await interventionRepository.save(getMinimalInitialIntervention());
      await setupInterventions();
    });

    afterEach(() => {
      userMocker.reset();
    });

    it('C57883 - Positive - Should be able to filter by borough', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `boroughId=${BoroughCode.VM}`);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(interventions.every(intervention => intervention.boroughId === BoroughCode.VM));
    });
  });

  describe('/interventions - filter by requestors', () => {
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await interventionRepository.save(getMinimalInitialIntervention());
      await setupInterventions();
    });

    afterEach(() => {
      userMocker.reset();
    });

    it('C57719 - Positive - Should be able to filter interventions by requestors', async () => {
      const response = await getInterventionsSearch(apiGetUrl, 'requestorId=bell');
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items[0].requestorId, 'bell');
    });
  });

  describe('/interventions - filter by interventionType', () => {
    async function setupInterventionsWithType() {
      await Promise.all(
        [InterventionType.initialNeed, InterventionType.opportunity, InterventionType.followup].map(
          async interventionTypeId => {
            await interventionRepository.save(createEnrichedInterventionModel({ interventionTypeId }));
          }
        )
      );
    }
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await interventionRepository.save(getMinimalInitialIntervention());
      await setupInterventionsWithType();
    });

    afterEach(() => {
      userMocker.reset();
    });

    it('C57913 - Positive - Should be able to filter interventions with type follow up', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `interventionTypeId=${InterventionType.followup}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(interventions.every(intervention => intervention.interventionTypeId === InterventionType.followup));
    });

    it('C57937 - Positive - Should be able to filter interventions with more than one type', async () => {
      const response = await getInterventionsSearch(
        apiGetUrl,
        `interventionTypeId=${InterventionType.followup}&interventionTypeId=${InterventionType.opportunity}`
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(
        interventions.every(
          intervention =>
            intervention.interventionTypeId === InterventionType.followup ||
            intervention.interventionTypeId === InterventionType.opportunity
        )
      );
    });

    it('C57914 - Positive - Should be able to filter interventions with type initial need', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `interventionTypeId=${InterventionType.initialNeed}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(
        interventions.every(intervention => intervention.interventionTypeId === InterventionType.initialNeed)
      );
    });

    it('C57915 - Positive - Should be able to filter interventions with type opportunity', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `interventionTypeId=${InterventionType.opportunity}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(
        interventions.every(intervention => intervention.interventionTypeId === InterventionType.opportunity)
      );
    });

    it('C57916 - Negative - Should not be able to filter interventions with a wrong type', async () => {
      const response = await getInterventionsSearch(apiGetUrl, 'interventionTypeId=wrong');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
  describe('/interventions - filter by status', () => {
    async function setupInterventionsWithStatus() {
      await Promise.all(
        enumValues<InterventionStatus>(InterventionStatus).map(async status => {
          await interventionRepository.save(createEnrichedInterventionModel({ status }));
        })
      );
    }
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await interventionRepository.save(getMinimalInitialIntervention());
      await setupInterventionsWithStatus();
    });

    afterEach(() => {
      userMocker.reset();
    });

    [
      {
        status: InterventionStatus.accepted
      },
      {
        status: InterventionStatus.canceled
      },
      {
        status: InterventionStatus.integrated
      },
      {
        status: InterventionStatus.refused
      },
      {
        status: InterventionStatus.waiting
      },
      {
        status: InterventionStatus.wished
      }
    ].forEach(test => {
      it(`Positive - Should be able to filter interventions with status ${test.status}`, async () => {
        const response = await getInterventionsSearch(apiGetUrl, `status=${test.status}`);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const interventions: IEnrichedIntervention[] = response.body.items;
        assert.isTrue(interventions.every(intervention => intervention.status === test.status));
      });
    });

    it('C57932 - Positive - Should be able to filter interventions with type and status', async () => {
      await Promise.all(
        [
          {
            interventionTypeId: InterventionType.opportunity,
            status: InterventionStatus.integrated
          },
          {
            interventionTypeId: InterventionType.opportunity,
            status: InterventionStatus.integrated
          },
          {
            status: InterventionStatus.integrated
          }
        ].map(async data => {
          await interventionRepository.save(createEnrichedInterventionModel({ ...data }));
        })
      );
      const response = await getInterventionsSearch(
        apiGetUrl,
        `interventionTypeId=${InterventionType.opportunity}&status=${InterventionStatus.integrated}`
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(
        interventions.every(
          intervention =>
            intervention.interventionTypeId === InterventionType.opportunity &&
            intervention.status === InterventionStatus.integrated
        )
      );
    });

    it('C57933 - Negative - Should not be able to filter interventions with a wrong status', async () => {
      const response = await getInterventionsSearch(apiGetUrl, `status=wrong`);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/interventions - filter by executors', () => {
    beforeEach(async () => {
      const minimalIntervention = getMinimalInitialIntervention();
      minimalIntervention.executorId = EXECUTOR_BOROUGH;
      const mockIntervention = (await interventionRepository.save(minimalIntervention)).getValue();
      await createMockProject({ interventionIds: [mockIntervention.id], executorId: EXECUTOR_BOROUGH });
      await setupInterventions();
    });

    it('C59519 - Positive - Should be able to filter interventions by a single executor', async () => {
      const executorId = EXECUTOR_BOROUGH;
      const response = await getInterventionsSearch(apiGetUrl, { executorId });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isArray(interventions);
      assert.isTrue(interventions.length > 0);
      assert.isTrue(interventions.every(i => (i.executorId = executorId)));
    });

    it('C59520 - Positive - Should be able to filter interventions by executors', async () => {
      const executorIds: string[] = [EXECUTOR_OTHER, EXECUTOR_BOROUGH];
      const response = await getInterventionsSearch(apiGetUrl, { executorId: executorIds });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isArray(interventions);
      assert.isTrue(interventions.length > 0);
      assert.isTrue(interventions.every(intervention => executorIds.includes(intervention.executorId)));
    });

    it('C59521 - Negative - Should not be able to filter interventions with a wrong executor', async () => {
      const executorId = 'potatoes';
      const response = await getInterventionsSearch(apiGetUrl, { executorId });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/interventions - filter by work types', () => {
    beforeEach(async () => {
      await db().models.Intervention.create(createEnrichedInterventionList());
    });

    it('C59562 - Positive - Should be able to filter interventions by a single work type', async () => {
      const workTypeId = 'rehabilitation';
      const response = await getInterventionsSearch(apiGetUrl, { workTypeId });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(interventions.length > 0);
      assert.isArray(interventions);
      assert.isTrue(interventions.every(intervention => intervention.workTypeId === workTypeId));
    });

    it('C59563 - Positive - Should be able to filter interventions by work types', async () => {
      const workTypeIds = ['rehabilitation', 'repair'];
      const response = await getInterventionsSearch(apiGetUrl, { workTypeId: workTypeIds });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.isTrue(interventions.length > 0);
      assert.isArray(interventions);
      assert.isTrue(interventions.every(intervention => workTypeIds.includes(intervention.workTypeId)));
    });

    it('C59564 - Negative - Should not be able to filter interventions with a wrong work type', async () => {
      const workTypeId = 'potatoes';
      const response = await getInterventionsSearch(apiGetUrl, { workTypeId });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
});

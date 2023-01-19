import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  IEnrichedIntervention,
  Permission,
  ProgramBookStatus,
  ProjectDecisionType,
  ProjectStatus,
  Role
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { createEnrichedInterventionList } from '../../../scripts/load_data/outils/interventionDataOutils';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { createAndSaveIntervention } from '../../../src/features/interventions/tests/interventionTestHelper';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { createAndSaveProject } from '../../../src/features/projects/tests/projectTestHelper';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { appUtils } from '../../../src/utils/utils';
import { programBooksData } from '../../data/programBooksData';
import { getProjectDecision } from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { createMany, destroyDBTests, getFutureYear } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable:max-func-body-length
describe('Intervention Controller - Share', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  let interventionsInternalGuestRestricted: IEnrichedIntervention[];
  let interventionsNotShared: IEnrichedIntervention[];

  after(async () => {
    await integrationAfter();
  });

  beforeEach(async () => {
    userMocker.mock(userMocks.internalGuestRestricted);
    interventionsInternalGuestRestricted = await setupInterventions([Role.INTERNAL_GUEST_RESTRICTED]);
    interventionsNotShared = await setupInterventions(); // Creates interventions that are not shared.
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

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

  function assertInterventionInternalGuestRestricted(intervention: IEnrichedIntervention) {
    assert.isUndefined(intervention.documents);
    assert.isUndefined(intervention.comments);
    assert.isUndefined(intervention.contact);
    assert.isUndefined(intervention.decisions);
    assert.isUndefined(intervention.estimate);
    assert.isUndefined(intervention.interventionYear);
  }

  describe('/interventions/:id > GET', () => {
    it('C57334 - Positive - Should be able to view the filtered properties of a programmed project intervention in relation to the permission of an restricted internal guest', async () => {
      const sharedIntervention = interventionsInternalGuestRestricted[0];
      const response = await requestService.get(`${apiUrl}/${sharedIntervention.id}`, {});
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assertInterventionInternalGuestRestricted(response.body);
    });

    it('C57392  Negative - Should not retrieve an intervention that is not shared', async () => {
      const notSharedIntervention = interventionsNotShared[0];
      const response = await requestService.get(`${apiUrl}/${notSharedIntervention.id}`, {});
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });

  describe('/interventions > GET', () => {
    function getInterventions(): Promise<request.Response> {
      return requestService.get(apiUrl, {});
    }

    it('C57336 - Positive - Should be able to view the filtered properties of a programmed project intervention in relation to the permission of an restricted internal guest', async () => {
      const response = await requestService.get(apiUrl, {});
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      for (const item of response.body.items) {
        assertInterventionInternalGuestRestricted(item);
      }
    });

    it('C57393  Positive - Should retrieve shared interventions only', async () => {
      const response = await getInterventions();
      const interventions = response.body.items as IEnrichedIntervention[];

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(interventions);
      assert.strictEqual(interventions.length, interventionsInternalGuestRestricted.length);
      assert.deepEqual(interventions.map(i => i.id).sort(), interventionsInternalGuestRestricted.map(i => i.id).sort());
    });

    it(`Positive - Should retrieve interventions that are NOT in a shared program book if has Permission ${Permission.PROJECT_WITH_POSTPONED_DECISION_READ}`, async () => {
      await destroyDBTests();
      userMocker.mock(userMocks.executor);
      const annualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.programming
      });
      const programBook = await createAndSaveProgramBook({
        annualProgram,
        status: ProgramBookStatus.programming
      });
      let project = await createAndSaveProject(
        {
          boroughId: programBook.boroughIds.find(b => b),
          decisions: [getProjectDecision(ProjectDecisionType.postponed, appUtils.getCurrentYear(), getFutureYear(2))]
        },
        programBook.id
      );
      const intervention = await createAndSaveIntervention({
        project
      });
      project.interventionIds = [intervention.id];
      project = (await projectRepository.save(project)).getValue();

      const response = await getInterventions();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const interventions: IEnrichedIntervention[] = response.body.items;
      assert.strictEqual(interventions.length, 1);
    });

    it('C57397 - Positive - Should not be able to view intervention private comments as a requestor', async () => {
      await setupInterventions([Role.REQUESTOR]);
      userMocker.mock(userMocks.requestor);
      try {
        const response = await getInterventions();
        const interventions: IEnrichedIntervention[] = response.body.items;
        const comments = _.flatten(interventions.map(i => i.comments).filter(c => c));

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.isTrue(comments.every(c => c.isPublic));
      } finally {
        userMocker.reset();
      }
    });
  });
});

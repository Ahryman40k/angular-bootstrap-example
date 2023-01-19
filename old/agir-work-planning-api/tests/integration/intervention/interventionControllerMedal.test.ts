import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  IPlainIntervention,
  MedalType,
  ProjectStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { cloneDeep } from 'lodash';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { appUtils } from '../../../src/utils/utils';
import {
  createMockIntervention,
  getProjectInterventionToIntegrate,
  interventionEnrichedToPlain
} from '../../data/interventionData';
import { createMockProject, getInitialProject } from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { interventionTestClient } from '../../utils/testClients/interventionTestClient';
import { destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';

interface ITestData {
  project: IEnrichedProject;
  interventions: IEnrichedIntervention[];
  interventionIds: string[];
}

async function initData(options?: Partial<ITestData>): Promise<ITestData> {
  const data: ITestData = {} as ITestData;
  data.interventions = [];
  if (options?.interventions) {
    for (const intervention of options.interventions) {
      data.interventions.push(await createMockIntervention(intervention));
    }
  } else {
    data.interventions.push(await createMockIntervention(getProjectInterventionToIntegrate()));
    const intervention2 = cloneDeep(data.interventions[0]);
    delete intervention2.assets[0].id;
    data.interventions.push(
      await createMockIntervention(Object.assign({}, intervention2, { medalId: MedalType.bronze }))
    );
  }
  data.interventionIds = data.interventions.map(i => i.id);
  data.project = await createMockProject(
    Object.assign({}, getInitialProject(), {
      status: options?.project?.status || ProjectStatus.planned,
      projectTypeId: ProjectType.other,
      interventionIds: data.interventionIds,
      medalId: options?.project?.medalId || undefined
    })
  );
  for (const intervention of data.interventions) {
    intervention.project = { id: data.project.id };
    const interventionSaveResult = await interventionRepository.save(intervention);
    if (interventionSaveResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult)));
    }
  }
  return data;
}

describe('Intervention controller - calculate MedalId', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  let mock: ITestData;

  beforeEach(async () => {
    mock = await initData();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/interventions/:id > PUT', () => {
    /**
     * Update one intervention in a specific project
     */
    function putIntervention(id: string, intervention: IEnrichedIntervention): Promise<request.Response> {
      const plainIntervention: IPlainIntervention = interventionEnrichedToPlain(intervention);
      return interventionTestClient.update(id, plainIntervention);
    }

    it('C63416 - Positive - Should update project medalId according to intervention medalId change', async () => {
      mock.interventions[1].medalId = MedalType.platinum;
      const projectBefore = await projectRepository.findById(mock.project.id);
      assert.isUndefined(projectBefore.medalId);
      const interventionBefore = await interventionRepository.findById(mock.interventions[1].id);
      assert.equal(interventionBefore.medalId, MedalType.bronze);
      const response = await putIntervention(mock.interventions[1].id, mock.interventions[1]);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myIntervention = response.body;
      assert.equal(myIntervention.medalId, mock.interventions[1].medalId);
      const myProject = await projectRepository.findById(mock.project.id);
      assert.isDefined(myProject.medalId);
    });
  });

  describe('/interventions > DELETE', () => {
    /**
     * Delete one intervention in a specific project
     */
    function deleteIntervention(id: string): Promise<request.Response> {
      return requestService.delete(`${apiUrl}/${id}`);
    }

    it('C63417 - Positive - Should delete linked project when all interventions are deleted', async () => {
      userMocker.mock(userMocks.requestor);
      mock = await initData({
        interventions: [
          Object.assign({}, await createMockIntervention(getProjectInterventionToIntegrate()), {
            medaId: MedalType.gold,
            status: InterventionStatus.wished
          })
        ],
        project: await createMockProject(
          Object.assign({}, getInitialProject(), {
            status: ProjectStatus.planned,
            projectTypeId: ProjectType.other,
            medalId: MedalType.silver
          })
        )
      });

      const projectBefore = await projectRepository.findById(mock.project.id);
      assert.equal(projectBefore.medalId, MedalType.silver);
      const result = await deleteIntervention(mock.interventions[0].id);
      assert.strictEqual(result.status, HttpStatusCodes.NO_CONTENT);
      const myIntervention = await interventionRepository.findById(mock.interventions[0].id);
      assert.isNull(myIntervention);
      const myProject = await projectRepository.findById(mock.project.id);
      assert.isNull(myProject);
      userMocker.mock(userMocks.admin);
    });
  });
});

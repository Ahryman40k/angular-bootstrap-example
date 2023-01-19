import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IPlainProject,
  MedalType,
  ProjectStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { appUtils } from '../../../src/utils/utils';
import { createMockIntervention, getProjectInterventionToIntegrate } from '../../data/interventionData';
import { createMockProject, enrichedToPlain, getInitialProject } from '../../data/projectData';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

interface ITestData {
  project: IEnrichedProject;
  interventions: IEnrichedIntervention[];
  interventionIds: string[];
}

async function arrangeTest(): Promise<ITestData> {
  return initData();
}

async function initData(options?: Partial<ITestData>, isDeleteBeforeInit?: boolean): Promise<ITestData> {
  const data: ITestData = {} as ITestData;
  if (isDeleteBeforeInit) {
    await destroyDBTests();
  }
  data.interventions = [];
  if (options?.interventions) {
    for (const intervention of options.interventions) {
      data.interventions.push(await createMockIntervention(intervention));
    }
  } else {
    data.interventions.push(await createMockIntervention(getProjectInterventionToIntegrate()));
    data.interventions.push(
      await createMockIntervention(Object.assign({}, data.interventions[0], { medalId: MedalType.bronze }))
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
    await interventionRepository.save(intervention);
  }
  return data;
}

describe('Project controller - calculate MedalId', () => {
  const sandbox = sinon.createSandbox();

  before(() => {
    spatialAnalysisServiceStub.init(sandbox);
  });

  after(async () => {
    sandbox.restore();
    await integrationAfter();
  });

  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  let mock: ITestData;

  beforeEach(async () => {
    mock = await arrangeTest();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/projects/:id > POST', () => {
    /**
     * Create one project
     */
    function postProject(project: IEnrichedProject): Promise<request.Response> {
      const plainProject: IPlainProject = enrichedToPlain(project);
      return requestService.post(`${apiUrl}`, { body: plainProject });
    }

    it('C63459 - Positive - Should update project medalId according to its interventions max medalId', async () => {
      const result = await postProject(mock.project);
      assert.strictEqual(result.status, HttpStatusCodes.CREATED);
      const myProject = await projectRepository.findById(result.body.id);
      assert.equal(myProject.medalId, MedalType.bronze);
    });
  });

  describe('/projects/:id > PUT', () => {
    /**
     * Update one project
     */
    function putProject(id: string, project: IEnrichedProject): Promise<request.Response> {
      const plainProject: IPlainProject = enrichedToPlain(project);
      return requestService.put(`${apiUrl}/${id}`, { body: plainProject });
    }

    it('C63460 - Positive - Should update project medalId according to its interventions max medalId', async () => {
      const result = await putProject(mock.project.id, mock.project);
      assert.strictEqual(result.status, HttpStatusCodes.OK);
      const myProject = await projectRepository.findById(result.body.id);
      assert.equal(myProject.medalId, MedalType.bronze);
    });
  });
});

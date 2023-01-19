import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  GeometryUtil,
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  IPlainIntervention,
  IPlainProject,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { appUtils } from '../../../src/utils/utils';
import {
  createPlainInterventionFromEnrichedIntervention,
  getEnrichedCompleteIntervention
} from '../../data/interventionData';
import {
  appendProjectGeometryFromInterventions,
  enrichedToPlain,
  getInitialPlainProject,
  getInitialProject
} from '../../data/projectData';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { createMany, destroyDBTests } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable: max-func-body-length
describe('Project controller (Adding/removing interventions)', () => {
  const apiUrlProjects: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  const apiUrlInterventions: string = appUtils.createPublicFullPath(
    constants.locationPaths.INTERVENTION,
    EndpointTypes.API
  );

  let interventionsWithPrograms: IEnrichedIntervention[];
  let interventionsWithoutPrograms: IEnrichedIntervention[];

  after(async () => {
    await integrationAfter();
  });

  beforeEach(() => {
    spatialAnalysisServiceStub.init(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
  });

  async function createInterventions(patch?: Partial<IEnrichedIntervention>): Promise<IEnrichedIntervention[]> {
    let interventions: IEnrichedIntervention[] = [];
    for (let i = 0; i < 5; i++) {
      const intervention = await getEnrichedCompleteIntervention();
      intervention.programId = null;
      Object.assign(intervention, patch);
      interventions.push(intervention);
    }
    interventions = await createMany(interventions, interventionRepository);
    return interventions;
  }

  async function createProject(type: ProjectType, interventions: IEnrichedIntervention[]): Promise<IEnrichedProject> {
    let project = getInitialProject();
    project.projectTypeId = type;
    project.interventionIds = interventions.map(i => i.id);
    project = (await projectRepository.save(project)).getValue();
    appendProjectGeometryFromInterventions(project, interventions);
    for (let intervention of interventions) {
      intervention.project = { id: project.id };
      const savedInterventionResult = await interventionRepository.save(intervention);
      if (savedInterventionResult.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(savedInterventionResult)));
      }
      intervention = savedInterventionResult.getValue();
    }
    return project;
  }

  function createPlainProject(type: ProjectType, interventions: IEnrichedIntervention[]): IPlainProject {
    const plainProject = getInitialPlainProject();
    plainProject.projectTypeId = type;
    plainProject.interventionIds = interventions.map(i => i.id);
    appendProjectGeometryFromInterventions(plainProject, interventions);
    return plainProject;
  }

  function createPlainProjectForUpdate(
    project: IEnrichedProject,
    interventions: IEnrichedIntervention[]
  ): IPlainProject {
    project.interventionIds = interventions.map(i => i.id);
    appendProjectGeometryFromInterventions(project, interventions);
    return enrichedToPlain(project);
  }

  beforeEach(async () => {
    interventionsWithPrograms = await createInterventions({ status: InterventionStatus.accepted, programId: 'prcpr' });
    interventionsWithoutPrograms = await createInterventions();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  async function postProject(plainProject: IPlainProject): Promise<request.Response> {
    return requestService.post(apiUrlProjects, { body: plainProject });
  }

  async function putProject(projectId: string, plainProject: IPlainProject): Promise<request.Response> {
    return requestService.put(`${apiUrlProjects}/${projectId}`, { body: plainProject });
  }

  async function putIntervention(
    interventionId: string,
    plainIntervention: IPlainIntervention
  ): Promise<request.Response> {
    return requestService.put(`${apiUrlInterventions}/${interventionId}`, { body: plainIntervention });
  }

  describe('/projects > POST', () => {
    it('C57625  Positive - Should create a PNI project with interventions with programs', async () => {
      const plainProject = createPlainProject(ProjectType.nonIntegrated, interventionsWithPrograms);

      const response = await postProject(plainProject);
      const project: IEnrichedProject = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.ok(project.id);
      assert.strictEqual(project.projectTypeId, plainProject.projectTypeId);
      assert.deepStrictEqual(project.interventionIds.sort(), plainProject.interventionIds.sort());
    });

    it('C57626  Positive - Should create a PI project with interventions without programs', async () => {
      const plainProject = createPlainProject(ProjectType.integrated, interventionsWithoutPrograms);

      const response = await postProject(plainProject);
      const project: IEnrichedProject = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.ok(project.id);
      assert.strictEqual(project.projectTypeId, plainProject.projectTypeId);
      assert.deepStrictEqual(project.interventionIds.sort(), plainProject.interventionIds.sort());
    });

    it('C57627  Negative - Should not create a PNI project with interventions without programs', async () => {
      const plainProject = createPlainProject(ProjectType.nonIntegrated, interventionsWithoutPrograms);

      const response = await postProject(plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });

  describe('/projects > PUT', () => {
    let projectIntegrated: IEnrichedProject;
    let projectNonIntegrated: IEnrichedProject;
    let projectOther: IEnrichedProject;
    let interventionsPutWithPrograms: IEnrichedIntervention[];
    let interventionsPutWithoutPrograms: IEnrichedIntervention[];

    beforeEach(async () => {
      projectIntegrated = await createProject(ProjectType.integrated, interventionsWithoutPrograms);
      projectNonIntegrated = await createProject(ProjectType.nonIntegrated, interventionsWithPrograms);
      projectOther = await createProject(ProjectType.other, []);
      interventionsPutWithPrograms = await createInterventions({
        status: InterventionStatus.accepted,
        programId: 'prcpr'
      });
      interventionsPutWithoutPrograms = await createInterventions();
    });

    it('C57629  Positive - Should update a PNI project with interventions with programs', async () => {
      const plainProject = createPlainProjectForUpdate(projectNonIntegrated, interventionsPutWithPrograms);

      const response = await putProject(projectNonIntegrated.id, plainProject);
      const project: IEnrichedProject = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(project.id);
      assert.strictEqual(project.projectTypeId, plainProject.projectTypeId);
      assert.deepStrictEqual(project.interventionIds.sort(), plainProject.interventionIds.sort());
    });

    it('C57630  Positive - Should update a PI project with interventions without programs', async () => {
      const plainProject = createPlainProjectForUpdate(projectIntegrated, interventionsPutWithoutPrograms);

      const response = await putProject(projectIntegrated.id, plainProject);
      const project: IEnrichedProject = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(project.id);
      assert.strictEqual(project.projectTypeId, plainProject.projectTypeId);
      assert.deepStrictEqual(project.interventionIds.sort(), plainProject.interventionIds.sort());
    });

    it('C57631  Negative - Should not update a PNI project with interventions without programs', async () => {
      const plainProject = createPlainProjectForUpdate(projectNonIntegrated, interventionsPutWithoutPrograms);

      const response = await putProject(projectNonIntegrated.id, plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('Negative - Should return an error when updating a PI project with interventions having programs', async () => {
      const plainProject = createPlainProjectForUpdate(projectIntegrated, interventionsPutWithPrograms);

      const response = await putProject(projectIntegrated.id, plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it('C59948  Positive - Should add an intervention without a program to a project of type other', async () => {
      const plainProject = createPlainProjectForUpdate(projectOther, interventionsPutWithoutPrograms);

      const response = await putProject(projectOther.id, plainProject);
      const project: IEnrichedProject = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(project.id);
      assert.strictEqual(project.projectTypeId, plainProject.projectTypeId);
      assert.deepStrictEqual(project.interventionIds.sort(), plainProject.interventionIds.sort());
    });
  });

  describe('/interventions > PUT', () => {
    let stub: sinon.SinonStub<[IPlainProject, IPlainIntervention[]], string[]>;
    before(() => {
      stub = sinon.stub(GeometryUtil, 'validateProjectContainsIntervention').returns([]);
    });
    after(() => {
      stub.restore();
    });
    beforeEach(async () => {
      await createProject(ProjectType.integrated, interventionsWithoutPrograms);
      await createProject(ProjectType.nonIntegrated, interventionsWithPrograms);
    });

    it('C57633  Positive - Should set an intervention program when intervention is in a PI project', async () => {
      const interventionsWithoutProgram = interventionsWithoutPrograms[0];
      interventionsWithoutProgram.programId = 'prcpr';

      const plainIntervention = createPlainInterventionFromEnrichedIntervention(interventionsWithoutProgram);
      const response = await putIntervention(interventionsWithoutProgram.id, plainIntervention);
      const intervention: IEnrichedIntervention = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(intervention);
      assert.strictEqual(intervention.id, plainIntervention.id);
      assert.strictEqual(intervention.programId, plainIntervention.programId);
    });

    it('C57634  Negative - Should not remove an intervention program when intervention is in a PNI project', async () => {
      const interventionsWithProgram = interventionsWithPrograms[0];
      interventionsWithProgram.programId = null;

      const plainIntervention = createPlainInterventionFromEnrichedIntervention(interventionsWithProgram);
      const response = await putIntervention(interventionsWithProgram.id, plainIntervention);

      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });
});

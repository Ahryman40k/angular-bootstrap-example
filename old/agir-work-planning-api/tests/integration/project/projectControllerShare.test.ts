import {
  CommentCategory,
  IEnrichedProject,
  IProjectPaginatedSearchRequest,
  Permission,
  ProgramBookStatus,
  ProjectDecisionType,
  Role
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { getIComment } from '../../../src/features/comments/tests/commentTestHelper';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { createAndSaveProject } from '../../../src/features/projects/tests/projectTestHelper';
import { appUtils } from '../../../src/utils/utils';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { getEnrichedCompleteProject, getProjectDecision } from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { destroyDBTests, getFutureYear } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable-next-line: max-func-body-length
describe('ProjectController - Share', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  let sharedProject: IEnrichedProject;
  let sharedProgramBook: ProgramBook;
  let notSharedProject: IEnrichedProject;
  let notSharedProgramBook: ProgramBook;
  let annualProgram: AnnualProgram;

  after(async () => {
    await integrationAfter();
  });

  beforeEach(async () => {
    userMocker.mock(userMocks.executor);

    annualProgram = await createAndSaveAnnualProgram();

    sharedProgramBook = await createAndSaveProgramBook({
      annualProgram,
      sharedRoles: [Role.EXECUTOR, Role.INTERNAL_GUEST_STANDARD],
      status: ProgramBookStatus.programming
    });

    sharedProject = getEnrichedCompleteProject();
    sharedProject.annualDistribution.annualPeriods[0].programBookId = sharedProgramBook.id;
    sharedProject = (await projectRepository.save(sharedProject)).getValue();

    const interventionPrivateComment = getIComment({
      categoryId: CommentCategory.information,
      text: 'test',
      isProjectVisible: true,
      isPublic: false
    });
    await interventionDataGenerator.store({ comments: [interventionPrivateComment] }, sharedProject);

    notSharedProgramBook = await createAndSaveProgramBook({
      annualProgram,
      sharedRoles: [Role.REQUESTOR],
      status: ProgramBookStatus.programming
    });

    notSharedProject = getEnrichedCompleteProject();
    notSharedProject.annualDistribution.annualPeriods[0].programBookId = notSharedProgramBook.id;
    notSharedProject = (await projectRepository.save(notSharedProject)).getValue();
  });

  afterEach(() => {
    userMocker.reset();
  });

  function getProject(projectId: string): Promise<request.Response> {
    return requestService.get(`${apiUrl}/${projectId}`);
  }

  function getProjects(projectSearchRequest?: IProjectPaginatedSearchRequest): Promise<request.Response> {
    return requestService.get(apiUrl, undefined, projectSearchRequest);
  }

  function assertInternalGuestStd(project: IEnrichedProject) {
    assert.exists(project.globalBudget);
    assert.isUndefined(project.documents);
    assert.isUndefined(project.comments);
    assert.isUndefined(project.decisions);
  }

  describe('/projects > GET', () => {
    it('C57316  Positive - Should retrieve projects that are in a shared program book', async () => {
      const response = await getProjects();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.notStrictEqual(projects.length, 0);
      assert.isTrue(projects.every(p => p.annualDistribution.annualPeriods[0].programBookId === sharedProgramBook.id));
    });

    it(`Positive - Should retrieve projects that are NOT in a shared program book if has Permission ${Permission.PROJECT_WITH_POSTPONED_DECISION_READ}`, async () => {
      await destroyDBTests();
      userMocker.mock(userMocks.executor);
      const programBook = await createAndSaveProgramBook({
        annualProgram,
        status: ProgramBookStatus.programming
      });
      await createAndSaveProject(
        {
          boroughId: programBook.boroughIds.find(b => b),
          decisions: [getProjectDecision(ProjectDecisionType.postponed, appUtils.getCurrentYear(), getFutureYear(2))]
        },
        programBook.id
      );
      const response = await getProjects();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.notStrictEqual(projects.length, 0);
      assert.isTrue(projects.every(p => p.annualDistribution.annualPeriods[0].programBookId === programBook.id));
    });

    it('C57317  Negative - Should not retrieve projects that are not in a shared program book', async () => {
      const response = await getProjects();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.notStrictEqual(projects.length, 0);
      assert.isTrue(
        projects.every(p => p.annualDistribution.annualPeriods[0].programBookId !== notSharedProgramBook.id)
      );
    });

    it('C57149 - Positive - Should be able to view all project properties except documents, comments and decisions with a logged in user as an internal guest standard', async () => {
      userMocker.mock(userMocks.internalGuestStandard);
      try {
        const response = await getProjects();
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        for (const item of response.body.items) {
          assertInternalGuestStd(item);
        }
      } finally {
        userMocker.reset();
      }
    });
    it('C57395 - Positive - Should not be able to view project private comments as a requestor', async () => {
      userMocker.mock(userMocks.requestor);
      try {
        const response = await getProjects();
        const projects: IEnrichedProject[] = response.body.items;
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const comments = _.flatten(projects.map(p => p.comments).filter(p => p));

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.isTrue(comments.every(c => c.isPublic));
      } finally {
        userMocker.reset();
      }
    });
    it('C57395 - Positive - Should not be able to view project private comments as a executor', async () => {
      userMocker.mock(userMocks.executor);
      try {
        const response = await getProjects();
        const projects: IEnrichedProject[] = response.body.items;
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const comments = _.flatten(projects.map(p => p.comments).filter(p => p));

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.isTrue(comments.every(c => c.isPublic));
      } finally {
        userMocker.reset();
      }
    });
  });

  describe('/projects/:id > GET', () => {
    it('C57318  Positive - Should retrieve a project that is in a shared program book', async () => {
      const response = await getProject(sharedProject.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.id, sharedProject.id);
    });

    it('C57319  Negative - Should not retrieve a project that is not in a shared program book', async () => {
      const response = await getProject(notSharedProject.id);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C57148 - Positive - Should be able to view all project properties except documents, comments and decisions with a logged in user as an internal guest standard', async () => {
      userMocker.mock(userMocks.internalGuestStandard);
      try {
        const response = await getProject(sharedProject.id);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assertInternalGuestStd(response.body);
      } finally {
        userMocker.reset();
      }
    });
  });
});

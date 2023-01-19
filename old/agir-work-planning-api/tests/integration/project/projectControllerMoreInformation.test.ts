import {
  CommentCategory,
  ErrorCodes,
  IEnrichedIntervention,
  IEnrichedProject,
  IPlainProject,
  MedalType,
  ProjectExternalReferenceType,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes, EntityType } from '../../../config/constants';
import { HistoryFindOptions } from '../../../src/features/history/models/historyFindOptions';
import { historyRepository } from '../../../src/features/history/mongo/historyRepository';
import { RISK_AGREEMENT, RISK_OTHER_COMMENT, ROAD_NETWORK_TYPE_LOCAL } from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { createMockIntervention, getProjectInterventionToIntegrate } from '../../data/interventionData';
import {
  enrichedToPlain,
  getBadCommentProject,
  getBadExternalReferenceCountProject,
  getBadExternalReferenceTaxoProject,
  getInitialProjectTypeOther,
  getMoreInformationProject
} from '../../data/projectData';
import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

interface ITestUrls {
  projectUrl: string;
  interventionUrl: string;
}

function initUrls(): ITestUrls {
  const apiUrls: ITestUrls = {} as ITestUrls;
  apiUrls.projectUrl = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  apiUrls.interventionUrl = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  return apiUrls;
}

interface ITestData {
  project: IEnrichedProject;
  intervention: IEnrichedIntervention;
  interventionIds: string[];
}

const errorDuplicatePti = {
  code: ErrorCodes.Duplicate,
  message: 'Project pti number already exist',
  target: 'externalReferenceIds'
};

const errorDuplicateRtu = {
  code: ErrorCodes.Duplicate,
  message: 'Project info rtu reference number already exist',
  target: 'externalReferenceIds'
};

async function deleteData() {
  await destroyDBTests();
}

// tslint:disable:max-func-body-length
describe('Project controller - MoreInformation', () => {
  let urls: ITestUrls;
  const writeAllowedRoles = normalizeUsernames([userMocks.admin, userMocks.pilot, userMocks.planner]);
  let mock: ITestData;

  function postProject(project: IEnrichedProject): Promise<request.Response> {
    const plainProject: IPlainProject = enrichedToPlain(project);
    return requestService.post(urls.projectUrl, { body: plainProject });
  }

  async function insertIntervention(intervention: IEnrichedIntervention): Promise<IEnrichedIntervention> {
    return createMockIntervention(intervention);
  }

  function getProject(id: string): Promise<request.Response> {
    return requestService.get(`${urls.projectUrl}/${id}`, {}, { expand: 'interventions' });
  }

  function putProject(id: string, project: IEnrichedProject): Promise<request.Response> {
    const plainProject: IPlainProject = enrichedToPlain(project);
    return requestService.put(`${urls.projectUrl}/${id}`, { body: plainProject });
  }

  async function initData(isDeleteBeforeInit = false): Promise<void> {
    if (isDeleteBeforeInit) {
      await deleteData();
    }
    mock = {} as ITestData;
    mock.intervention = getProjectInterventionToIntegrate();
    mock.intervention.medalId = MedalType.silver;
    const response = await insertIntervention(mock.intervention);
    mock.interventionIds = [response.id];
    mock.project = getMoreInformationProject({ interventionIds: mock.interventionIds });
  }

  function buildMoreInformation(partial?: Partial<IEnrichedProject>): IEnrichedProject {
    const project = getInitialProjectTypeOther(ProjectType.other);
    Object.assign(project, partial, {
      riskId: RISK_AGREEMENT,
      comments: [
        {
          text: 'more information other comment',
          categoryId: CommentCategory.other,
          isPublic: true
        },
        {
          text: 'more information risk comment',
          categoryId: CommentCategory.risk,
          isPublic: true
        }
      ],
      externalReferenceIds: [
        { type: ProjectExternalReferenceType.ptiNumber, value: 'more information pti number' },
        {
          type: ProjectExternalReferenceType.infoRTUReferenceNumber,
          value: 'more information info rtu reference number'
        }
      ]
    });
    return project;
  }

  function setupStubs() {
    spatialAnalysisServiceStub.init(sandbox);
  }

  before(() => {
    urls = initUrls();
  });

  after(async () => {
    await integrationAfter();
  });

  beforeEach(async () => {
    setupStubs();
    await initData();
  });

  afterEach(async () => {
    sandbox.restore();
    userMocker.reset();
    await deleteData();
  });

  describe('/projects > POST', () => {
    it('C61778 - Positive - Should save more information', async () => {
      for (const role of writeAllowedRoles) {
        await initData(true);
        userMocker.mock(role);
        mock.project = buildMoreInformation(mock.project);
        assert.isDefined(mock.project.externalReferenceIds, '1');
        assert.isDefined(mock.project.comments, '2');
        assert.isDefined(mock.project.riskId, '3');
        assert.isUndefined(mock.project.medalId, '4');
        assert.isUndefined(mock.project.roadNetworkTypeId, '5');
        assert.isUndefined(mock.project.moreInformationAudit, '6');
        const response = await postProject(mock.project);
        const myProject = response.body;
        assert.deepStrictEqual(myProject.externalReferenceIds, mock.project.externalReferenceIds, '7');
        assert.isEmpty(myProject.comments, `should not save comments on post`);
        assert.strictEqual(myProject.riskId, mock.project.riskId, '9');
        assert.isDefined(myProject.medalId, '10');
        assert.isDefined(myProject.roadNetworkTypeId, '11');
        assert.isDefined(myProject.moreInformationAudit, '12');
        assert.strictEqual(response.status, HttpStatusCodes.CREATED, '13');
      }
    });

    it('C61779 - Negative - Should not save none empty more information when using a forbidden user role', async () => {
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        await initData(true);
        mock.project = getMoreInformationProject({ interventionIds: mock.interventionIds });
        userMocker.mock(role);
        mock.project = buildMoreInformation(mock.project);
        const response = await postProject(mock.project);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      }
    });

    it('C61783 - Negative - Should not save an external reference when its wrong taxonomy', async () => {
      mock.project = getBadExternalReferenceTaxoProject(mock.project);
      const response = await postProject(mock.project);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C61784 - Negative - Should not save more than one pti number external reference', async () => {
      mock.project = getBadExternalReferenceCountProject(ProjectExternalReferenceType.ptiNumber, mock.project);
      assert.strictEqual(_.size(mock.project.externalReferenceIds), 2);
      const response = await postProject(mock.project);

      assert.deepInclude(response.body.error.details, errorDuplicatePti);
    });

    it('C61785 - Negative - Should not save more than one info rtu reference number external reference', async () => {
      mock.project = getBadExternalReferenceCountProject(
        ProjectExternalReferenceType.infoRTUReferenceNumber,
        mock.project
      );
      assert.strictEqual(_.size(mock.project.externalReferenceIds), 2);
      const response = await postProject(mock.project);
      assert.deepInclude(response.body.error.details, errorDuplicateRtu);
    });

    it('C61786 - Positive - Should save the more information audit', async () => {
      const response = await postProject(mock.project);
      const myProject = response.body;
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isNotEmpty(myProject.moreInformationAudit);
      assert.strictEqual(myProject.moreInformationAudit.createdBy.userName, 'xplanner');
      assert.isNotEmpty(myProject.moreInformationAudit.createdAt);
      assert.isUndefined(myProject.moreInformationAudit.updatedBy);
      assert.isUndefined(myProject.moreInformationAudit.updatedAt);
    });
  });

  describe('/projects/:id > GET', () => {
    it('C61787 - Positive - Should return the road network type id for the more information tab', async () => {
      mock.project.roadNetworkTypeId = ROAD_NETWORK_TYPE_LOCAL;
      const postResponse = await postProject(mock.project);
      const getResponse = await getProject(postResponse.body.id);
      const myProject = getResponse.body;
      assert.isTrue(spatialAnalysisServiceStub.analyzeStub.calledOnce);
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(myProject.id, postResponse.body.id);
      assert.strictEqual(myProject.roadNetworkTypeId, mock.project.roadNetworkTypeId);
    });

    it('C61788 - Positive - Should return the medal id for the more information tab', async () => {
      const postResponse = await postProject(mock.project);
      const getResponse = await getProject(postResponse.body.id);
      const myProject = getResponse.body;
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(myProject.id, postResponse.body.id);
      assert.strictEqual(myProject.medalId, postResponse.body.medalId);
    });

    it('C61789 - Positive - Should return the risk id for the more information tab', async () => {
      const postResponse = await postProject(mock.project);
      const getResponse = await getProject(postResponse.body.id);
      const myProject = getResponse.body;
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      assert.strictEqual(myProject.id, postResponse.body.id);
      assert.strictEqual(myProject.riskId, mock.project.riskId);
    });
  });

  // tslint:disable:max-func-body-length
  describe('/projects/:id > PUT', () => {
    it('C61790 - Positive - Should save more information', async () => {
      for (const role of writeAllowedRoles) {
        await initData(true);
        mock.project = getMoreInformationProject({ interventionIds: mock.interventionIds });
        userMocker.mock(role);
        const postResponse = await postProject(mock.project);
        assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
        mock.project = postResponse.body;
        mock.project = buildMoreInformation(mock.project);
        delete mock.project.medalId;
        delete mock.project.roadNetworkTypeId;
        delete mock.project.moreInformationAudit;
        mock.project = enrichedToPlain(mock.project);
        assert.isDefined(mock.project.externalReferenceIds, '1');
        assert.isUndefined(mock.project.comments, 'should not save comments on PUT');
        assert.isDefined(mock.project.riskId, '3');
        assert.isUndefined(mock.project.medalId, '4');
        assert.isUndefined(mock.project.roadNetworkTypeId, '5');
        assert.isUndefined(mock.project.moreInformationAudit, '6');
        const putResponse = await putProject(postResponse.body.id, mock.project);
        const myProject = putResponse.body;
        assert.deepStrictEqual(myProject.externalReferenceIds, mock.project.externalReferenceIds, '7');
        assert.isEmpty(myProject.comments, `should not save comments on PUT`);
        assert.strictEqual(myProject.riskId, mock.project.riskId, '9');
        assert.isDefined(myProject.medalId, '10');
        assert.isDefined(myProject.roadNetworkTypeId, '11');
        assert.isDefined(myProject.moreInformationAudit, '12');
        assert.strictEqual(putResponse.status, HttpStatusCodes.OK, '13');
        userMocker.reset();
      }
    });

    it('C61791 - Negative - Should not save more information when using a forbidden user role', async () => {
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        await initData(true);
        mock.project = getMoreInformationProject({ interventionIds: mock.interventionIds });
        const postResponse = await postProject(mock.project);
        assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
        userMocker.mock(role);
        mock.project = postResponse.body;
        mock.project = buildMoreInformation(mock.project);
        const putResponse = await putProject(postResponse.body.id, mock.project);
        assert.strictEqual(putResponse.status, HttpStatusCodes.FORBIDDEN);
        userMocker.reset();
      }
    });

    it('Negative - Should detect invalid body with comments', async () => {
      const postResponse = await postProject(mock.project);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      mock.project = getBadCommentProject(mock.project);
      const putResponse = await requestService.put(`${urls.projectUrl}/${mock.project.id}`, { body: mock.project });
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Negative - Should NOT save comments on PUT', async () => {
      const postResponse = await postProject(mock.project);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      const projectToUpdate: IPlainProject = enrichedToPlain(postResponse.body);
      (projectToUpdate as any).comments = [
        {
          text: 'test other 1',
          categoryId: CommentCategory.other,
          isPublic: true
        },
        {
          text: 'test other 2',
          categoryId: CommentCategory.other,
          isPublic: true
        }
      ];
      const putResponse = await requestService.put(`${urls.projectUrl}/${projectToUpdate.id}`, {
        body: projectToUpdate
      });
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C61795 - Negative - Should not save an external reference when its wrong taxonomy', async () => {
      const postResponse = await postProject(mock.project);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      mock.project = getBadExternalReferenceTaxoProject(mock.project);
      const putResponse = await putProject(postResponse.body.id, mock.project);
      assert.strictEqual(putResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C61796 - Negative - Should not save more than one pti number external reference', async () => {
      const postResponse = await postProject(mock.project);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      mock.project = getBadExternalReferenceCountProject(ProjectExternalReferenceType.ptiNumber, mock.project);
      assert.strictEqual(_.size(mock.project.externalReferenceIds), 2);
      const putResponse = await putProject(postResponse.body.id, mock.project);
      assert.deepInclude(putResponse.body.error.details, errorDuplicatePti);
    });

    it('C61797 - Negative - Should not save more than one info rtu reference number external reference', async () => {
      const postResponse = await postProject(mock.project);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);
      mock.project = getBadExternalReferenceCountProject(
        ProjectExternalReferenceType.infoRTUReferenceNumber,
        mock.project
      );
      assert.strictEqual(_.size(mock.project.externalReferenceIds), 2);
      const putResponse = await putProject(postResponse.body.id, mock.project);
      assert.deepInclude(putResponse.body.error.details, errorDuplicateRtu);
    });

    it('C61798 - Positive - Should save the more information audit', async () => {
      const postResponse = await postProject(mock.project);
      mock.project = postResponse.body;
      mock.project.riskId = RISK_OTHER_COMMENT;
      const putResponse = await putProject(postResponse.body.id, mock.project);
      const myProject = putResponse.body;
      assert.isNotEmpty(myProject.moreInformationAudit);
      assert.isDefined(myProject.moreInformationAudit.createdBy);
      assert.isNotEmpty(myProject.moreInformationAudit.createdAt);
      assert.strictEqual(myProject.moreInformationAudit.lastModifiedBy.userName, 'xplanner');
      assert.isNotEmpty(myProject.moreInformationAudit.lastModifiedAt);
    });

    it('C61799 - Negative - Should not save the more information audit when no change occurs', async () => {
      const postResponse = await postProject(mock.project);
      const putResponse = await putProject(postResponse.body.id, mock.project);
      const myProject = putResponse.body;
      assert.isNotEmpty(myProject.moreInformationAudit);
      assert.isDefined(myProject.moreInformationAudit.createdBy);
      assert.isNotEmpty(myProject.moreInformationAudit.createdAt);
      assert.isUndefined(myProject.moreInformationAudit.lastModifiedBy);
      assert.isUndefined(myProject.moreInformationAudit.lastModifiedAt);
    });

    it('C61800 - Positive - Should save the change comment of more information in history', async () => {
      const postResponse = await postProject(mock.project);
      mock.project = postResponse.body;
      mock.project.riskId = RISK_AGREEMENT;
      const putResponse = await putProject(postResponse.body.id, mock.project);
      const myProject = putResponse.body;
      const projectHistoryFindOptions = HistoryFindOptions.create({
        criterias: {
          referenceId: myProject.id
        }
      }).getValue();
      const projectHistory = await historyRepository.findAll(projectHistoryFindOptions);
      assert.isTrue(projectHistory.length > 0);
      assert.containsAllKeys(projectHistory[0], ['objectTypeId', 'referenceId', 'actionId', 'summary']);
      const historyFindOptions = HistoryFindOptions.create({
        criterias: {
          objectTypeId: EntityType.project
        },
        orderBy: '-id',
        limit: 1
      }).getValue();
      const results = await historyRepository.findAll(historyFindOptions);
      assert.exists(results[0].summary.comments);
    });

    it('C61801 - Negative - Should not save the change comment of more information in history when no change occurs', async () => {
      const postResponse = await postProject(mock.project);
      const putResponse = await putProject(postResponse.body.id, mock.project);
      const myProject = putResponse.body;
      const projectHistoryFindOptions = HistoryFindOptions.create({
        criterias: {
          referenceId: myProject.id
        }
      }).getValue();
      const projectHistory = await historyRepository.findAll(projectHistoryFindOptions);
      assert.isTrue(projectHistory.length > 0);
      assert.containsAllKeys(projectHistory[0], ['objectTypeId', 'referenceId', 'actionId', 'summary', 'audit', 'id']);
      const historyFindOptions = HistoryFindOptions.create({
        criterias: {},
        orderBy: '-id',
        limit: 1
      }).getValue();
      const results = await historyRepository.findAll(historyFindOptions);
      assert.isUndefined(results[0].summary);
    });
  });
});

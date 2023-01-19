import {
  AnnualProgramStatus,
  CommentCategory,
  IBicProject,
  IComment,
  IEnrichedIntervention,
  IEnrichedProject,
  IExternalReferenceId,
  IFeature,
  IImportProjectRequest,
  InterventionExternalReferenceType,
  ITaxonomy,
  ProgramBookStatus,
  ProjectExternalReferenceType,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { getRoadSections, getWorkAreaFeature } from '../../../src/features/asset/tests/assetTestHelper';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { taxonomyService } from '../../../src/features/taxonomies/taxonomyService';
import { assetService } from '../../../src/services/assetService';
import { projectWorkAreaService } from '../../../src/services/projectWorkAreaService';
import { IRoadNetwork } from '../../../src/services/spatialAnalysisService/spatialAnalysisType';
import {
  EXECUTOR_OTHER,
  ROAD_NETWORK_TYPE_ARTERIAL,
  ROAD_NETWORK_TYPE_ARTERIAL_LOCAL
} from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { getBicProject, getBicProjectFeature } from '../../data/importData';
import { createMockIntervention } from '../../data/interventionData';
import { createMockProject } from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { spatialAnalysisServiceStub } from '../../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

interface ITestUrls {
  importUrl: string;
  interventionUrl: string;
}

interface ITestData {
  project: IEnrichedProject;
  intervention: IEnrichedIntervention;
  mockAnnualProgramDi: AnnualProgram;
  mockProgramBookDi: ProgramBook;
  mockAnnualProgramOther: AnnualProgram;
  mockProgramBookOther: ProgramBook;
  bicProject: IBicProject;
  feature: IFeature;
}

interface ITestTaxonomy {
  requestorReferenceNumberTaxonomy: ITaxonomy;
  infoRTUReferenceNumberTaxonomy: ITaxonomy;
  commentCategoryRiskTaxonomy: ITaxonomy;
}

function initUrls(): ITestUrls {
  const testUrls: ITestUrls = {} as ITestUrls;
  testUrls.importUrl = appUtils.createPublicFullPath(
    `${constants.locationPaths.IMPORT_INTERNAL}/projects`,
    EndpointTypes.API
  );
  testUrls.interventionUrl = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);
  return testUrls;
}

async function initData(): Promise<ITestData> {
  const testData: ITestData = {} as ITestData;
  testData.bicProject = getBicProject();
  testData.feature = getBicProjectFeature();
  testData.mockAnnualProgramDi = await createAndSaveAnnualProgram({
    status: AnnualProgramStatus.new,
    year: appUtils.parseInt(testData.bicProject.ANNEE_ACTUELLE)
  });
  testData.mockProgramBookDi = await createAndSaveProgramBook({
    annualProgram: testData.mockAnnualProgramDi,
    status: ProgramBookStatus.programming,
    projectTypes: [ProjectType.integrated, ProjectType.integratedgp],
    boroughIds: [testData.bicProject.ARRONDISSEMENT_AGIR]
  });
  testData.mockAnnualProgramOther = await createAndSaveAnnualProgram({
    executorId: EXECUTOR_OTHER,
    status: AnnualProgramStatus.new,
    year: appUtils.parseInt(testData.bicProject.ANNEE_ACTUELLE) + 1
  });
  testData.mockProgramBookOther = await createAndSaveProgramBook({
    annualProgram: testData.mockAnnualProgramOther,
    status: ProgramBookStatus.programming,
    projectTypes: [ProjectType.integrated, ProjectType.integratedgp],
    boroughIds: [testData.bicProject.ARRONDISSEMENT_AGIR]
  });
  testData.intervention = await createMockIntervention({ importFlag: 'import-internal' });
  testData.project = await createMockProject(
    {
      interventionIds: [testData.intervention.id],
      roadNetworkTypeId: ROAD_NETWORK_TYPE_ARTERIAL
    },
    {
      projectGeoAnnualDistribution: { annualPeriods: [{ programBookId: testData.mockProgramBookDi.id }] }
    }
  );
  return testData;
}

async function initTestTaxonomy(): Promise<ITestTaxonomy> {
  const taxonomy: ITestTaxonomy = {} as ITestTaxonomy;
  taxonomy.requestorReferenceNumberTaxonomy = await taxonomyService.getTaxonomy(
    TaxonomyGroup.externalReferenceType,
    InterventionExternalReferenceType.requestorReferenceNumber
  );
  taxonomy.infoRTUReferenceNumberTaxonomy = await taxonomyService.getTaxonomy(
    TaxonomyGroup.externalReferenceType,
    ProjectExternalReferenceType.infoRTUReferenceNumber
  );
  taxonomy.commentCategoryRiskTaxonomy = await taxonomyService.getTaxonomy(
    TaxonomyGroup.commentCategory,
    CommentCategory.risk
  );
  return taxonomy;
}

function assertComment(comment: IComment, commentData: Partial<IComment>) {
  assert.strictEqual(comment.text, commentData.text);
  assert.strictEqual(comment.categoryId, commentData.categoryId);
  assert.strictEqual(comment.isPublic, commentData.isPublic);
  assert.exists(comment.audit);
}

// tslint:disable-next-line:max-func-body-length
describe('Import controller -> more-information', () => {
  let importUrl: string;
  let interventionUrl: string;

  before(() => {
    userMocker.mock(userMocks.pilot);
    const mockWorkAreas = getWorkAreaFeature();
    const mockRoadSections = getRoadSections();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
    sinon.stub(projectWorkAreaService, 'generateWorkArea').returns(Promise.resolve(mockWorkAreas as any));
    const urls = initUrls();
    importUrl = urls.importUrl;
    interventionUrl = urls.interventionUrl;
  });

  after(async () => {
    sinon.restore();
    userMocker.reset();
    await integrationAfter();
  });

  // tslint:disable-next-line:max-func-body-length
  describe('/import/internalData > POST', () => {
    let mock: ITestData;
    let taxonomy: ITestTaxonomy;

    function postBicProject(importProjectRequest: IImportProjectRequest): Promise<request.Response> {
      return requestService.post(importUrl, { body: importProjectRequest });
    }

    function getIntervention(id: string): Promise<request.Response> {
      return requestService.get(`${interventionUrl}/${id}`);
    }

    beforeEach(async () => {
      mock = await initData();
      taxonomy = await initTestTaxonomy();
      spatialAnalysisServiceStub.init(sandbox);
    });

    afterEach(async () => {
      await destroyDBTests();
      sandbox.restore();
    });

    it('C61072 - Positive - Should save the project risk comment', async () => {
      const commentText = 'un commentaire de projet de catégorie risque';
      mock.bicProject.RISQUE_ENTENTE = commentText;
      const importProjectRequest: IImportProjectRequest = { bicProjects: [mock.bicProject], features: [mock.feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: commentText,
        categoryId: CommentCategory.risk,
        isPublic: true
      });
    });

    it('C61073 - Negative - Should not save a blank project risk comment', async () => {
      mock.bicProject.RISQUE_ENTENTE = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [mock.bicProject], features: [mock.feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isEmpty(response.body.comments);
    });

    it('C61074 - Positive - Should save the project external reference id info rtu reference number', async () => {
      const externalReferenceId: IExternalReferenceId = {
        type: taxonomy.infoRTUReferenceNumberTaxonomy.code,
        value: 'un numéro de référence externe de type info rtu'
      };
      mock.bicProject.NO_PROJET = externalReferenceId.value;
      const importProjectRequest: IImportProjectRequest = { bicProjects: [mock.bicProject], features: [mock.feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject: IEnrichedProject = response.body;
      const myExternalReferenceIds: IExternalReferenceId[] = myProject.externalReferenceIds.filter(
        e => e.type === ProjectExternalReferenceType.infoRTUReferenceNumber
      );
      assert.deepEqual(myExternalReferenceIds, [externalReferenceId]);
    });

    it('C61075 - Positive - Should save the intervention external reference id requestor reference number', async () => {
      const externalReferenceId: IExternalReferenceId = {
        type: taxonomy.requestorReferenceNumberTaxonomy.code,
        value: 'un numéro de référence externe de type numéro de référence requérant'
      };
      mock.bicProject.NO_REFERENCE_REQ = externalReferenceId.value;
      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [mock.bicProject],
        features: [mock.feature]
      };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const myIntervention: IEnrichedIntervention = (await getIntervention(myProject.interventionIds[0]))?.body;
      assert.exists(myIntervention);
      const myExternalReferenceIds: IExternalReferenceId[] = myIntervention.externalReferenceIds.filter(
        e => e.type === InterventionExternalReferenceType.requestorReferenceNumber
      );
      assert.deepEqual(myExternalReferenceIds, [externalReferenceId]);
    });

    it('C61076 - Positive - Should save the project road network type id', async () => {
      const importProjectRequest: IImportProjectRequest = { bicProjects: [mock.bicProject], features: [mock.feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      assert.strictEqual(myProject.roadNetworkTypeId, ROAD_NETWORK_TYPE_ARTERIAL_LOCAL);
    });

    it('C61077 - Positive - Should save the intervention road network type id', async () => {
      spatialAnalysisServiceStub.initGetRoadNetworkTypeStub(
        sandbox,
        mock.project.roadNetworkTypeId as IRoadNetwork,
        true
      );
      spatialAnalysisServiceStub.initGetRoadNetworkTypeFromRoadSectionsStub(
        sandbox,
        mock.project.roadNetworkTypeId as IRoadNetwork,
        true
      );
      const importProjectRequest: IImportProjectRequest = { bicProjects: [mock.bicProject], features: [mock.feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const myIntervention: IEnrichedIntervention = (await getIntervention(myProject.interventionIds[0]))?.body;
      assert.exists(myIntervention);
      assert.strictEqual(myIntervention.roadNetworkTypeId, ROAD_NETWORK_TYPE_ARTERIAL);
    });
  });
});

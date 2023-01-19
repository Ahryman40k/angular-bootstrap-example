import {
  AnnualProgramStatus,
  IBicProject,
  IComment,
  IEnrichedIntervention,
  IEnrichedProject,
  IFeature,
  IImportProjectRequest,
  ProgramBookStatus,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../config/constants';
import { AnnualProgram } from '../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { getRoadSections, getWorkAreaFeature } from '../../src/features/asset/tests/assetTestHelper';
import { importRelationRepository } from '../../src/features/imports/mongo/importRelationRepository';
import { InterventionFindOptions } from '../../src/features/interventions/models/interventionFindOptions';
import { interventionRepository } from '../../src/features/interventions/mongo/interventionRepository';
import { interventionValidator } from '../../src/features/interventions/validators/interventionValidator';
import { ProgramBook } from '../../src/features/programBooks/models/programBook';
import { createAndSaveProgramBook } from '../../src/features/programBooks/tests/programBookTestHelper';
import { taxonomyService } from '../../src/features/taxonomies/taxonomyService';
import { assetService } from '../../src/services/assetService';
import { projectWorkAreaService } from '../../src/services/projectWorkAreaService';
import { EXECUTOR_OTHER, PROGRAM_TYPE_PCPR } from '../../src/shared/taxonomies/constants';
import { appUtils } from '../../src/utils/utils';
import {
  getBicProject,
  getBicProjectFeature,
  getInvalidPoint,
  getLineString,
  getMultiLineString,
  getPoint,
  getPolygon
} from '../data/importData';
import { createMockIntervention } from '../data/interventionData';
import { createMockProject } from '../data/projectData';
import { userMocks } from '../data/userMocks';
import { requestService } from '../utils/requestService';
import { spatialAnalysisServiceStub } from '../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../utils/testHelper';
import { userMocker } from '../utils/userUtils';
import { integrationAfter } from './_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable-next-line: max-func-body-length
describe('Import controller', () => {
  const interventionUrl: string = appUtils.createPublicFullPath(
    constants.locationPaths.INTERVENTION,
    EndpointTypes.API
  );
  const projectUrl: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  const apiUrl: string = appUtils.createPublicFullPath(
    `${constants.locationPaths.IMPORT_INTERNAL}/projects`,
    EndpointTypes.API
  );
  const apiUrlProgramBook: string = appUtils.createPublicFullPath(
    `${constants.locationPaths.PROGRAM_BOOK}`,
    EndpointTypes.API
  );
  const apiUrlAnnualProgram: string = appUtils.createPublicFullPath(
    `${constants.locationPaths.ANNUAL_PROGRAM}`,
    EndpointTypes.API
  );

  before(() => {
    userMocker.mock(userMocks.pilot);
    const mockRoadSections = getRoadSections();
    const mockWorkAreas = getWorkAreaFeature();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
    sinon.stub(projectWorkAreaService, 'generateWorkArea').returns(Promise.resolve(mockWorkAreas as any));
  });

  after(async () => {
    await integrationAfter();
    sinon.restore();
    userMocker.reset();
  });

  beforeEach(() => {
    spatialAnalysisServiceStub.init(sandbox);
  });

  afterEach(async () => {
    sandbox.restore();
    await destroyDBTests();
  });

  function postBicProject(importProjectRequest: IImportProjectRequest): Promise<request.Response> {
    return requestService.post(apiUrl, { body: importProjectRequest });
  }

  function getIntervention(id: string): Promise<request.Response> {
    return requestService.get(`${interventionUrl}/${id}`);
  }

  function getProject(id: string): Promise<request.Response> {
    return requestService.get(`${projectUrl}/${id}`);
  }

  interface IPostData {
    project: IEnrichedProject;
    intervention: IEnrichedIntervention;
    mockAnnualProgramDi: AnnualProgram;
    mockProgramBookDi: ProgramBook;
    mockAnnualProgramOther: AnnualProgram;
    mockProgramBookOther: ProgramBook;
    bicProject: IBicProject;
    feature: IFeature;
  }

  async function initPostData(): Promise<IPostData> {
    const postData: IPostData = {} as IPostData;
    postData.bicProject = getBicProject();
    postData.feature = getBicProjectFeature();
    postData.mockAnnualProgramDi = await createAndSaveAnnualProgram({
      status: AnnualProgramStatus.new,
      year: appUtils.parseInt(postData.bicProject.ANNEE_ACTUELLE)
    });
    postData.mockProgramBookDi = await createAndSaveProgramBook({
      annualProgram: postData.mockAnnualProgramDi,
      status: ProgramBookStatus.programming,
      projectTypes: [ProjectType.integrated, ProjectType.integratedgp],
      boroughIds: [postData.bicProject.ARRONDISSEMENT_AGIR]
    });
    postData.mockAnnualProgramOther = await createAndSaveAnnualProgram({
      executorId: EXECUTOR_OTHER,
      status: AnnualProgramStatus.new,
      year: appUtils.parseInt(postData.bicProject.ANNEE_ACTUELLE)
    });
    postData.mockProgramBookOther = await createAndSaveProgramBook({
      annualProgram: postData.mockAnnualProgramOther,
      status: ProgramBookStatus.programming,
      projectTypes: [ProjectType.integrated, ProjectType.integratedgp],
      boroughIds: [postData.bicProject.ARRONDISSEMENT_AGIR]
    });
    postData.intervention = await createMockIntervention({ importFlag: 'import-internal' });
    postData.project = await createMockProject(
      {
        interventionIds: [postData.intervention.id]
      },
      {
        projectGeoAnnualDistribution: { annualPeriods: [{ programBookId: postData.mockProgramBookDi.id }] }
      }
    );
    return postData;
  }

  function assertProgramBook(programBook: ProgramBook, project: IEnrichedProject, options?: { status?: string }) {
    const status = options?.status || ProgramBookStatus.programming;
    assert.strictEqual(programBook.status, status);
    assert.isTrue(programBook.projectTypes.includes(project.projectTypeId as ProjectType));
    assert.isTrue(programBook.boroughIds.includes(project.boroughId));
    assert.strictEqual(programBook.id, project.annualDistribution.annualPeriods[0].programBookId);
  }

  function assertAnnualProgram(
    annualProgram: AnnualProgram,
    programBook: ProgramBook,
    options?: { status?: string; startYear?: number; endYear?: number }
  ) {
    const status = options?.status || AnnualProgramStatus.programming;
    const startYear = options?.startYear || null;
    const endYear = options?.endYear || null;
    assert.strictEqual(annualProgram.status, status);
    assert.strictEqual(annualProgram.id, programBook.annualProgram.id);
    if (startYear && endYear) {
      assert.isTrue(startYear <= annualProgram.year && endYear >= annualProgram.year);
    }
  }

  // tslint:disable-next-line: max-func-body-length
  describe('/import/internalData > POST', () => {
    let project: IEnrichedProject;
    let intervention: IEnrichedIntervention;
    let mockAnnualProgramDi: AnnualProgram;
    let mockProgramBookDi: ProgramBook;
    let mockAnnualProgramOther: AnnualProgram;
    let mockProgramBookOther: ProgramBook;
    let bicProject: IBicProject;
    let feature: IFeature;

    beforeEach(async () => {
      const postData = await initPostData();
      project = postData.project;
      intervention = postData.intervention;
      mockAnnualProgramDi = postData.mockAnnualProgramDi;
      mockProgramBookDi = postData.mockProgramBookDi;
      mockAnnualProgramOther = postData.mockAnnualProgramOther;
      mockProgramBookOther = postData.mockProgramBookOther;
      bicProject = postData.bicProject;
      feature = postData.feature;
    });

    it('C52568 Positive - Should delete all existing imported interventions and projects', async () => {
      await importRelationRepository.save({
        bicProjectNumber: bicProject.NO_PROJET.toString(),
        bicProjectId: bicProject?.ID_PROJET?.toString(),
        interventions: [{ interventionId: intervention.id, NO_PROJET: bicProject.NO_PROJET }],
        projectId: project.id
      });
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const postResponse = await postBicProject(importProjectRequest);
      assert.strictEqual(postResponse.status, HttpStatusCodes.CREATED);

      const getInterventionResponse = await getIntervention(intervention.id);
      assert.strictEqual(getInterventionResponse.status, HttpStatusCodes.NOT_FOUND);

      const getProjectResponse = await getProject(project.id);
      assert.strictEqual(getProjectResponse.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C52569 Positive - Should save a project made from a bic project', async () => {
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.body.streetName, bicProject.PROJET_NOM_VOIE);
      assert.strictEqual(response.body.streetFrom, bicProject.PROJET_VOIE_DE);
      assert.strictEqual(response.body.streetTo, bicProject.PROJET_VOIE_A);
    });

    it('C60666 - Positive - Should save projects made from a bic projects in suitable program books', async () => {
      const bicProjectOther = _.cloneDeep(bicProject);
      bicProjectOther.ANNEE_ACTUELLE = mockAnnualProgramOther.year.toString();
      bicProjectOther.EXECUTANT_AGIR = mockAnnualProgramOther.executorId;
      let importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProject],
        features: [feature]
      };
      const responseDi = await postBicProject(importProjectRequest);
      assert.strictEqual(responseDi.status, HttpStatusCodes.CREATED);
      importProjectRequest = {
        bicProjects: [bicProjectOther],
        features: [feature]
      };
      const responseOther = await postBicProject(importProjectRequest);
      assert.strictEqual(responseOther.status, HttpStatusCodes.CREATED);
      assert.strictEqual(
        (responseDi.body as IEnrichedProject).annualDistribution.annualPeriods[0].programBookId,
        mockProgramBookDi.id
      );
      assert.strictEqual(
        (responseOther.body as IEnrichedProject).annualDistribution.annualPeriods[0].programBookId,
        mockProgramBookOther.id
      );
    });

    it('C60597 - Positive - Should save a grand project made from a bic project', async () => {
      bicProject.TYPE_PROJET = ProjectType.integratedgp;
      bicProject.DIVISION_REQUERANT_INITIAL = 'dagp';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.body.inChargeId, bicProject.DIVISION_REQUERANT_INITIAL);
    });

    it('C60298 - Positive - Should save interventions made from a bic project', async () => {
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const responseIntervention = await getIntervention(myProject.interventionIds[0]);
      assert.strictEqual(responseIntervention.status, HttpStatusCodes.OK);
      assert.strictEqual(responseIntervention.body.streetName, bicProject.NOM_VOIE);
      assert.strictEqual(responseIntervention.body.streetFrom, bicProject.VOIE_DE);
      assert.strictEqual(responseIntervention.body.streetTo, bicProject.VOIE_A);
    });

    it('C59044 - Positive - Should save a project made from a bic project and assign it to a programbook', async () => {
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.body.status, ProjectStatus.programmed);
      assert.strictEqual(
        (response.body as IEnrichedProject).annualDistribution.annualPeriods[0].programBookId,
        mockProgramBookDi.id
      );

      const responseProgramBook = await requestService.get(`${apiUrlProgramBook}/${mockProgramBookDi.id}`);
      assert.strictEqual(responseProgramBook.status, HttpStatusCodes.OK);
      assertProgramBook(responseProgramBook.body, response.body);

      const responseAnnualProgram = await requestService.get(`${apiUrlAnnualProgram}/${mockAnnualProgramDi.id}`);
      assert.strictEqual(responseAnnualProgram.status, HttpStatusCodes.OK);
      assertAnnualProgram(responseAnnualProgram.body, mockProgramBookDi, {
        startYear: response.body.startYear,
        endYear: response.body.endYear
      });
    });

    it("C59045 - Positive - Should save a project made from a bic project and be unassign to a programbook when project type doesn't match", async () => {
      bicProject.STATUT_PROJET = ProjectStatus.planned;
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const mockAnnualProgramDI = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new,
        year: appUtils.parseInt(bicProject.ANNEE_ACTUELLE)
      });
      const mockProgramBookDI = await createAndSaveProgramBook({
        annualProgram: mockAnnualProgramDI,
        status: ProgramBookStatus.programming,
        projectTypes: [ProjectType.nonIntegrated],
        programTypes: [PROGRAM_TYPE_PCPR],
        boroughIds: [bicProject.ARRONDISSEMENT_AGIR]
      });
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.body.status, ProjectStatus.planned);
      assert.isUndefined(response.body.programBookId);

      const responseProgramBook = await requestService.get(`${apiUrlProgramBook}/${mockProgramBookDI.id}`);
      assert.strictEqual(responseProgramBook.status, HttpStatusCodes.OK);
      assert.strictEqual(responseProgramBook.body.status, mockProgramBookDI.status);
      assert.isTrue(!responseProgramBook.body.projectTypes.includes(response.body.projectTypeId));

      const responseAnnualProgram = await requestService.get(`${apiUrlAnnualProgram}/${mockAnnualProgramDI.id}`);
      assert.strictEqual(responseAnnualProgram.status, HttpStatusCodes.OK);
      assertAnnualProgram(responseAnnualProgram.body, mockProgramBookDI, {
        status: mockAnnualProgramDi.status,
        startYear: response.body.startYear,
        endYear: response.body.endYear
      });
    });

    it('C60699 - Positive - Should save the intervention comment when it is not empty', async () => {
      bicProject.COMMENTAIRE_INTERVENTION = 'text bidon';
      const commentCategory = await taxonomyService.getTaxonomy(TaxonomyGroup.commentCategory, 'requestor');
      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProject],
        features: [feature]
      };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const responseIntervention = await getIntervention(myProject.interventionIds[0]);
      assert.strictEqual(responseIntervention.status, HttpStatusCodes.OK);
      const interventionComment: IComment = responseIntervention.body.comments[0];
      assert.strictEqual(interventionComment.text, bicProject.COMMENTAIRE_INTERVENTION);
      assert.strictEqual(interventionComment.isPublic, true);
      assert.strictEqual(interventionComment.categoryId, commentCategory.code);
    });

    it('C60785 - Positive - Should save the intervention medal when asset type is amenagement', async () => {
      const assetType = await taxonomyService.getTaxonomy(TaxonomyGroup.assetType, 'amenagement');
      const medalType = await taxonomyService.getTaxonomy(TaxonomyGroup.medalType, 'silver');
      bicProject.MEDAILLE_AMENAGEMENT = medalType.code;
      bicProject.TYPE_ACTIF_AGIR = assetType.code;
      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProject],
        features: [feature]
      };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const responseIntervention = await getIntervention(myProject.interventionIds[0]);
      assert.strictEqual(responseIntervention.status, HttpStatusCodes.OK);
      const myIntervention: IEnrichedIntervention = responseIntervention.body;
      assert.strictEqual(myIntervention.assets[0].typeId, assetType.code);
      assert.strictEqual(myIntervention.medalId, medalType.code);
    });

    it('C60786 - Positive - Should save in the project the max intervention medal depending on its weight', async () => {
      const medals = ['silver', 'gold'];
      const assetType = await taxonomyService.getTaxonomy(TaxonomyGroup.assetType, 'amenagement');
      const medalType = await taxonomyService.getTaxonomy(TaxonomyGroup.medalType, medals[0]);
      bicProject.MEDAILLE_AMENAGEMENT = medalType.code;
      bicProject.TYPE_ACTIF_AGIR = assetType.code;
      const bicProjectMax = { ...bicProject };
      bicProjectMax.MEDAILLE_AMENAGEMENT = medals[1];
      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProject, bicProjectMax],
        features: [feature]
      };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const interventionFindOptions = InterventionFindOptions.create({
        criterias: {
          id: myProject.interventionIds
        }
      }).getValue();
      const responseInterventions = await interventionRepository.findAll(interventionFindOptions);
      for (const responseIntervention of responseInterventions) {
        assert.include(medals, responseIntervention.medalId);
      }
      assert.strictEqual(myProject.medalId, medals[1]);
    });

    it(`C60787 - Positive - Should save the project's medal even if one is missing in interventions`, async () => {
      const medals = ['silver', 'gold'];
      const assetType = await taxonomyService.getTaxonomy(TaxonomyGroup.assetType, 'amenagement');
      const medalType = await taxonomyService.getTaxonomy(TaxonomyGroup.medalType, medals[0]);
      bicProject.MEDAILLE_AMENAGEMENT = medalType.code;
      bicProject.TYPE_ACTIF_AGIR = assetType.code;
      const bicProjectNull = { ...bicProject };
      delete bicProjectNull.MEDAILLE_AMENAGEMENT;
      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProject, bicProjectNull],
        features: [feature]
      };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const interventionFindOptions = InterventionFindOptions.create({
        criterias: {
          id: myProject.interventionIds
        },
        orderBy: 'id'
      }).getValue();
      const responseInterventions = await interventionRepository.findAll(interventionFindOptions);
      for (const responseIntervention of responseInterventions) {
        assert.include([...medals, undefined], responseIntervention.medalId);
      }
      assert.isUndefined(responseInterventions[1].medalId);
      assert.isDefined(myProject.medalId);
    });

    it('C60788 - Negative - Should not save the intervention medal when asset type is not amenagement', async () => {
      const validateImportStub = sinon.stub(interventionValidator, 'validateImport').resolves();
      const assetType = await taxonomyService.getTaxonomy(TaxonomyGroup.assetType, 'saillieSidewalk');
      const medalType = await taxonomyService.getTaxonomy(TaxonomyGroup.medalType, 'silver');
      bicProject.MEDAILLE_AMENAGEMENT = medalType.code;
      bicProject.TYPE_ACTIF_AGIR = assetType.code;
      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProject],
        features: [feature]
      };
      const response = await postBicProject(importProjectRequest);
      const myProject = response.body;
      const responseIntervention = await getIntervention(myProject.interventionIds[0]);
      assert.strictEqual(responseIntervention.status, HttpStatusCodes.OK);
      assert.isUndefined(responseIntervention.body.medalId);
      validateImportStub.restore();
    });

    it('C60789 - Negative - Should not save the project when one intervention medal is absent from taxonomy', async () => {
      const assetType = await taxonomyService.getTaxonomy(TaxonomyGroup.assetType, 'amenagement');
      bicProject.MEDAILLE_AMENAGEMENT = 'medal of honor';
      bicProject.TYPE_ACTIF_AGIR = assetType.code;
      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProject],
        features: [feature]
      };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C52571 Negative - Should return an error when the bic project received is empty or invalid', async () => {
      const emptyProject = {};
      const emptyProjectResponse = await postBicProject(emptyProject as any);
      assert.strictEqual(emptyProjectResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C60700 - Negative - Should not save the intervention comment when it is empty', async () => {
      bicProject.COMMENTAIRE_INTERVENTION = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const myProject = response.body;
      const responseIntervention = await getIntervention(myProject.interventionIds[0]);
      assert.strictEqual(responseIntervention.status, HttpStatusCodes.OK);
      assert.isUndefined(responseIntervention.body.comments);
    });
  });

  // tslint:disable-next-line: max-func-body-length
  describe('/import/generate > POST', () => {
    let mockAnnualProgram: AnnualProgram;
    let bicProject: IBicProject;

    beforeEach(async () => {
      bicProject = getBicProject();
      mockAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.programming,
        year: appUtils.parseInt(bicProject.ANNEE_ACTUELLE)
      });
      await createAndSaveProgramBook({
        annualProgram: mockAnnualProgram,
        status: ProgramBookStatus.programming,
        projectTypes: [ProjectType.integrated, ProjectType.integratedgp],
        boroughIds: [bicProject.ARRONDISSEMENT_AGIR]
      });
      await createMockIntervention({ importFlag: 'import-internal' });
    });

    it('C53194 Positive - Should generate the workArea of a lineString', async () => {
      const feature = getBicProjectFeature(getLineString());
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const generationResponse = await postBicProject(importProjectRequest);
      assert.strictEqual(generationResponse.status, HttpStatusCodes.CREATED);
    });

    it('C53195 Positive - Should generate the workArea of a multiLineString', async () => {
      const feature = getBicProjectFeature(getMultiLineString());
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const generationResponse = await postBicProject(importProjectRequest);
      assert.strictEqual(generationResponse.status, HttpStatusCodes.CREATED);
    });

    it('C53196 Positive - Should generate the workArea of a point', async () => {
      const feature = getBicProjectFeature(getPoint());
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const generationResponse = await postBicProject(importProjectRequest);
      assert.strictEqual(generationResponse.status, HttpStatusCodes.CREATED);
    });

    it('C53197 Positive - Should generate the workArea of a polygon', async () => {
      const feature = getBicProjectFeature(getPolygon());
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const generationResponse = await postBicProject(importProjectRequest);
      assert.strictEqual(generationResponse.status, HttpStatusCodes.CREATED);
    });

    it('C53198 Positive - Should return an error when the geometry is invalid', async () => {
      const feature = getBicProjectFeature(getInvalidPoint());
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const generationResponse = await postBicProject(importProjectRequest);
      assert.strictEqual(generationResponse.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C53199 Positive - Should return the successful project', async () => {
      const feature = getBicProjectFeature(getPoint());
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const generationResponse = await postBicProject(importProjectRequest);
      assert.isTrue(!!generationResponse.body.id);
    });
  });
});

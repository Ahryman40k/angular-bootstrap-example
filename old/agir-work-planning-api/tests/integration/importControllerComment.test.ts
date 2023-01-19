import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  CommentCategory,
  IBicProject,
  IComment,
  IFeature,
  IImportProjectRequest,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as _ from 'lodash';
import sinon = require('sinon');

import { getRoadSections, getWorkAreaFeature } from '../../src/features/asset/tests/assetTestHelper';
import { assetService } from '../../src/services/assetService';
import { projectWorkAreaService } from '../../src/services/projectWorkAreaService';
import { getBicProjectFeature } from '../data/importData';
import { userMocks } from '../data/userMocks';
import { importTestUtils } from '../utils/import/importTestUtils';
import { spatialAnalysisServiceStub } from '../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../utils/testHelper';
import { userMocker } from '../utils/userUtils';
import { integrationAfter } from './_init.test';

const sandbox = sinon.createSandbox();
let feature: IFeature;

describe('Import controller', () => {
  after(async () => {
    await integrationAfter();
  });

  before(() => {
    userMocker.mock(userMocks.admin);
    const mockRoadSections = getRoadSections();
    const mockWorkAreas = getWorkAreaFeature();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
    sinon.stub(projectWorkAreaService, 'generateWorkArea').returns(Promise.resolve(mockWorkAreas as any));
  });

  after(() => {
    sinon.restore();
    userMocker.reset();
  });

  beforeEach(() => {
    spatialAnalysisServiceStub.init(sandbox);
    feature = getBicProjectFeature();
  });

  afterEach(async () => {
    sandbox.restore();
    await destroyDBTests();
  });

  function assertComment(comment: IComment, commentData: Partial<IComment>) {
    assert.strictEqual(comment.text, commentData.text);
    assert.strictEqual(comment.categoryId, commentData.categoryId);
    assert.strictEqual(comment.isPublic, commentData.isPublic);
    assert.exists(comment.audit);
  }

  // tslint:disable-next-line: max-func-body-length
  describe('/import/projects (project comments) > POST', () => {
    it('C60701 - Positive - Should save a project comment from the information category', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      const commentPart1 = `*2. Info Travaux *: \n
      - GP : Plaza : - Travaux d'infrastructure à l'automne en 2018, sur deux périodes annuelles. Sept. 2018 - sept. 2019\n
      - CSEM : travaux majeurs d'un an et demi à 2 ans, intégrer dans AO Ville.`;
      const commentPart2 = `* Autres infos*:\n
      (Installation d'une nouvelle marquise; Travaux d'infrastructures souterraines, de voirie et d'éclairage; Travaux d'aménagement)`;

      bicProjectComment.PROJET_COMMENTAIRE_INFO = `${commentPart1} || ${commentPart2}`;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: commentPart1,
        categoryId: CommentCategory.information,
        isPublic: true
      });
      assertComment(response.body.comments[1], {
        text: commentPart2,
        categoryId: CommentCategory.information,
        isPublic: true
      });
    });

    it('C60702 - Negative - Should not save a project comment from the information category', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      bicProjectComment.PROJET_COMMENTAIRE_INFO = ``;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isTrue(_.isEmpty(response.body.comments));
    });

    it('C60703 - Positive - Should save a project comment from the requestor category', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      const commentPart1 = `REQUERANT: TRANSP - Courriel confirmé il n'y a pas de projet à court terme pour Caillou par le TAC John Wick`;
      const commentPart2 = `REQUERANT: TRANSP - Caillou n'est pas content`;

      bicProjectComment.PROJET_COMMENTAIRE_REQ = `${commentPart1} || ${commentPart2}`;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: commentPart1,
        categoryId: CommentCategory.requestor,
        isPublic: true
      });
      assertComment(response.body.comments[1], {
        text: commentPart2,
        categoryId: CommentCategory.requestor,
        isPublic: true
      });
    });

    it('C60704 - Negative - Should not save a project comment from the requestor category', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      bicProjectComment.PROJET_COMMENTAIRE_REQ = ``;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isTrue(_.isEmpty(response.body.comments));
    });

    it('C60705 - Positive - Should save a project comment from the historic category', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      const commentPart1 = `*1. Historique *: \n- DEEU : Égout collecteur par GP en micro tunnelier en 2018`;
      const commentPart2 = `*1. Historique *: \n- DEP : Arbre sur rue`;

      bicProjectComment.PROJET_COMMENTAIRE_HISTO = `${commentPart1} || ${commentPart2}`;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: commentPart1,
        categoryId: CommentCategory.historic,
        isPublic: true
      });
      assertComment(response.body.comments[1], {
        text: commentPart2,
        categoryId: CommentCategory.historic,
        isPublic: true
      });
    });

    it('C60706 - Negative - Should not save a project comment from the historic category', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      bicProjectComment.PROJET_COMMENTAIRE_HISTO = ``;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isTrue(_.isEmpty(response.body.comments));
    });
    it('C60733 - Negative - Should not save a repeated project comment', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      bicProjectComment.PROJET_COMMENTAIRE_HISTO = ``;
      const commentPart1 = `mobilité, axes se croissent`;
      const commentPart2 = `mobilité, grande concentration de projets`;

      bicProjectComment.PROJET_COMMENTAIRE_HISTO = `${commentPart1} || ${commentPart2}`;

      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProjectComment, bicProjectComment],
        features: [feature]
      };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.lengthOf(response.body.comments, 2);
    });
  });

  // tslint:disable-next-line: max-func-body-length
  describe('/import/projects > POST constraint comment', () => {
    it('C60734 - Positive - Should save a constraint project comment', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      const commentPart1 = `mobilité, axes se croissent`;
      const commentPart2 = `mobilité, grande concentration de projets`;

      bicProjectComment.PROJET_CONTRAINTE = `${commentPart1} || ${commentPart2}`;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: commentPart1,
        categoryId: CommentCategory.constraintDescription,
        isPublic: true
      });
      assertComment(response.body.comments[1], {
        text: commentPart2,
        categoryId: CommentCategory.constraintDescription,
        isPublic: true
      });
    });

    it('C60735 - Negative - Should not save a constraint project comment', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      bicProjectComment.PROJET_CONTRAINTE = ``;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectComment], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isTrue(_.isEmpty(response.body.comments));
    });

    it('C60736 - Negative - Should not save a repeated constraint project comment', async () => {
      const bicProjectComment = importTestUtils.mockBicProject();
      bicProjectComment.PROJET_CONTRAINTE = ``;
      const commentPart1 = `mobilité, axes se croissent`;
      const commentPart2 = `mobilité, grande concentration de projets`;

      bicProjectComment.PROJET_CONTRAINTE = `${commentPart1} || ${commentPart2}`;

      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProjectComment, bicProjectComment],
        features: [feature]
      };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.lengthOf(response.body.comments, 2);
    });
  });

  // tslint:disable-next-line: max-func-body-length
  describe('import/internal/projects > POST', () => {
    let bicProject: IBicProject;

    beforeEach(() => {
      bicProject = importTestUtils.mockBicProject();
      bicProject.STATUT_PROJET = ProjectStatus.planned;
    });

    it('C60722 Positive - Should save a projet comment from the other risk comment', async () => {
      bicProject.RISQUE_AUTRE_COMMENT = 'Risque - Autre: PE-911';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: bicProject.RISQUE_AUTRE_COMMENT,
        categoryId: CommentCategory.risk,
        isPublic: true
      });
    });

    it('C60723 Positive - Should save a projet comment from the buried risk comment', async () => {
      bicProject.RISQUE_ENFOUISS_COMMENT = 'Risque - Projet enfouissement: PE-911';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: bicProject.RISQUE_ENFOUISS_COMMENT,
        categoryId: CommentCategory.risk,
        isPublic: true
      });
    });

    it('C60725 Positive - Should save a projet comment from the acquisition risk comment', async () => {
      bicProject.RISQUE_ACQUIS_TERRAIN = 'Risque - Acquisition de terrains / servitudes';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: bicProject.RISQUE_ACQUIS_TERRAIN,
        categoryId: CommentCategory.risk,
        isPublic: true
      });
    });

    it('C60726 Positive - Should save a projet comment from the waiting risk comment', async () => {
      bicProject.RISQUE_ENTENTE = 'Risque - Attente';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: bicProject.RISQUE_ENTENTE,
        categoryId: CommentCategory.risk,
        isPublic: true
      });
    });

    it('C60727 Positive - Should save a projet comment from the boroughs', async () => {
      bicProject.COMMENTAIRE_ARRONDISSEMENT = 'Commentaire - Arrondissement: Pas de projet prévu';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: bicProject.COMMENTAIRE_ARRONDISSEMENT,
        categoryId: CommentCategory.information,
        isPublic: true
      });
    });

    it('C60728 Positive - Should save a projet comment from the MTQ', async () => {
      bicProject.COMMENTAIRE_MTQ_INFO_RTU = 'MTQ - Info-RTU: 000000911';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertComment(response.body.comments[0], {
        text: bicProject.COMMENTAIRE_MTQ_INFO_RTU,
        categoryId: CommentCategory.information,
        isPublic: true
      });
    });

    it('C60741 Negative - Should not save a projet comment if the other risk comment is empty', async () => {
      bicProject.RISQUE_AUTRE_COMMENT = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isEmpty(response.body.comments);
    });

    it('C60740 Negative - Should not save a projet comment if the buried risk comment is empty', async () => {
      bicProject.RISQUE_ENFOUISS_COMMENT = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isEmpty(response.body.comments);
    });

    it('C60742 Negative - Should not save a projet comment if the acquisition risk comment is empty', async () => {
      bicProject.RISQUE_ACQUIS_TERRAIN = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isEmpty(response.body.comments);
    });

    it('C60743 Negative - Should not save a projet comment if the waiting risk comment is empty', async () => {
      bicProject.RISQUE_ENTENTE = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isEmpty(response.body.comments);
    });

    it('C60744 Negative - Should not save a projet comment if the borough comment is empty', async () => {
      bicProject.COMMENTAIRE_ARRONDISSEMENT = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isEmpty(response.body.comments);
    });

    it('C60745 Negative - Should not save a projet comment if the MTQ comment is empty', async () => {
      bicProject.COMMENTAIRE_MTQ_INFO_RTU = '';
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isEmpty(response.body.comments);
    });
  });
});

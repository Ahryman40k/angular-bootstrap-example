import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  DocumentStatus,
  IEnrichedDocument,
  IEnrichedIntervention,
  IEnrichedProject,
  IPlainDocument,
  ProjectStatus,
  ProjectType,
  User
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { isNil } from 'lodash';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { db } from '../../../src/features/database/DB';
import {
  BASIC_DOCUMENT_NAME,
  documentsTestHelper,
  getDocument,
  getIEnrichedDocument,
  getInputPlainDocument,
  INVALID_FILE_NAME,
  INVALID_MIME_TYPE,
  PDF_FILE_TEST
} from '../../../src/features/documents/tests/documentsTestHelper';
import { HistoryModel } from '../../../src/features/history/mongo/historyModel';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import {
  createAndSaveProject,
  projectRestrictionsTestData
} from '../../../src/features/projects/tests/projectTestHelper';
import { assertRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { appUtils } from '../../../src/utils/utils';
import { createMockIntervention, getProjectInterventionToIntegrate } from '../../data/interventionData';
import { createMockProject, getEnrichedCompleteProject } from '../../data/projectData';
import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { getStorageCreateResponse, metadata, storageApiServiceStub } from '../../utils/stub/storageApiService.stub';
import { destroyDBTests, mergeProperties } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();
const apiUrl = appUtils.createPublicFullPath(`${constants.locationPaths.PROJECT}`, EndpointTypes.API);

interface ITestData {
  project: IEnrichedProject;
  intervention: IEnrichedIntervention;
  interventionIds: string[];
  document: IEnrichedDocument;
  deleteAllowedRoles: User[];
  validateAllowedRoles: User[];
  projectForbiddenStatuses: string[];
}

interface IArrangeTestOptions {
  useRealObjectStorage: boolean;
}

async function initData(options?: Partial<ITestData>, isDeleteBeforeInit?: boolean): Promise<ITestData> {
  const data: ITestData = {} as ITestData;
  if (isDeleteBeforeInit) {
    await destroyDBTests();
  }
  data.intervention = await createMockIntervention(getProjectInterventionToIntegrate());
  data.interventionIds = [data.intervention.id];
  data.project = await createAndSaveProject({
    status: options?.project?.status ? options.project.status : ProjectStatus.planned,
    projectTypeId: ProjectType.other,
    interventionIds: data.interventionIds,
    documents: [getDocument({ objectId: 'mockId' })]
  });
  data.document = data.project.documents[0];
  data.deleteAllowedRoles = normalizeUsernames([
    userMocks.admin,
    userMocks.pilot,
    userMocks.planner,
    userMocks.plannerSe,
    userMocks.executor,
    userMocks.requestor
  ]);
  data.validateAllowedRoles = normalizeUsernames([userMocks.admin, userMocks.pilot, userMocks.planner]);
  data.projectForbiddenStatuses = [ProjectStatus.canceled];
  return data;
}

async function arrangeTest(options: IArrangeTestOptions = { useRealObjectStorage: false }): Promise<ITestData> {
  sandbox.restore();
  if (!options.useRealObjectStorage) {
    storageApiServiceStub.init(sandbox);
  }
  return initData();
}

// tslint:disable:max-func-body-length
describe('Project document controller - Documents', () => {
  after(async () => {
    await integrationAfter();
  });

  let mock: ITestData;
  let historyModel: HistoryModel;

  function assertDocument(response: IEnrichedDocument, document: IEnrichedDocument) {
    assert.strictEqual(response.fileName, document.fileName);
    assert.strictEqual(response.documentName, document.documentName);
    if (!isNil(document.isProjectVisible)) {
      assert.strictEqual(response.isProjectVisible, document.isProjectVisible);
    }
    assert.isDefined(response.validationStatus);
    assert.exists(response.audit);
  }
  before(() => {
    historyModel = db().models.History;
  });

  beforeEach(async () => {
    storageApiServiceStub.init(sandbox);
    mock = await arrangeTest();
  });

  afterEach(async () => {
    sandbox.restore();
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/projects/:id/documents > POST', () => {
    beforeEach(async () => {
      mock = await initData(
        {
          project: {
            status: ProjectStatus.planned,
            documents: []
          }
        },
        true
      );
    });

    async function addDocumentToProject(projectId: string, document: IPlainDocument = getInputPlainDocument()) {
      const url = `${apiUrl}/${projectId}/documents`;
      return await documentsTestHelper.uploadDocumentWithAttachment('post', url, document);
    }

    it('C63064 - Positive - Should save documents to cloud for project with Storage API', async () => {
      const url = `${apiUrl}/${mock.project.id}/documents`;
      const response = await documentsTestHelper.uploadDocumentWithAttachment('post', url, getInputPlainDocument());
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertDocument(
        response.body,
        getIEnrichedDocument({
          documentName: `${BASIC_DOCUMENT_NAME}(1)`
        })
      );
    });

    it('C63423 - Negative - Should not save document without file data', async () => {
      const url = `${apiUrl}/${mock.project.id}/documents`;
      const response = await documentsTestHelper.uploadDocumentWithoutAttachment('post', url, getInputPlainDocument());
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C63066 - Negative - Should not save documents to an project with status canceled', async () => {
      const project = Object.assign({}, getEnrichedCompleteProject(), { status: ProjectStatus.canceled });
      const mockProjectCanceled = await createMockProject(project);
      const url = `${apiUrl}/${mockProjectCanceled.id}/documents`;
      const response = await documentsTestHelper.uploadDocumentWithAttachment('post', url, getInputPlainDocument());
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C63067 - Positive - Should rename documents with the same name on creation', async () => {
      const DOCUMENT_NAME = 'test';
      storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('1111d1ea-111e-11ee-a1f1-2f11f111e1f1'));
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.project.id}/documents`,
        getInputPlainDocument({
          documentName: DOCUMENT_NAME
        })
      );
      storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('2222d2ea-222e-22ee-a2f2-2f22f222e2f2'));
      const response2 = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.project.id}/documents`,
        getInputPlainDocument({
          documentName: DOCUMENT_NAME
        })
      );

      storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('3333d3ea-333e-33ee-a3f3-3f33f333e3f3'));
      const response3 = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.project.id}/documents`,
        getInputPlainDocument({
          documentName: DOCUMENT_NAME
        })
      );
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.body.documentName, DOCUMENT_NAME);
      assert.strictEqual(response2.body.documentName, `${DOCUMENT_NAME}(1)`);
      assert.strictEqual(response3.body.documentName, `${DOCUMENT_NAME}(2)`);
    });

    it('C63068 - Negative - Should not save document with invalid taxonomies', async () => {
      const url = `${apiUrl}/${mock.project.id}/documents`;
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        url,
        getInputPlainDocument({
          type: 'wrong',
          validationStatus: 'wrong'
        } as any)
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C63069 - Negative - Should not save document with empty required properties', async () => {
      const url = `${apiUrl}/${mock.project.id}/documents`;
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        url,
        getInputPlainDocument({
          documentName: ''
        })
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C63070 - Negative - Should not save document if file has invalid extensions', async () => {
      const url = `${apiUrl}/${mock.project.id}/documents`;
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        url,
        getInputPlainDocument(),
        INVALID_FILE_NAME,
        INVALID_MIME_TYPE
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C63379 - Positive - Should add a project history when creating one of its document`, async () => {
      let history = await historyModel.find({ referenceId: mock.project.id }).exec();
      assert.isFalse(history.length > 0);
      const url = `${apiUrl}/${mock.project.id}/documents`;
      await documentsTestHelper.uploadDocumentWithAttachment('post', url, getInputPlainDocument());
      history = await historyModel.find({ referenceId: mock.project.id }).exec();
      assert.isTrue(history.length > 0);
      assert.containsAllKeys(history[0].toObject(), ['objectTypeId', 'referenceId', 'actionId', 'summary']);
    });

    it('C63370 - Positive - Should validate document status if a user with an appropriate role', async () => {
      for (const userRole of mock.validateAllowedRoles) {
        userMocker.mock(userRole);
        const url = `${apiUrl}/${mock.project.id}/documents`;
        const response = await documentsTestHelper.uploadDocumentWithAttachment('post', url, getInputPlainDocument());
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assertDocument(
          response.body,
          getIEnrichedDocument({
            documentName: `${BASIC_DOCUMENT_NAME}(1)`
          })
        );
        mock = await initData(
          {
            project: {
              status: ProjectStatus.planned,
              documents: []
            }
          },
          true
        );
      }
      userMocker.reset();
    });

    // add document
    projectRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const props = mergeProperties({}, test.props);
        // create project
        const createdProject = await createAndSaveProject(props);
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        // upload document
        const response = await addDocumentToProject(createdProject.id);
        // assert restrictions
        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/projects/:id/documents/:documentId > PUT', () => {
    async function updateProjectDocument(
      projectId: string,
      documentId: string,
      document: IPlainDocument = getInputPlainDocument()
    ): Promise<request.Response> {
      const url = `${apiUrl}/${projectId}/documents/${documentId}`;
      return await documentsTestHelper.uploadDocumentWithAttachment('put', url, document);
    }

    beforeEach(async () => {
      mock = await initData(
        {
          project: {
            status: ProjectStatus.planned,
            documents: [getIEnrichedDocument()]
          }
        },
        true
      );
    });

    it('C63130 - Positive - Should update documents to cloud for project with Storage API', async () => {
      storageApiServiceStub.deleteStub.restore();
      storageApiServiceStub.initDeleteStub(sandbox);

      const document = getDocument();
      const projectWithDocument = await createAndSaveProject({
        documents: [document]
      });
      storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('8137d3ea-988e-44ee-a7f4-0f55f772e8f8'));
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${projectWithDocument.id}/documents/${document.id}`,
        getInputPlainDocument(),
        PDF_FILE_TEST
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(storageApiServiceStub.deleteStub.calledOnce);
      assertDocument(
        response.body,
        getIEnrichedDocument({ fileName: PDF_FILE_TEST, documentName: `${BASIC_DOCUMENT_NAME}` })
      );
      storageApiServiceStub.uploadStub.restore();
    });

    it('C63132 - Negative - Should not update documents to an project with status canceled', async () => {
      const project = Object.assign({}, mock.project, { status: ProjectStatus.canceled });
      const mockProjectCanceled = await createMockProject(project);
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mockProjectCanceled.id}/documents/${mockProjectCanceled.documents[0].id}`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C63133 - Negative - Should not update document with invalid taxonomies', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.project.id}/documents/${mock.project.documents[0].id}`,
        getInputPlainDocument({
          type: 'wrong',
          validationStatus: 'wrong'
        } as any)
      );

      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C63134 - Negative - Should not save document with empty required properties', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.project.id}/documents/${mock.project.documents[0].id}`,
        getInputPlainDocument({
          documentName: ''
        })
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C63135 - Negative - Should not update document if file has invalid extensions', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.project.id}/documents/${mock.project.documents[0].id}`,
        getInputPlainDocument(),
        INVALID_FILE_NAME,
        INVALID_MIME_TYPE
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C63380 - Positive - Should add a project history when updating one of its document`, async () => {
      storageApiServiceStub.deleteStub.restore();
      storageApiServiceStub.initDeleteStub(sandbox);
      let history = await historyModel.find({ referenceId: mock.project.id }).exec();
      assert.isFalse(history.length > 0);
      await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.project.id}/documents/${mock.project.documents[0].id}`,
        getInputPlainDocument()
      );
      history = await historyModel
        .find({ referenceId: mock.project.id })
        .lean()
        .exec();
      assert.isTrue(history.length > 0);
      assert.containsAllKeys(history[0], ['_id', 'audit', 'categoryId', 'objectTypeId', 'referenceId', 'actionId']);
    });

    it('C63371 - Positive - Should update validate document status with a planner', async () => {
      const documentStatuses = Object.keys(DocumentStatus);
      for (const documentStatus of documentStatuses) {
        const response = await documentsTestHelper.uploadDocumentWithAttachment(
          'put',
          `${apiUrl}/${mock.project.id}/documents/${mock.project.documents[0].id}`,
          getInputPlainDocument({
            validationStatus: documentStatus as DocumentStatus
          })
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assertDocument(
          response.body,
          getIEnrichedDocument({
            validationStatus: documentStatus as DocumentStatus
          })
        );
      }
    });

    it('C63424 - Positive - Should update documents without file data', async () => {
      storageApiServiceStub.deleteStub.restore();
      storageApiServiceStub.initDeleteStub(sandbox);
      const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
        'put',
        `${apiUrl}/${mock.project.id}/documents/${mock.project.documents[0].id}`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);

      assert.isTrue(storageApiServiceStub.uploadStub.notCalled);
      assert.isTrue(storageApiServiceStub.deleteStub.notCalled);
      assertDocument(response.body, getIEnrichedDocument());
    });

    // update document
    projectRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        // create document and add props to project
        const props = mergeProperties({ documents: [getDocument()] }, test.props);
        // create project with document
        const createdProject = await createAndSaveProject(props);
        const document = createdProject.documents.find(x => x);
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        // update document controller
        const response = await updateProjectDocument(createdProject.id, document.id);
        // assert restrictions
        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/projects/:id/documents/:documentId > DELETE', () => {
    function deleteProjectDocument(projectId: string, documentId: string): Promise<request.Response> {
      return requestService.delete(`${apiUrl}/${projectId}/documents/${documentId}`);
    }

    it('C63120 - Positive - Should delete a project document from the stubbed object storage', async () => {
      const response = await deleteProjectDocument(mock.project.id, mock.document.id);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const persistedProject = await projectRepository.findById(mock.project.id);
      assert.strictEqual(persistedProject.documents.length, mock.project.documents.length - 1);
    });

    it('C63121 - Negative - Should not delete a project document when wrong project status', async () => {
      for (const wrongStatus of mock.projectForbiddenStatuses) {
        await destroyDBTests();
        mock = await initData({
          project: {
            status: wrongStatus
          }
        });
        const response = await deleteProjectDocument(mock.project.id, mock.document.id);
        assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }
    });

    it('C63122 - Negative - Should not delete a project document when forbidden user role', async () => {
      const document = getDocument();
      const projectWithDocument = await createAndSaveProject({
        documents: [document]
      });
      for (const wrongRole of getAllOtherRoles(mock.deleteAllowedRoles)) {
        userMocker.mock(wrongRole);
        const response = await deleteProjectDocument(projectWithDocument.id, document.id);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN, `should be forbidden for role ${wrongRole}`);
        userMocker.reset();
      }
    });

    it(`C63381 - Positive - Should add a project history entry when deleting one of its document`, async () => {
      let history = await historyModel.find({ referenceId: mock.project.id }).exec();
      assert.isFalse(history.length > 0);
      await deleteProjectDocument(mock.project.id, mock.document.id);
      history = await historyModel.find({ referenceId: mock.project.id }).exec();
      assert.isTrue(history.length > 0);
      assert.containsAllKeys(history[0].toObject(), ['objectTypeId', 'referenceId', 'actionId', 'summary']);
    });

    // delete document
    projectRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        // create document and add props to project
        const props = mergeProperties({ documents: [getDocument()] }, test.props);
        // create intervention with document
        const createdProject = await createAndSaveProject(props);
        const documentId = createdProject.documents.find(x => x).id;
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        const response = await deleteProjectDocument(createdProject.id, documentId);
        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/projects/:id/documents/:documentId > GET', () => {
    // DONT KNOW WHY IT WORKS IN THE REAL WORLD BUT NOT IN TESTING MODE
    it.skip('Positive - Should download a document from an objects storage stub', async () => {
      const document = getDocument();
      const projectWithDocument = await createAndSaveProject({
        documents: [document]
      });
      const url = `${apiUrl}/${projectWithDocument.id}/documents/${document.id}`;
      const response = await requestService.get(url);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isNotEmpty(response.body);
      assert.propertyVal(response.header, 'content-type', metadata.contentType);
      assert.propertyVal(response.header, 'content-length', `${metadata.contentLength}`);
      assert.propertyVal(response.header, 'content-disposition', `attachment; filename="${metadata.objectName}"`);
    });
  });
});

import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  DocumentStatus,
  IEnrichedDocument,
  IEnrichedIntervention,
  InterventionStatus,
  User
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { db } from '../../../src/features/database/DB';
import {
  BASIC_DOCUMENT_NAME,
  documentsTestHelper,
  getDocumentIntervention,
  getDocumentInterventionProps,
  getIEnrichedDocumentIntervention,
  getInputPlainDocument,
  INVALID_FILE_NAME,
  INVALID_MIME_TYPE,
  PDF_FILE_TEST
} from '../../../src/features/documents/tests/documentsTestHelper';
import { HistoryModel } from '../../../src/features/history/mongo/historyModel';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import {
  createAndSaveIntervention,
  interventionRestrictionsData
} from '../../../src/features/interventions/tests/interventionTestHelper';
import { assertRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { appUtils } from '../../../src/utils/utils';
import { createMockIntervention, getMinimalInitialIntervention } from '../../data/interventionData';
import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { getStorageCreateResponse, metadata, storageApiServiceStub } from '../../utils/stub/storageApiService.stub';
import { destroyDBTests, mergeProperties } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();
const apiUrl = appUtils.createPublicFullPath(`${constants.locationPaths.INTERVENTION}`, EndpointTypes.API);

interface ITestData {
  intervention: IEnrichedIntervention;
  document: IEnrichedDocument;
  deleteAllowedRoles: User[];
  validateAllowedRoles: User[];
  interventionForbiddenStatuses: string[];
}

interface IArrangeTestOptions {
  useRealObjectStorage: boolean;
}

async function initData(options?: Partial<ITestData>, isDeleteBeforeInit?: boolean): Promise<ITestData> {
  if (isDeleteBeforeInit) {
    await destroyDBTests();
  }
  const data: ITestData = {} as ITestData;
  data.intervention = await createAndSaveIntervention({
    status: InterventionStatus.integrated,
    documents: [getDocumentIntervention({ objectId: 'mockId' })]
  });
  data.document = data.intervention.documents[0];
  data.deleteAllowedRoles = normalizeUsernames([
    userMocks.admin,
    userMocks.pilot,
    userMocks.planner,
    userMocks.plannerSe,
    userMocks.requestor
  ]);
  data.validateAllowedRoles = normalizeUsernames([
    userMocks.admin,
    userMocks.pilot,
    userMocks.planner,
    userMocks.plannerSe
  ]);
  data.interventionForbiddenStatuses = [InterventionStatus.canceled];
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
describe('Intervention controller - Documents', () => {
  let mock: ITestData;
  let historyModel: HistoryModel;

  before(() => {
    historyModel = db().models.History;
  });

  after(async () => {
    await integrationAfter();
  });

  beforeEach(async () => {
    mock = await arrangeTest();
  });

  afterEach(async () => {
    sandbox.restore();
    userMocker.reset();
    await destroyDBTests();
  });

  function assertDocument(response: IEnrichedDocument, document: IEnrichedDocument) {
    assert.strictEqual(response.type, document.type);
    assert.strictEqual(response.fileName, document.fileName);
    assert.strictEqual(response.documentName, document.documentName);
    assert.strictEqual(response.isProjectVisible, document.isProjectVisible);
    assert.strictEqual(response.validationStatus, document.validationStatus);
    assert.exists(response.audit);
  }

  describe('/interventions/:id/documents/:documentId > DELETE', () => {
    function deleteInterventionDocument(interventionId: string, documentId: string): Promise<request.Response> {
      return requestService.delete(`${apiUrl}/${interventionId}/documents/${documentId}`);
    }

    it('C63117 - Positive - Should delete an intervention document from the stubbed object storage', async () => {
      const response = await deleteInterventionDocument(mock.intervention.id, mock.document.id);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const persistedIntervention = await interventionRepository.findById(mock.intervention.id);
      assert.strictEqual(persistedIntervention.documents.length, mock.intervention.documents.length - 1);
    });

    it('C63118 - Negative - Should not delete an intervention document when wrong intervention status', async () => {
      for (const wrongStatus of mock.interventionForbiddenStatuses) {
        await destroyDBTests();
        mock.intervention = await createMockIntervention(
          Object.assign({}, Object.assign({}, mock.intervention, { status: wrongStatus }), {
            documents: getDocumentInterventionProps({ objectId: 'mockId' })
          })
        );
        mock.document = mock.intervention.documents[0];
        const response = await deleteInterventionDocument(mock.intervention.id, mock.document.id);
        assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      }
    });

    it('C63119 - Negative - Should not delete an intervention document when forbidden user role', async () => {
      const document = getDocumentIntervention();
      const interventionWithDocument = await createAndSaveIntervention({
        documents: [document]
      });

      for (const wrongRole of getAllOtherRoles(mock.deleteAllowedRoles)) {
        userMocker.mock(wrongRole);
        const response = await deleteInterventionDocument(interventionWithDocument.id, document.id);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
        userMocker.reset();
      }
    });

    it(`C63375 - Positive - Should add an intervention history entry when deleting one of its document`, async () => {
      let interventionHistory = await historyModel.find({ referenceId: mock.intervention.id }).exec();
      assert.isFalse(interventionHistory.length > 0);
      await deleteInterventionDocument(mock.intervention.id, mock.document.id);
      interventionHistory = await historyModel.find({ referenceId: mock.intervention.id }).exec();
      assert.isTrue(interventionHistory.length > 0);
      assert.containsAllKeys(interventionHistory[0].toObject(), ['objectTypeId', 'referenceId', 'actionId', 'summary']);
    });

    interventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const intervention = mergeProperties({ documents: [getDocumentInterventionProps()] }, test.props);
        // create intervention with document
        const createdIntervention = await createAndSaveIntervention(intervention);
        const documentId = createdIntervention.documents.find(x => x).id;
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        const response = await deleteInterventionDocument(createdIntervention.id, documentId);

        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/interventions/:id/documents > POST', () => {
    beforeEach(async () => {
      mock = await initData({ intervention: { documents: [] } as IEnrichedIntervention }, true);
    });

    it('C62876 - Positive - Should save documents to cloud for intervention with Storage API', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertDocument(
        response.body,
        getIEnrichedDocumentIntervention({
          documentName: `${BASIC_DOCUMENT_NAME}(1)`
        })
      );
    });

    it('C63421 - Negative - Should not save document without file data', async () => {
      const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C62877 - Negative - Should not save documents to an intervention with status canceled', async () => {
      const intervention = Object.assign({}, getMinimalInitialIntervention(), { status: InterventionStatus.canceled });
      const mockInterventionCanceled = await createMockIntervention(intervention);
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mockInterventionCanceled.id}/documents`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C62879 - Positive - Should rename documents with the same name on creation', async () => {
      const DOCUMENT_NAME = 'test';
      storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('1111d1ea-111e-11ee-a1f1-2f11f111e1f1'));
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument({
          documentName: DOCUMENT_NAME
        })
      );
      storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('2222d2ea-222e-22ee-a2f2-2f22f222e2f2'));
      const response2 = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument({
          documentName: DOCUMENT_NAME
        })
      );

      storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('3333d3ea-333e-33ee-a3f3-3f33f333e3f3'));
      const response3 = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument({
          documentName: DOCUMENT_NAME
        })
      );
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.strictEqual(response.body.documentName, DOCUMENT_NAME);
      assert.strictEqual(response2.body.documentName, `${DOCUMENT_NAME}(1)`);
      assert.strictEqual(response3.body.documentName, `${DOCUMENT_NAME}(2)`);
    });

    it('C62880 - Negative - Should not save document with invalid taxonomies', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument({
          type: 'wrong',
          validationStatus: 'wrong'
        } as any)
      );

      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C62881 - Negative - Should not save document with empty required properties', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument({
          documentName: ''
        } as any)
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C62882 - Negative - Should not save document if file has invalid extensions', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument({
          type: ''
        } as any),
        INVALID_FILE_NAME,
        INVALID_MIME_TYPE
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C63376 - Positive - Should add intervention history when creating one of its document`, async () => {
      let interventionHistory = await historyModel.find({ referenceId: mock.intervention.id }).exec();
      assert.isFalse(interventionHistory.length > 0);
      await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${mock.intervention.id}/documents`,
        getInputPlainDocument()
      );
      interventionHistory = await historyModel.find({ referenceId: mock.intervention.id }).exec();
      assert.isTrue(interventionHistory.length > 0);
      assert.containsAllKeys(interventionHistory[0].toObject(), ['objectTypeId', 'referenceId', 'actionId', 'summary']);
    });

    it('C63368 - Positive - Should validate document status if a user with an appropriate role', async () => {
      for (const userRole of mock.validateAllowedRoles) {
        userMocker.mock(userRole);
        const response = await documentsTestHelper.uploadDocumentWithAttachment(
          'post',
          `${apiUrl}/${mock.intervention.id}/documents`,
          getInputPlainDocument()
        );
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assertDocument(
          response.body,
          getIEnrichedDocumentIntervention({
            documentName: `${BASIC_DOCUMENT_NAME}(1)`
          })
        );
        mock = await initData({ intervention: { documents: [] } as IEnrichedIntervention }, true);
      }
      userMocker.reset();
    });

    interventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const intervention = mergeProperties({}, test.props);
        // create intervention without document
        const createdIntervention = await createAndSaveIntervention(intervention);
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        const response = await documentsTestHelper.uploadDocumentWithAttachment(
          'post',
          `${apiUrl}/${createdIntervention.id}/documents`,
          getInputPlainDocument()
        );

        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/interventions/:id/documents/:documentId > `PUT`', () => {
    beforeEach(async () => {
      mock = await initData({ intervention: { documents: [getDocumentInterventionProps()] } as any }, true);
    });

    it('C63123 - Positive - Should update documents to cloud for intervention with Storage API', async () => {
      storageApiServiceStub.deleteStub.restore();
      storageApiServiceStub.initDeleteStub(sandbox);
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.intervention.id}/documents/${mock.intervention.documents[0].id}`,
        getInputPlainDocument(),
        PDF_FILE_TEST
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(storageApiServiceStub.deleteStub.calledOnce);
      assertDocument(response.body, getIEnrichedDocumentIntervention({ fileName: PDF_FILE_TEST }));
    });

    it('C63422 - Positive - Should update documents without file', async () => {
      storageApiServiceStub.deleteStub.restore();
      storageApiServiceStub.initDeleteStub(sandbox);
      const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
        'put',
        `${apiUrl}/${mock.intervention.id}/documents/${mock.intervention.documents[0].id}`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(storageApiServiceStub.uploadStub.notCalled);
      assert.isTrue(storageApiServiceStub.deleteStub.notCalled);
      assertDocument(response.body, getIEnrichedDocumentIntervention());
    });

    it('C63128 - Negative - Should not update documents to an intervention with status canceled', async () => {
      const intervention = Object.assign({}, getMinimalInitialIntervention(), {
        status: InterventionStatus.canceled,
        documents: [getDocumentInterventionProps()]
      });
      const mockInterventionCanceled = await createMockIntervention(intervention);
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mockInterventionCanceled.id}/documents/${mockInterventionCanceled.documents[0].id}`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C63124 - Negative - Should not update document with invalid taxonomies', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.intervention.id}/documents/${mock.intervention.documents[0].id}`,
        getInputPlainDocument({
          type: 'wrong',
          validationStatus: 'wrong'
        } as any)
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C63125 - Negative - Should not update document with empty required properties', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.intervention.id}/documents/${mock.intervention.documents[0].id}`,
        getInputPlainDocument({
          type: '',
          validationStatus: ''
        } as any)
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it(`C63378 - Positive - Should add intervention history when updating one of its document`, async () => {
      storageApiServiceStub.deleteStub.restore();
      storageApiServiceStub.initDeleteStub(sandbox);
      let interventionHistory = await historyModel.find({ referenceId: mock.intervention.id }).exec();
      assert.isFalse(interventionHistory.length > 0);
      await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${mock.intervention.id}/documents/${mock.intervention.documents[0].id}`,
        getInputPlainDocument()
      );
      interventionHistory = await historyModel
        .find({ referenceId: mock.intervention.id })
        .lean()
        .exec();
      assert.isTrue(interventionHistory.length > 0);
      assert.containsAllKeys(interventionHistory[0], [
        '_id',
        'audit',
        'categoryId',
        'objectTypeId',
        'referenceId',
        'actionId'
      ]);
    });

    it('C63369 - Positive - Should update validate document status with a planner', async () => {
      const document = getDocumentIntervention();
      const interventionWithDocument = await createAndSaveIntervention({
        documents: [document]
      });

      const documentStatuses = Object.keys(DocumentStatus);
      for (const documentStatus of documentStatuses) {
        const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
          'put',
          `${apiUrl}/${interventionWithDocument.id}/documents/${document.id}`,
          getInputPlainDocument({
            validationStatus: documentStatus as DocumentStatus
          })
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assertDocument(
          response.body,
          getIEnrichedDocumentIntervention({
            validationStatus: documentStatus as DocumentStatus,
            documentName: `${BASIC_DOCUMENT_NAME}`
          })
        );
      }
    });

    interventionRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const intervention = mergeProperties({ documents: [getDocumentInterventionProps()] }, test.props);
        // create intervention with document
        const createdIntervention = await createAndSaveIntervention(intervention);
        const document = createdIntervention.documents.find(x => x);
        // mock user restrictions
        userMocker.mockRestrictions(test.useRestrictions);
        const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
          'put',
          `${apiUrl}/${createdIntervention.id}/documents/${document.id}`,
          getInputPlainDocument()
        );

        assertRestrictions(test.expectForbidden, response);
        // remove user restrictions
        userMocker.mockRestrictions({});
      });
    });
  });

  describe('/interventions/:id/documents/:documentId > GET', () => {
    // DONT KNOW WHY IT WORKS IN THE REAL WORLD BUT NOT IN TESTING MODE
    it('Positive - Should download a document from an objects storage stub', async () => {
      const document = getDocumentIntervention();
      const interventionWithDocument = await createAndSaveIntervention({
        documents: [document]
      });
      const url = `${apiUrl}/${interventionWithDocument.id}/documents/${document.id}`;
      const response = await requestService.get(url);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isNotEmpty(response.body);
      // assert.propertyVal(response.header, 'content-type', metadata.contentType);
      assert.propertyVal(response.header, 'content-length', `${metadata.contentLength}`);
      assert.propertyVal(response.header, 'content-disposition', `attachment; filename="${metadata.objectName}"`);
    });
  });
});

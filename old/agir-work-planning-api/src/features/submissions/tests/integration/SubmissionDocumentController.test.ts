import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IEnrichedDocument, ProjectStatus, SubmissionStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../../../config/constants';
import {
  assertDocument,
  BASIC_DOCUMENT_NAME,
  documentsTestHelper,
  getDocument,
  getIEnrichedDocument,
  getInputPlainDocument,
  INVALID_FILE_NAME,
  INVALID_MIME_TYPE,
  PDF_FILE_TEST
} from '../../../../../src/features/documents/tests/documentsTestHelper';
import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../../../../tests/data/userMocks';
import { integrationAfter } from '../../../../../tests/integration/_init.test';
import { requestService } from '../../../../../tests/utils/requestService';
import { metadataPdf, storageApiServiceStub } from '../../../../../tests/utils/stub/storageApiService.stub';
import { destroyDBTests, mergeProperties } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { assertRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { appUtils } from '../../../../utils/utils';
import { createAndSaveProject, projectRestrictionsTestData } from '../../../projects/tests/projectTestHelper';
import { Submission } from '../../models/submission';
import { submissionRepository } from '../../mongo/submissionRepository';
import { createAndSaveSubmission, DRM_NUMBER, SUBMISSION_NUMBER } from '../submissionTestHelper';

const sandbox = sinon.createSandbox();
const apiUrl = appUtils.createPublicFullPath(`${constants.locationPaths.SUBMISSIONS}`, EndpointTypes.API);

// tslint:disable:max-func-body-length
describe('Submission controller - Documents', () => {
  const allowedUSers = normalizeUsernames([userMocks.admin, userMocks.planner, userMocks.executor]);
  const submissionForbiddenStatuses = [SubmissionStatus.INVALID];
  let submission: Submission;
  let document: IEnrichedDocument;
  after(async () => {
    await integrationAfter();
  });

  beforeEach(async () => {
    storageApiServiceStub.init(sandbox);
    submission = await createAndSaveSubmission({ documents: [getDocument()] });
    document = submission.documents[0];
  });

  afterEach(async () => {
    sandbox.restore();
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/submissions/:submissionNumber/documents/:documentId > DELETE', () => {
    function deleteSubmissionDocument(submissionNumber: string, documentId: string): Promise<request.Response> {
      return requestService.delete(`${apiUrl}/${submissionNumber}/documents/${documentId}`);
    }

    describe(`UserRestrictions`, () => {
      afterEach(async () => {
        await destroyDBTests();
      });
      projectRestrictionsTestData.forEach(test => {
        it(test.scenario, async () => {
          // create projects
          const createdProjects = await Promise.all(
            test.multipleProps.map(el =>
              createAndSaveProject({
                ...mergeProperties({}, el),
                drmNumber: DRM_NUMBER,
                submissionNumber: SUBMISSION_NUMBER,
                status: ProjectStatus.finalOrdered
              })
            )
          );
          const createdSubmission = await createAndSaveSubmission({
            documents: [getDocument()],
            projectIds: createdProjects.map(el => el.id)
          });
          document = createdSubmission.documents.find(x => x);
          // mock user restrictions
          userMocker.mockRestrictions(test.useRestrictions);
          // upload document
          const response = await deleteSubmissionDocument(createdSubmission.id, document.id);
          // assert restrictions
          assertRestrictions(test.expectForbidden, response);
        });
      });
    });

    it('Positive - Should delete a submission document from the stubbed object storage', async () => {
      const response = await deleteSubmissionDocument(submission.submissionNumber, document.id);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const persistedSubmission = await submissionRepository.findById(submission.submissionNumber);
      assert.isEmpty(persistedSubmission.documents);
    });

    for (const status of submissionForbiddenStatuses) {
      it(`Negative - Should not delete submission document when status is: ${status}`, async () => {
        const submissionWithWrongStatus = await createAndSaveSubmission({ documents: [getDocument()], status });
        const response = await deleteSubmissionDocument(
          submissionWithWrongStatus.id,
          submissionWithWrongStatus.documents[0].id
        );
        assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });
    }

    for (const wrongRole of getAllOtherRoles(allowedUSers)) {
      it(`Should not delete submission document when role is: ${wrongRole}`, async () => {
        userMocker.mock(wrongRole);
        const response = await deleteSubmissionDocument(submission.submissionNumber, document.id);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
        userMocker.reset();
      });
    }
  });

  describe('/submissions/:submissionNumber/documents > POST', () => {
    describe(`UserRestrictions`, () => {
      afterEach(async () => {
        await destroyDBTests();
      });
      projectRestrictionsTestData.forEach(test => {
        it(test.scenario, async () => {
          // create projects
          const createdProjects = await Promise.all(
            test.multipleProps.map(el =>
              createAndSaveProject({
                ...mergeProperties({}, el),
                drmNumber: DRM_NUMBER,
                submissionNumber: SUBMISSION_NUMBER,
                status: ProjectStatus.finalOrdered
              })
            )
          );
          const createdSubmission = await createAndSaveSubmission({ projectIds: createdProjects.map(el => el.id) });
          // mock user restrictions
          userMocker.mockRestrictions(test.useRestrictions);
          // upload document
          const response = await documentsTestHelper.uploadDocumentWithAttachment(
            'post',
            `${apiUrl}/${createdSubmission.submissionNumber}/documents`,
            getInputPlainDocument()
          );
          // assert restrictions
          assertRestrictions(test.expectForbidden, response);
        });
      });
    });
    it('Positive - Should save documents to cloud for submission with Storage API', async () => {
      storageApiServiceStub.uploadStub.restore();
      storageApiServiceStub.initUploadStub(sandbox);
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${submission.submissionNumber}/documents`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isTrue(storageApiServiceStub.uploadStub.calledOnce);
      assertDocument(response.body, getIEnrichedDocument({ documentName: `${BASIC_DOCUMENT_NAME}(1)` }));
    });

    it('Negative - Should not save document without file', async () => {
      const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
        'post',
        `${apiUrl}/${submission.id}/documents`,
        getInputPlainDocument()
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    for (const status of submissionForbiddenStatuses) {
      it(`Negative - Should not save documents with status: ${status}`, async () => {
        const submissionWithWrongStatus = await createAndSaveSubmission({ documents: [getDocument()], status });
        const response = await documentsTestHelper.uploadDocumentWithAttachment(
          'post',
          `${apiUrl}/${submissionWithWrongStatus.submissionNumber}/documents`,
          getInputPlainDocument()
        );
        assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });
    }

    it('Negative - Should not save document with empty required properties', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${submission.submissionNumber}/documents`,
        getInputPlainDocument({
          documentName: ''
        } as any)
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Negative - Should not save document if file has invalid extensions', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'post',
        `${apiUrl}/${submission.id}/documents`,
        getInputPlainDocument({
          type: ''
        } as any),
        INVALID_FILE_NAME,
        INVALID_MIME_TYPE
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/submissions/:submissionNumber/documents/:documentId > `PUT`', () => {
    describe(`UserRestrictions`, () => {
      afterEach(async () => {
        await destroyDBTests();
      });
      projectRestrictionsTestData.forEach(test => {
        it(test.scenario, async () => {
          // create projects
          const createdProjects = await Promise.all(
            test.multipleProps.map(el =>
              createAndSaveProject({
                ...mergeProperties({}, el),
                drmNumber: DRM_NUMBER,
                submissionNumber: SUBMISSION_NUMBER,
                status: ProjectStatus.finalOrdered
              })
            )
          );
          const createdSubmission = await createAndSaveSubmission({
            documents: [getDocument()],
            projectIds: createdProjects.map(el => el.id)
          });
          document = createdSubmission.documents.find(x => x);
          // mock user restrictions
          userMocker.mockRestrictions(test.useRestrictions);
          // upload document
          const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
            'put',
            `${apiUrl}/${createdSubmission.id}/documents/${document.id}`,
            getInputPlainDocument()
          );
          // assert restrictions
          assertRestrictions(test.expectForbidden, response);
        });
      });
    });
    it('Positive - Should update documents to cloud for submission with Storage API', async () => {
      storageApiServiceStub.uploadStub.restore();
      storageApiServiceStub.initUploadStub(sandbox);
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${submission.id}/documents/${document.id}`,
        getInputPlainDocument(),
        PDF_FILE_TEST
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(storageApiServiceStub.uploadStub.calledOnce);
      assertDocument(response.body, getIEnrichedDocument({ fileName: PDF_FILE_TEST }));
    });

    it('Positive - Should update documents without file', async () => {
      storageApiServiceStub.deleteStub.restore();
      storageApiServiceStub.initDeleteStub(sandbox);
      const response = await documentsTestHelper.uploadDocumentWithoutAttachment(
        'put',
        `${apiUrl}/${submission.id}/documents/${document.id}`,
        getInputPlainDocument({ documentName: 'test' })
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(storageApiServiceStub.uploadStub.notCalled);
      assert.isTrue(storageApiServiceStub.deleteStub.notCalled);
      assertDocument(response.body, getIEnrichedDocument({ documentName: 'test' }));
    });

    for (const status of submissionForbiddenStatuses) {
      it(`Negative - Should not update documents when submission status is : ${status}`, async () => {
        const submissionWithWrongStatus = await createAndSaveSubmission({ documents: [getDocument()], status });
        const response = await documentsTestHelper.uploadDocumentWithAttachment(
          'put',
          `${apiUrl}/${submissionWithWrongStatus.submissionNumber}/documents/${submissionWithWrongStatus.documents[0].id}`,
          getInputPlainDocument()
        );
        assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });
    }

    it('Negative - Should not update document with empty required properties', async () => {
      const response = await documentsTestHelper.uploadDocumentWithAttachment(
        'put',
        `${apiUrl}/${submission.id}/documents/${document.id}`,
        getInputPlainDocument({
          documentName: ''
        })
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/submissions/:submissionNumber/documents/:documentId > GET', () => {
    beforeEach(() => {
      userMocker.mock(userMocks.executor);
    });
    // DONT KNOW WHY IT WORKS IN THE REAL WORLD BUT NOT IN TESTING MODE
    it('Positive - Should download a document from an objects storage stub', async () => {
      const url = `${apiUrl}/${submission.id}/documents/${document.id}`;
      const response = await requestService.get(url);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isNotEmpty(response.body);
      assert.propertyVal(response.header, 'content-length', `${metadataPdf.contentLength}`);
      assert.propertyVal(response.header, 'content-disposition', `attachment; filename="${metadataPdf.objectName}"`);
    });

    it('Negative - Should return a forbidden error if user does not have permissions to read submission documents', async () => {
      userMocker.mock(userMocks.noAccess);
      const url = `${apiUrl}/${submission.id}/documents/${document.id}`;
      const response = await requestService.get(url);
      assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
    });
  });
});

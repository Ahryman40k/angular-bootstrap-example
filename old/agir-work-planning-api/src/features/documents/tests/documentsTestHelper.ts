import { DocumentStatus, DocumentType, IEnrichedDocument, IPlainDocument } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as request from 'supertest';

import { constants } from '../../../../config/constants';
import { HttpVerb, requestService } from '../../../../tests/utils/requestService';
import { mergeProperties } from '../../../../tests/utils/testHelper';
import { auditService } from '../../../services/auditService';
import { getId } from '../../../shared/domain/entity';
import { appUtils } from '../../../utils/utils';
import { getAudit } from '../../audit/test/auditTestHelper';
import { Document, IDocumentProps } from '../models/document';
import { DocumentIntervention, IDocumentInterventionProps } from '../models/documentIntervention';
import { IPlainDocumentProps } from '../models/plainDocument';
import { IPlainDocumentInterventionProps } from '../models/plainDocumentIntervention';

export const STORAGE_OBJECT_ID = '8137d3ea-988e-44ee-a7f4-0f55f772e8f6';

const CONTENT_TYPE = 'application/pdf';
export const PDF_FILE_TEST = 'test-pdf.pdf';
export const BASIC_DOCUMENT_NAME = 'basicDocumentName';
const PATH_TO_FILE = `./datas/`;
export const INVALID_FILE_NAME = 'testInvalidMimeType.mimetype';
export const INVALID_MIME_TYPE = 'invalid/mimetype';

const commonProps: any = {
  notes: 'notes',
  documentName: BASIC_DOCUMENT_NAME,
  validationStatus: DocumentStatus.validated,
  type: DocumentType.other
};

const inputPlainDocument: IPlainDocument = {
  ...commonProps
};

const plainDocumentProps: IPlainDocumentProps = {
  ...inputPlainDocument,
  notes: 'notes',
  documentName: BASIC_DOCUMENT_NAME,
  validationStatus: DocumentStatus.validated,
  type: DocumentType.other,
  fileName: PDF_FILE_TEST
};

const documentProps: IDocumentProps = {
  ...plainDocumentProps,
  objectId: STORAGE_OBJECT_ID,
  audit: getAudit()
};

export function getInputPlainDocument(props?: Partial<IPlainDocument>): IPlainDocument {
  return mergeProperties(inputPlainDocument, {
    ...props
  });
}

export function getPlainDocumentProps(props?: Partial<IPlainDocumentProps>): IPlainDocumentProps {
  return mergeProperties(plainDocumentProps, {
    ...props
  });
}

export function getDocumentProps(props?: Partial<IDocumentProps>): IDocumentProps {
  return mergeProperties(documentProps, {
    ...props
  });
}

export function getDocument(props?: Partial<IDocumentProps>, id?: string): Document {
  return Document.create(getDocumentProps(props), id).getValue();
}

export function getIEnrichedDocument(props?: Partial<IEnrichedDocument>, id?: string) {
  return {
    id: id ? id : getId(),
    ...documentProps,
    audit: auditService.buildAudit(props?.audit),
    ...props
  };
}

const plainDocumentInterventionProps: IPlainDocumentInterventionProps = {
  ...plainDocumentProps,
  isProjectVisible: false
};
const documentInterventionProps: IDocumentInterventionProps = {
  ...documentProps,
  ...plainDocumentInterventionProps
};

export function getPlainDocumentInterventionProps(
  props?: Partial<IPlainDocumentInterventionProps>
): IPlainDocumentInterventionProps {
  return mergeProperties(plainDocumentInterventionProps, {
    ...props
  });
}

export function getDocumentInterventionProps(props?: Partial<IDocumentInterventionProps>): IDocumentInterventionProps {
  return mergeProperties(documentInterventionProps, {
    ...props
  });
}
export function getDocumentIntervention(
  props?: Partial<IDocumentInterventionProps>,
  id?: string
): DocumentIntervention {
  return DocumentIntervention.create(getDocumentInterventionProps(props), id).getValue();
}

export function getIEnrichedDocumentIntervention(props?: Partial<IEnrichedDocument>, id?: string) {
  return getIEnrichedDocument({
    isProjectVisible: plainDocumentInterventionProps.isProjectVisible,
    ...props
  });
}

// asserts
export function assertDocument(response: IEnrichedDocument, document: IEnrichedDocument) {
  assert.strictEqual(response.fileName, document.fileName);
  assert.strictEqual(response.type, document.type);
  assert.strictEqual(response.validationStatus, document.validationStatus);
  assert.strictEqual(response.documentName, document.documentName);
  assert.exists(response.audit);
}

class DocumentsTestHelper {
  public uploadDocumentWithAttachment(
    verb: HttpVerb,
    url: string,
    document: IPlainDocument,
    dataFileName: string = PDF_FILE_TEST,
    contentType: string = CONTENT_TYPE
  ): request.Request {
    return this.uploadDocument(verb, url, document).attach(
      constants.request.FILE,
      appUtils.readFile(__dirname, `${PATH_TO_FILE}${dataFileName}`),
      {
        filename: dataFileName,
        contentType
      }
    );
  }

  public uploadDocumentWithoutAttachment(verb: HttpVerb, url: string, document: IPlainDocument): request.Request {
    return this.uploadDocument(verb, url, document);
  }

  public uploadDocument(verb: HttpVerb, url: string, document: IPlainDocument): request.Request {
    const uploadRequest = requestService.upload(verb, url);
    const notInUploadFormFields = [constants.request.FILE, 'audit'];
    for (const objectKey of Object.keys(document).filter(key => !notInUploadFormFields.includes(key))) {
      uploadRequest.field(objectKey, document[objectKey]);
    }
    return uploadRequest;
  }
}

export const documentsTestHelper = new DocumentsTestHelper();

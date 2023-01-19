import { DocumentStatus, DocumentType, IEnrichedDocument } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { isEntity } from '../../../../shared/domain/entity';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IUploadFileResult } from '../../../../shared/storage/iStorageService';
import { fireAndForget } from '../../../../utils/fireAndForget';
import { createLogger } from '../../../../utils/logger';
import { Audit, isAudit } from '../../../audit/audit';
import { documentMapperDTO } from '../../mappers/documentMapperDTO';
import { Document, IDocumentProps, isDocument } from '../../models/document';
import { DOCUMENTS_KEY, UpsertDocumentUseCase } from '../upsertDocument/upsertDocumentUseCase';
import { IUpdateDocumentCommandProps, UpdateDocumentCommand } from './updateDocumentCommand';

const logger = createLogger('UpdateDocumentUseCase');

export abstract class UpdateDocumentUseCase<
  E extends any // E extends DocumentableEntity, => when projects/interventions is refactorised
> extends UpsertDocumentUseCase<E> {
  protected historyOptions = {
    categoryId: constants.historyCategoryId.DOCUMENT,
    documents: constants.systemMessages.DOCUMENT_UPDATED,
    operation: constants.operation.UPDATE
  };

  protected createCommand(
    req: IUpdateDocumentCommandProps
  ): Result<UpdateDocumentCommand<IUpdateDocumentCommandProps>> {
    return UpdateDocumentCommand.create(req, GuardType.VALID_UUID);
  }

  protected toDocumentProps(
    updateDocumentCmd: UpdateDocumentCommand<IUpdateDocumentCommandProps>,
    uploadedFile: IUploadFileResult,
    existingDocument: Document | IEnrichedDocument
  ): IDocumentProps {
    const currentAudit: Audit = !isAudit(existingDocument.audit)
      ? Audit.generateAuditFromIAudit(existingDocument.audit)
      : existingDocument.audit;
    return {
      objectId: uploadedFile?.objectId || (existingDocument as any).objectId,
      fileName: updateDocumentCmd.fileName || existingDocument.fileName,
      documentName: updateDocumentCmd.documentName || existingDocument.documentName,
      notes: updateDocumentCmd.notes || existingDocument.notes,
      type: updateDocumentCmd.type || (existingDocument.type as DocumentType),
      validationStatus: updateDocumentCmd.validationStatus || (existingDocument.validationStatus as DocumentStatus),
      audit: Audit.fromUpdateContext(currentAudit)
    };
  }

  protected createDocument(
    updateDocumentCmd: UpdateDocumentCommand<IUpdateDocumentCommandProps>,
    uploadedFile: IUploadFileResult,
    existingDocument: Document | IEnrichedDocument
  ): Result<Document> {
    return Document.create(
      this.toDocumentProps(updateDocumentCmd, uploadedFile, existingDocument),
      updateDocumentCmd.documentId
    );
  }

  protected async doJob(
    updateDocumentCmd: UpdateDocumentCommand<IUpdateDocumentCommandProps>,
    uploadedFile: IUploadFileResult
  ): Promise<Result<Document>> {
    const indexOfDocumentToUpdate = this.entity[DOCUMENTS_KEY].findIndex(
      (document: Document | IEnrichedDocument) => document.id === updateDocumentCmd.documentId
    );
    if (indexOfDocumentToUpdate === -1) {
      return Result.fail(new NotFoundError(`Document ${updateDocumentCmd.documentId} was not found`));
    }
    const existingDocument: Document | IEnrichedDocument = this.entity[DOCUMENTS_KEY][indexOfDocumentToUpdate];
    // tslint:disable:no-string-literal
    if (uploadedFile?.objectId && existingDocument['objectId'] !== uploadedFile.objectId) {
      fireAndForget(async () => {
        try {
          await this.storageService.delete(existingDocument['objectId']);
        } catch (err) {
          logger.error(`Error while deleting ${existingDocument['objectId']} from storageApi`);
        }
      });
    }

    const documentResult = this.createDocument(updateDocumentCmd, uploadedFile, existingDocument);
    if (documentResult.isFailure) {
      return documentResult;
    }
    let updatedDocument: Document | IEnrichedDocument = documentResult.getValue();
    // in case of intervention project that are not entities
    if (!isEntity(this.entity) && isDocument(updatedDocument)) {
      updatedDocument = await documentMapperDTO.getFromModel(updatedDocument, { hasObjectId: true });
    }
    // update document in array
    this.entity[DOCUMENTS_KEY].splice(indexOfDocumentToUpdate, 1, updatedDocument);
    // Add object id to history options
    this.historyOptions.documents = `${this.historyOptions.documents} objectId: ${(updatedDocument as any).objectId}`;

    return Result.ok(documentResult.getValue());
  }
}

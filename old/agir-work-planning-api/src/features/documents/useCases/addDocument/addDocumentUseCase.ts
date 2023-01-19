import { IEnrichedDocument } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { isEntity } from '../../../../shared/domain/entity';
import { GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IUploadFileResult } from '../../../../shared/storage/iStorageService';
import { Audit } from '../../../audit/audit';
import { documentMapperDTO } from '../../mappers/documentMapperDTO';
import { Document, IDocumentProps, isDocument } from '../../models/document';
import { DOCUMENTS_KEY, UpsertDocumentUseCase } from '../upsertDocument/upsertDocumentUseCase';
import { AddDocumentCommand, IAddDocumentCommandProps } from './addDocumentCommand';

export abstract class AddDocumentUseCase<
  E extends any // E extends CommentableEntity, => when projects/interventions is refactorised
> extends UpsertDocumentUseCase<E> {
  protected historyOptions = {
    categoryId: constants.historyCategoryId.DOCUMENT,
    comments: constants.systemMessages.DOCUMENT_ADDED,
    operation: constants.operation.CREATE
  };

  protected createCommand(req: IAddDocumentCommandProps): Result<AddDocumentCommand<IAddDocumentCommandProps>> {
    return AddDocumentCommand.create(req, GuardType.VALID_UUID);
  }

  protected toDocumentProps(
    addDocumentCmd: AddDocumentCommand<IAddDocumentCommandProps>,
    uploadedFile: IUploadFileResult
  ): IDocumentProps {
    return {
      objectId: uploadedFile.objectId,
      fileName: addDocumentCmd.fileName,
      documentName: addDocumentCmd.documentName,
      notes: addDocumentCmd.notes,
      type: addDocumentCmd.type,
      validationStatus: addDocumentCmd.validationStatus,
      audit: Audit.fromCreateContext()
    };
  }

  protected createDocument(
    addDocumentCmd: AddDocumentCommand<IAddDocumentCommandProps>,
    uploadedFile: IUploadFileResult
  ): Result<Document> {
    return Document.create(this.toDocumentProps(addDocumentCmd, uploadedFile));
  }

  protected async doJob(
    addDocumentCmd: AddDocumentCommand<IAddDocumentCommandProps>,
    uploadedFile: IUploadFileResult
  ): Promise<Result<Document>> {
    const documentResult = this.createDocument(addDocumentCmd, uploadedFile);
    if (documentResult.isFailure) {
      return documentResult;
    }
    let newDocument: Document | IEnrichedDocument = documentResult.getValue();
    // in case of intervention project that are not entities
    if (!isEntity(this.entity) && isDocument(newDocument)) {
      newDocument = await documentMapperDTO.getFromModel(newDocument, { hasObjectId: true });
    }
    this.entity[DOCUMENTS_KEY].push(newDocument);
    // Add object id to history options
    this.historyOptions.comments = `${this.historyOptions.comments} objectId: ${uploadedFile.objectId}`;
    return Result.ok(documentResult.getValue());
  }
}

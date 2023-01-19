import { IEnrichedDocument } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, isNil, omit } from 'lodash';

import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { FindOptions } from '../../../../shared/findOptions/findOptions';
import { IGuardResult } from '../../../../shared/logic/guard';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IStorageService, IUploadFileResult } from '../../../../shared/storage/iStorageService';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { IHistoryOptions } from '../../../history/mongo/historyRepository';
import { isUpdateDocumentInterventionCmd } from '../../../interventions/useCases/documents/updateDocument/updateDocumentInterventionCommand';
import { documentMapperDTO } from '../../mappers/documentMapperDTO';
import { Document } from '../../models/document';
import { IPlainDocumentProps } from '../../models/plainDocument';
import { DocumentValidator } from '../../validators/documentValidator';
import { isUpdateDocumentCmd } from '../updateDocument/updateDocumentCommand';
import { IUpsertDocumentCommandProps, UpsertDocumentCommand } from './upsertDocumentCommand';

export const DOCUMENTS_KEY = 'documents';

export abstract class UpsertDocumentUseCase<
  E extends any // E extends CommentableEntity, => when projects/interventions is refactorised
> extends UseCase<IPlainDocumentProps, Response<IEnrichedDocument>> {
  protected abstract entityRepository: IBaseRepository<E, FindOptions<any>>;
  protected abstract historyOptions: IHistoryOptions;
  protected entity: E;
  protected documents: Document[] = [];
  protected readonly storageService: IStorageService = storageApiService;

  protected abstract doJob(
    upsertCommand: UpsertDocumentCommand<IUpsertDocumentCommandProps>,
    uploadedFile: IUploadFileResult
  ): Promise<Result<Document>>;

  protected abstract createCommand(
    req: IUpsertDocumentCommandProps
  ): Result<UpsertDocumentCommand<IUpsertDocumentCommandProps>>;

  protected abstract createDocument(
    addDocumentCmd: UpsertDocumentCommand<IUpsertDocumentCommandProps>,
    uploadedFile: IUploadFileResult,
    existingDocument?: Document
  ): Result<Document>;

  protected async validateTaxonomies(): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async validateBusinessRules(entity: E): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async validateRestrictions(entity: E): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  public async execute(req: IUpsertDocumentCommandProps): Promise<any> {
    const [cmdResult, openApiResult, taxonomyResult] = await Promise.all([
      this.createCommand(req),
      DocumentValidator.validateAgainstOpenApi(
        omit(req, ['id', 'file', 'documentId', 'isProjectVisible']) as IPlainDocumentProps
      ),
      DocumentValidator.validateTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([cmdResult, openApiResult, taxonomyResult]);

    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(inputValidationResult)));
    }
    const upsertDocumentCmd = cmdResult.getValue();

    this.entity = await this.entityRepository.findById(upsertDocumentCmd.id);
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${upsertDocumentCmd.id} was not found`));
    }

    const restrictionsResults = await this.validateRestrictions(this.entity);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }

    const businessRulesResults: Result<IGuardResult> = await this.validateBusinessRules(this.entity);
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    let uploadResult: Result<IUploadFileResult> = Result.ok();
    if (!isNil(upsertDocumentCmd.file)) {
      uploadResult = await this.storageService.create(upsertDocumentCmd.file);
      if (uploadResult.isFailure) {
        return left(new UnexpectedError(uploadResult.errorValue()));
      }
    }
    if (isEmpty(this.entity[DOCUMENTS_KEY])) {
      this.entity[DOCUMENTS_KEY] = [];
    }
    this.documents = this.entity[DOCUMENTS_KEY];
    this.ensureUniqueDocumentName(upsertDocumentCmd);

    const result: Result<Document> = await this.doJob(upsertDocumentCmd, uploadResult.getValue());
    if (result.isFailure) {
      if (result.errorValue().constructor === NotFoundError) {
        return left(result.errorValue());
      }
      return left(new UnexpectedError(result.errorValue()));
    }

    // save updated entity
    const savedEntityResult: Result<E> = await this.entityRepository.save(this.entity, {
      history: this.historyOptions
    });
    if (savedEntityResult.isFailure) {
      return left(new UnexpectedError(savedEntityResult.errorValue()));
    }
    return right(Result.ok<IEnrichedDocument>(await documentMapperDTO.getFromModel(result.getValue())));
  }

  // Duplicated names will be set as documentName(n) => n being a number
  private ensureUniqueDocumentName(upsertDocumentCmd: UpsertDocumentCommand<IUpsertDocumentCommandProps>): void {
    if (isEmpty(this.documents)) {
      return;
    }
    // on update with only one document and document updated is the one existing, no need to ensureUniqueDocumentName
    if (
      (isUpdateDocumentCmd(upsertDocumentCmd) || isUpdateDocumentInterventionCmd(upsertDocumentCmd)) &&
      this.documents.length === 1 &&
      !isNil(this.documents.find(doc => doc.id === upsertDocumentCmd.documentId))
    ) {
      return;
    }

    const duplicatedNames = this.documents
      .filter(
        existingDocument =>
          this.getCleanedDuplicateName(existingDocument.documentName) ===
          this.getCleanedDuplicateName(upsertDocumentCmd.documentName)
      )
      .map(filteredDocument => filteredDocument.documentName);
    if (!isEmpty(duplicatedNames)) {
      const maxCurrentDuplicate = this.getCurrentMaxDuplicateNumber(duplicatedNames);
      // Set the new documentName with its duplicate iteration
      upsertDocumentCmd.setDocumentName(
        `${this.getCleanedDuplicateName(upsertDocumentCmd.documentName)}(${maxCurrentDuplicate})`
      );
    }
  }

  // Remove (n) from already existing duplicates
  private getCleanedDuplicateName(name: string): string {
    const endIndex = name.lastIndexOf('(');
    if (endIndex === -1) {
      return name;
    }
    return name.toLowerCase().slice(0, endIndex);
  }

  private getCurrentMaxDuplicateNumber(duplicateNames: string[]): number {
    return duplicateNames
      .map(match => {
        const matchName = match.match(/\((\d+)\)$/);
        if (matchName) {
          // match retturn the matched value on index 1
          return +matchName[1] + 1;
        }
        return 1;
      })
      .sort((a, b) => a - b)
      .pop();
  }
}

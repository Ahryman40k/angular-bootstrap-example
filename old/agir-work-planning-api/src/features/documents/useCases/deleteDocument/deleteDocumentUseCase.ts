import { IEnrichedDocument } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants } from '../../../../../config/constants';
import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { DeleteByIdUseCase } from '../../../../shared/domain/useCases/deleteUseCase/deleteByIdUseCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { FindOptions } from '../../../../shared/findOptions/findOptions';
import { GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IStorageService } from '../../../../shared/storage/iStorageService';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { fireAndForget } from '../../../../utils/fireAndForget';
import { createLogger } from '../../../../utils/logger';
import { Document } from '../../models/document';
import { DOCUMENTS_KEY } from '../upsertDocument/upsertDocumentUseCase';
import { DeleteDocumentCommand, IDeleteDocumentCommandProps } from './deleteDocumentCommand';

const logger = createLogger('DeleteDocumentUseCase');

export abstract class DeleteDocumentUseCase<
  E extends any // E extends DocumentableEntity, => when projects/interventions is refactorised
> extends DeleteByIdUseCase<any> {
  protected abstract readonly entityRepository: IBaseRepository<E, FindOptions<any>>;
  protected entity: E;
  private readonly storageService: IStorageService = storageApiService;

  protected createCommand(req: IDeleteDocumentCommandProps): Result<DeleteDocumentCommand> {
    return DeleteDocumentCommand.create(req, GuardType.VALID_UUID);
  }

  protected async validateBusinessRules(entity: E): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async validateRestrictions(entity: E): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  public async execute(req: IDeleteDocumentCommandProps): Promise<any> {
    const cmdResult = this.createCommand(req);
    if (cmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(cmdResult)));
    }
    const deleteCmd: DeleteDocumentCommand = cmdResult.getValue();

    this.entity = await this.entityRepository.findById(deleteCmd.id);
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${deleteCmd.id} was not found`));
    }
    // tslint:disable:no-string-literal
    const indexOfDocumentToDelete = this.entity[DOCUMENTS_KEY].findIndex(
      (document: Document | IEnrichedDocument) => document.id === deleteCmd.documentId
    );
    if (indexOfDocumentToDelete === -1) {
      return left(new NotFoundError(`Document ${deleteCmd.documentId} was not found`));
    }
    const documentToDelete: Document | IEnrichedDocument = this.entity[DOCUMENTS_KEY][indexOfDocumentToDelete];

    const restrictionsResults = await this.validateRestrictions(this.entity);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }

    const businessRulesResults: Result<IGuardResult> = await this.validateBusinessRules(this.entity);
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    // remove Document from array
    this.entity[DOCUMENTS_KEY].splice(indexOfDocumentToDelete, 1);

    // save updated entity
    const savedEntityResult: Result<E> = await this.entityRepository.save(this.entity, {
      history: {
        categoryId: constants.historyCategoryId.DOCUMENT,
        comments: `${constants.systemMessages.DOCUMENT_DELETED}  objectId: ${(documentToDelete as any).objectId}`,
        operation: constants.operation.DELETE
      }
    });
    if (savedEntityResult.isFailure) {
      return left(new UnexpectedError(savedEntityResult.errorValue()));
    }
    // launch request to delete from storage
    fireAndForget(async () => {
      try {
        await this.storageService.delete((documentToDelete as any).objectId);
      } catch (err) {
        logger.error(`Error while deleting ${(documentToDelete as any).objectId} from storageApi`);
      }
    });
    return right(Result.ok<void>());
  }
}

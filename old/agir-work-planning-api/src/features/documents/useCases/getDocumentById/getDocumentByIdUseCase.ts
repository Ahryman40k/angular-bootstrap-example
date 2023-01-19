import { IEnrichedDocument } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { ByIdUseCase } from '../../../../shared/domain/useCases/byIdUseCase';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { FindOptions } from '../../../../shared/findOptions/findOptions';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IDownloadFileResult, IStorageService } from '../../../../shared/storage/iStorageService';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { Document } from '../../models/document';
import { DOCUMENTS_KEY } from '../upsertDocument/upsertDocumentUseCase';
import { GetDocumentByIdCommand, IGetDocumentByIdCommandProps } from './getDocumentByIdCommand';

export abstract class GetDocumentByIdUseCase<
  E extends any // E extends DocumentableEntity, => when projects/interventions is refactorised
> extends ByIdUseCase<any, IDownloadFileResult> {
  // should extends ByIdUseCase<E>
  private readonly storageService: IStorageService = storageApiService;

  protected createCommand(
    req: IGetDocumentByIdCommandProps
  ): Result<GetDocumentByIdCommand<IGetDocumentByIdCommandProps>> {
    return GetDocumentByIdCommand.create(req);
  }

  public async execute(req: IGetDocumentByIdCommandProps): Promise<any> {
    const cmdResult = this.createCommand(req);
    if (cmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(cmdResult)));
    }
    const getCmd: GetDocumentByIdCommand<IGetDocumentByIdCommandProps> = cmdResult.getValue();

    this.entity = await this.entityRepository.findOne(
      FindOptions.create({
        criterias: {
          id: getCmd.id
        },
        fields: 'documents'
      }).getValue()
    );
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${getCmd.id} was not found`));
    }

    if (isEmpty(this.entity[DOCUMENTS_KEY])) {
      this.entity[DOCUMENTS_KEY] = [];
    }
    const document: IEnrichedDocument = this.entity[DOCUMENTS_KEY].find(
      (doc: Document | IEnrichedDocument) => doc.id === getCmd.documentId
    );
    if (!document) {
      return left(new NotFoundError(`Document ${getCmd.documentId} was not found`));
    }

    const downloadFileResult = await this.storageService.get((document as any).objectId);
    if (downloadFileResult.isFailure) {
      return left(Result.combineForError(downloadFileResult));
    }
    return right(Result.ok<IDownloadFileResult>(downloadFileResult.getValue()));
  }
}

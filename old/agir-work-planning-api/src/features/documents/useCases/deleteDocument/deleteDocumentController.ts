import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { DeleteByIdController } from '../../../../shared/controllers/deleteByIdController';
import { IDeleteDocumentCommandProps } from './deleteDocumentCommand';
import { DeleteDocumentUseCase } from './deleteDocumentUseCase';

@autobind
export abstract class DeleteDocumentController<E extends any> extends DeleteByIdController<any> {
  // E extends Entity<any> Documentable
  protected abstract useCase: DeleteDocumentUseCase<E>;

  protected reqToInput(req: express.Request): IDeleteDocumentCommandProps {
    return {
      id: req.params.id,
      documentId: req.params.documentId
    };
  }
}

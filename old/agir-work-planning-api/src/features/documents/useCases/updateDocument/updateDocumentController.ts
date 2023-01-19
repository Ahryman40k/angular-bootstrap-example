import * as autobind from 'autobind-decorator';
import { UploadRequest } from '../../../../models/requests';
import { UpsertDocumentController } from '../upsertDocument/upsertDocumentController';
import { IUpdateDocumentCommandProps } from './updateDocumentCommand';
import { UpdateDocumentUseCase } from './updateDocumentUseCase';

@autobind
export abstract class UpdateDocumentController<E extends any> extends UpsertDocumentController<E> {
  protected abstract useCase: UpdateDocumentUseCase<E>;
  protected success = this.ok;

  protected reqToInput(req: UploadRequest): IUpdateDocumentCommandProps {
    return {
      ...super.reqToInput(req),
      documentId: req.params.documentId
    };
  }
}

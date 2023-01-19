import { IEnrichedDocument } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import { UploadRequest } from '../../../../models/requests';
import { UploadController } from '../../../../shared/upload/uploadController';
import { IUpsertDocumentCommandProps } from './upsertDocumentCommand';
import { UpsertDocumentUseCase } from './upsertDocumentUseCase';

@autobind
export abstract class UpsertDocumentController<E extends any> extends UploadController<
  IUpsertDocumentCommandProps,
  IEnrichedDocument
> {
  // E extends Entity<any> Commentable
  protected abstract useCase: UpsertDocumentUseCase<E>;

  protected reqToInput(req: UploadRequest): IUpsertDocumentCommandProps {
    return {
      ...super.reqToInput(req),
      ...req.body,
      id: req.params.id
    };
  }
}

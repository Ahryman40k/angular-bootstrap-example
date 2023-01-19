import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { DeleteController } from '../../../../../shared/controllers/deleteController';
import { IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { deleteDrmNumberUseCase, DeleteDrmNumberUseCase } from './deleteDrmNumberUseCase';

@autobind
export class DeleteDrmNumberController extends DeleteController<any, IByIdCommandProps> {
  protected readonly useCase: DeleteDrmNumberUseCase = deleteDrmNumberUseCase;
  protected reqToInput(req: express.Request): IByIdCommandProps {
    return {
      id: req.query.id
    };
  }
}

import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { IByIdCommandProps } from '../domain/useCases/byIdCommand';
import { ByIdController } from './byIdController';

@autobind
export abstract class UpdateController<I extends IByIdCommandProps, O> extends ByIdController<O> {
  protected reqToInput(req: express.Request): I {
    return {
      ...req.body,
      id: req.params.id
    };
  }
}

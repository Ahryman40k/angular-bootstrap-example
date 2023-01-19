import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../useCaseController';

@autobind
export abstract class CreateController<I, O> extends UseCaseController<I, O> {
  protected success = this.created;
  protected reqToInput(req: express.Request): I {
    return {
      ...req.body
    };
  }
}

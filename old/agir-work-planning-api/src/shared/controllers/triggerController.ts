import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../useCaseController';

@autobind
export abstract class TriggerController extends UseCaseController<void, void> {
  protected success = this.accepted;
  protected reqToInput(req: express.Request) {
    return;
  }
}

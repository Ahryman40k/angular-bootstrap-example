import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { IByIdCommandProps } from '../domain/useCases/byIdCommand';
import { UseCaseController } from '../useCaseController';

@autobind
export abstract class ByIdController<O> extends UseCaseController<IByIdCommandProps, O> {
  protected reqToInput(req: express.Request): IByIdCommandProps {
    return {
      id: req.params.id,
      expand: req.query.expand,
      fields: req.query.fields
    };
  }
}

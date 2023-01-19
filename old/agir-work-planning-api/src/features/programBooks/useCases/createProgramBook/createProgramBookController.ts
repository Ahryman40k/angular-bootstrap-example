import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { CreateController } from '../../../../shared/controllers/createController';
import { ICreateProgramBookCommandProps } from './createProgramBookCommand';
import { CreateProgramBookUseCase, createProgramBookUseCase } from './createProgramBookUseCase';

@autobind
export class CreateProgramBookController extends CreateController<
  ICreateProgramBookCommandProps,
  IEnrichedProgramBook
> {
  protected readonly useCase: CreateProgramBookUseCase = createProgramBookUseCase;
  protected reqToInput(req: express.Request): ICreateProgramBookCommandProps {
    return {
      ...super.reqToInput(req),
      annualProgramId: req.params.id
    };
  }
}

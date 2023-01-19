import { IEnrichedObjective } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { CreateController } from '../../../../shared/controllers/createController';
import { ICreateProgramBookObjectiveCommandProps } from './createProgramBookObjectiveCommand';
import {
  CreateProgramBookObjectiveUseCase,
  createProgramBookObjectiveUseCase
} from './createProgramBookObjectiveUseCase';

@autobind
export class CreateProgramBookObjectiveController extends CreateController<
  ICreateProgramBookObjectiveCommandProps,
  IEnrichedObjective
> {
  protected readonly useCase: CreateProgramBookObjectiveUseCase = createProgramBookObjectiveUseCase;
  protected reqToInput(req: express.Request): ICreateProgramBookObjectiveCommandProps {
    return {
      ...super.reqToInput(req),
      programBookId: req.params.programBookId
    };
  }
}

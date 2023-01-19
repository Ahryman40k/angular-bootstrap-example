import { IEnrichedObjective } from '@villemontreal/agir-work-planning-lib/dist/src/planning';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { IUpdateProgramBookObjectiveCommandProps } from './updateProgramBookObjectiveCommand';
import {
  UpdateProgramBookObjectiveUseCase,
  updateProgramBookObjectiveUseCase
} from './updateProgramBookObjectiveUseCase';

@autobind
export class UpdateProgramBookObjectiveController extends UseCaseController<
  IUpdateProgramBookObjectiveCommandProps,
  IEnrichedObjective
> {
  protected readonly useCase: UpdateProgramBookObjectiveUseCase = updateProgramBookObjectiveUseCase;
  protected reqToInput(req: express.Request): IUpdateProgramBookObjectiveCommandProps {
    return {
      ...req.body,
      programBookId: req.params.programBookId,
      objectiveId: req.params.id
    };
  }
}

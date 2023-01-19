import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { DeleteController } from '../../../../shared/controllers/deleteController';
import { Objective } from '../../models/objective';
import { IDeleteProgramBookObjectiveCommandProps } from './deleteProgramBookObjectiveCommand';
import {
  DeleteProgramBookObjectiveUseCase,
  deleteProgramBookObjectiveUseCase
} from './deleteProgramBookObjectiveUseCase';

@autobind
export class DeleteProgramBookObjectiveController extends DeleteController<
  Objective,
  IDeleteProgramBookObjectiveCommandProps
> {
  protected readonly useCase: DeleteProgramBookObjectiveUseCase = deleteProgramBookObjectiveUseCase;
  protected reqToInput(req: express.Request): IDeleteProgramBookObjectiveCommandProps {
    return {
      programBookId: req.params.programBookId,
      objectiveId: req.params.id
    };
  }
}

import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { IUpdateOrderedProjectRankManuallyCommandProps } from './updateOrderedProjectRankManuallyCommand';
import {
  UpdateOrderedProjectRankManuallyUseCase,
  updateOrderedProjectRankManuallyUseCase
} from './updateOrderedProjectRankManuallyUseCase';

@autobind
export class UpdateOrderedProjectRankManuallyController extends UseCaseController<
  IUpdateOrderedProjectRankManuallyCommandProps,
  IEnrichedProgramBook
> {
  protected readonly useCase: UpdateOrderedProjectRankManuallyUseCase = updateOrderedProjectRankManuallyUseCase;
  protected reqToInput(req: express.Request): IUpdateOrderedProjectRankManuallyCommandProps {
    return {
      projectRank: req.body,
      programBookId: req.params.programBookId,
      priorityScenarioId: req.params.priorityScenarioId,
      projectId: req.params.projectId
    };
  }
}

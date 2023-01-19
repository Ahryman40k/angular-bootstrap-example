import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { IUpdatePriorityLevelsCommandProps } from './updatePriorityLevelsCommand';
import { UpdatePriorityLevelsUseCase, updatePriorityLevelsUseCase } from './updatePriorityLevelsUseCase';

@autobind
export class UpdatePriorityLevelsController extends UseCaseController<
  IUpdatePriorityLevelsCommandProps,
  IEnrichedProgramBook
> {
  protected readonly useCase: UpdatePriorityLevelsUseCase = updatePriorityLevelsUseCase;
  protected reqToInput(req: express.Request): IUpdatePriorityLevelsCommandProps {
    return {
      priorityLevels: req.body,
      programBookId: req.params.programBookId,
      priorityScenarioId: req.params.priorityScenarioId
    };
  }
}

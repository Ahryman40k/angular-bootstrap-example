import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { IGetPriorityScenarioOrderedProjectsProps } from './getPriorityScenarioOrderedProjectsCommand';
import {
  GetPriorityScenarioOrderedProjectsUseCase,
  getPriorityScenarioOrderedProjectsUseCase
} from './getPriorityScenarioOrderedProjectsUseCase';

@autobind
export class GetPriorityScenarioOrderedProjectsController extends UseCaseController<
  IGetPriorityScenarioOrderedProjectsProps,
  IEnrichedProgramBook
> {
  protected useCase: GetPriorityScenarioOrderedProjectsUseCase = getPriorityScenarioOrderedProjectsUseCase;
  protected reqToInput(req: express.Request): IGetPriorityScenarioOrderedProjectsProps {
    return {
      ...req.query,
      programBookId: req.params.programBookId,
      priorityScenarioId: req.params.priorityScenarioId
    };
  }
}

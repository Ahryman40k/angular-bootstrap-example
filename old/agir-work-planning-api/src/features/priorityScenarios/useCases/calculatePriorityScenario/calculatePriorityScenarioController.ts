import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { ICalculatePriorityScenarioCommandProps } from './calculatePriorityScenarioCommand';
import { CalculatePriorityScenarioUseCase, calculatePriorityScenarioUseCase } from './calculatePriorityScenarioUseCase';

@autobind
export class CalculatePriorityScenarioController extends UseCaseController<
  ICalculatePriorityScenarioCommandProps,
  IEnrichedProgramBook
> {
  protected readonly useCase: CalculatePriorityScenarioUseCase = calculatePriorityScenarioUseCase;
  protected reqToInput(req: express.Request): ICalculatePriorityScenarioCommandProps {
    return {
      ...req.body,
      programBookId: req.params.programBookId,
      priorityScenarioId: req.params.priorityScenarioId
    };
  }
}

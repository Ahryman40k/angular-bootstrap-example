import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { IProgramProjectCommandProps } from './programProjectCommand';
import { ProgramProjectUseCase, programProjectUseCase } from './programProjectUseCase';

@autobind
export class ProgramProjectController extends UseCaseController<IProgramProjectCommandProps, IEnrichedProject> {
  protected readonly useCase: ProgramProjectUseCase = programProjectUseCase;
  protected reqToInput(req: express.Request): IProgramProjectCommandProps {
    return {
      ...req.body,
      programBookId: req.params.id
    };
  }
}

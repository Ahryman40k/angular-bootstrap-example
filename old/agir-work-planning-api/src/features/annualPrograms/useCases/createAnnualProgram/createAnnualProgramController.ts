import * as autobind from 'autobind-decorator';

import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib/dist/src';
import { CreateController } from '../../../../shared/controllers/createController';
import { ICreateAnnualProgramCommandProps } from './createAnnualProgramCommand';
import { CreateAnnualProgramUseCase, createAnnualProgramUseCase } from './createAnnualProgramUseCase';

@autobind
export class CreateAnnualProgramController extends CreateController<
  ICreateAnnualProgramCommandProps,
  IEnrichedAnnualProgram
> {
  protected readonly useCase: CreateAnnualProgramUseCase = createAnnualProgramUseCase;
}

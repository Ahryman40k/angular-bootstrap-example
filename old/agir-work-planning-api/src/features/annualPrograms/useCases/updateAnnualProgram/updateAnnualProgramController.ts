import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';

import { UpdateController } from '../../../../shared/controllers/updateController';
import { IUpdateAnnualProgramCommandProps } from './updateAnnualProgramCommand';
import { UpdateAnnualProgramUseCase, updateAnnualProgramUseCase } from './updateAnnualProgramUseCase';

@autobind
export class UpdateAnnualProgramController extends UpdateController<
  IUpdateAnnualProgramCommandProps,
  IEnrichedAnnualProgram
> {
  protected readonly useCase: UpdateAnnualProgramUseCase = updateAnnualProgramUseCase;
}

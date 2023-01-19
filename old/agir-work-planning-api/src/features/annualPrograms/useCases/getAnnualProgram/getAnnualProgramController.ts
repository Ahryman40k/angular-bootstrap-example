import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';

import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { AnnualProgram } from '../../models/annualProgram';
import { AnnualProgramFindOneOptions } from '../../models/annualProgramFindOneOptions';
import { getAnnualProgramUseCase, GetAnnualProgramUseCase } from './getAnnualProgramUseCase';

@autobind
export class GetAnnualProgramController extends GetByIdController<
  AnnualProgram,
  IEnrichedAnnualProgram,
  AnnualProgramFindOneOptions
> {
  protected useCase: GetAnnualProgramUseCase = getAnnualProgramUseCase;
}

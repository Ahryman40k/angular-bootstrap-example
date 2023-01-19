import * as autobind from 'autobind-decorator';

import { DeleteByIdController } from '../../../../shared/controllers/deleteByIdController';
import { AnnualProgram } from '../../models/annualProgram';
import { deleteAnnualProgramUseCase, DeleteAnnualProgramUseCase } from './deleteAnnualProgramUseCase';

@autobind
export class DeleteAnnualProgramController extends DeleteByIdController<AnnualProgram> {
  protected useCase: DeleteAnnualProgramUseCase = deleteAnnualProgramUseCase;
}

import * as autobind from 'autobind-decorator';
import { DeleteByIdController } from '../../../../shared/controllers/deleteByIdController';
import { ProgramBook } from '../../models/programBook';
import { deleteProgramBookUseCase, DeleteProgramBookUseCase } from './deleteProgramBookUseCase';

@autobind
export class DeleteProgramBookController extends DeleteByIdController<ProgramBook> {
  protected useCase: DeleteProgramBookUseCase = deleteProgramBookUseCase;
}

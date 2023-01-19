import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UpdateController } from '../../../../shared/controllers/updateController';
import { IUpdateProgramBookCommandProps } from './updateProgramBookCommand';
import { UpdateProgramBookUseCase, updateProgramBookUseCase } from './updateProgramBookUseCase';

@autobind
export class UpdateProgramBookController extends UpdateController<
  IUpdateProgramBookCommandProps,
  IEnrichedProgramBook
> {
  protected readonly useCase: UpdateProgramBookUseCase = updateProgramBookUseCase;
}

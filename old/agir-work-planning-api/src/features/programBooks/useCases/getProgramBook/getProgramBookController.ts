import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { ProgramBook } from '../../models/programBook';
import { ProgramBookFindOneOptions } from '../../models/programBookFindOneOptions';
import { getProgramBookUseCase, GetProgramBookUseCase } from './getProgramBookUseCase';

@autobind
export class GetProgramBookController extends GetByIdController<
  ProgramBook,
  IEnrichedProgramBook,
  ProgramBookFindOneOptions
> {
  protected readonly useCase: GetProgramBookUseCase = getProgramBookUseCase;
}

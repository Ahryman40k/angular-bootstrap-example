import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';

import { ByIdController } from '../../../../shared/controllers/byIdController';
import {
  GetAnnualProgramProgramBooksUseCase,
  getAnnualProgramProgramBooksUseCase
} from './getAnnualProgramProgramBooksUseCase';

@autobind
export class GetAnnualProgramProgramBooksController extends ByIdController<IEnrichedProgramBook[]> {
  protected useCase: GetAnnualProgramProgramBooksUseCase = getAnnualProgramProgramBooksUseCase;
}

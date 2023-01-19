import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { ProgramBook } from '../../models/programBook';
import { getProgramBookProjectsUseCase, GetProgramBookProjectsUseCase } from './getProgramBookProjectsUseCase';

@autobind
export class GetProgramBookProjectsController extends GetByIdController<ProgramBook, IEnrichedProject, any> {
  protected useCase: GetProgramBookProjectsUseCase = getProgramBookProjectsUseCase;
}

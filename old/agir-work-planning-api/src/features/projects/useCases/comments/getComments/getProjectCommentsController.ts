import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { GetCommentsController } from '../../../../comments/useCases/getComments/getCommentsController';
import { GetProjectCommentsUseCase, getProjectCommentsUseCase } from './getProjectCommentsUseCase';

@autobind
export class GetProjectCommentsController extends GetCommentsController<IEnrichedProject> {
  protected useCase: GetProjectCommentsUseCase = getProjectCommentsUseCase;
}

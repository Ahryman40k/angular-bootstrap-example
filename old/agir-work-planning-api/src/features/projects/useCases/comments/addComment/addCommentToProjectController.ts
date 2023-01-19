import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { AddCommentController } from '../../../../comments/useCases/addComment/addCommentController';
import { addCommentToProjectUseCase, AddCommentToProjectUseCase } from './addCommentToProjectUseCase';

@autobind
export class AddCommentToProjectController extends AddCommentController<IEnrichedProject> {
  protected useCase: AddCommentToProjectUseCase = addCommentToProjectUseCase;
}

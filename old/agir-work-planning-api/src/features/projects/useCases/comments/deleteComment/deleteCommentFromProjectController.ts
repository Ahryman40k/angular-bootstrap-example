import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { DeleteCommentController } from '../../../../comments/useCases/deleteComment/deleteCommentController';
import { deleteCommentFromProjectUseCase, DeleteCommentFromProjectUseCase } from './deleteCommentFromProjectUseCase';

@autobind
export class DeleteCommentFromProjectController extends DeleteCommentController<IEnrichedProject> {
  protected useCase: DeleteCommentFromProjectUseCase = deleteCommentFromProjectUseCase;
}

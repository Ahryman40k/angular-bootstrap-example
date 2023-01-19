import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UpdateCommentController } from '../../../../comments/useCases/updateComment/updateCommentController';
import { updateCommentProjectUseCase, UpdateCommentProjectUseCase } from './updateCommentProjectUseCase';

@autobind
export class UpdateCommentProjectController extends UpdateCommentController<IEnrichedProject> {
  protected useCase: UpdateCommentProjectUseCase = updateCommentProjectUseCase;
}

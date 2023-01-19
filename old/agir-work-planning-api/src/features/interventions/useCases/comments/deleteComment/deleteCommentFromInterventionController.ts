import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { DeleteCommentController } from '../../../../comments/useCases/deleteComment/deleteCommentController';
import {
  deleteCommentFromInterventionUseCase,
  DeleteCommentFromInterventionUseCase
} from './deleteCommentFromInterventionUseCase';

@autobind
export class DeleteCommentFromInterventionController extends DeleteCommentController<IEnrichedIntervention> {
  protected useCase: DeleteCommentFromInterventionUseCase = deleteCommentFromInterventionUseCase;
}

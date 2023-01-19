import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { AddCommentController } from '../../../../comments/useCases/addComment/addCommentController';
import { AddCommentToInterventionUseCase, addCommentToInterventionUseCase } from './addCommentToInterventionUseCase';

@autobind
export class AddCommentToInterventionController extends AddCommentController<IEnrichedIntervention> {
  protected useCase: AddCommentToInterventionUseCase = addCommentToInterventionUseCase;
}

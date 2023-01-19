import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UpdateCommentController } from '../../../../comments/useCases/updateComment/updateCommentController';
import { UpdateCommentInterventionUseCase, updateCommentInterventionUseCase } from './updateCommentInterventionUseCase';

@autobind
export class UpdateCommentInterventionController extends UpdateCommentController<IEnrichedIntervention> {
  protected useCase: UpdateCommentInterventionUseCase = updateCommentInterventionUseCase;
}

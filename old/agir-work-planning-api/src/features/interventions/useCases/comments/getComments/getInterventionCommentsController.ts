import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { GetCommentsController } from '../../../../comments/useCases/getComments/getCommentsController';
import { GetInterventionCommentsUseCase, getInterventionCommentsUseCase } from './getInterventionCommentsUseCase';

@autobind
export class GetInterventionCommentsController extends GetCommentsController<IEnrichedIntervention> {
  protected useCase: GetInterventionCommentsUseCase = getInterventionCommentsUseCase;
}

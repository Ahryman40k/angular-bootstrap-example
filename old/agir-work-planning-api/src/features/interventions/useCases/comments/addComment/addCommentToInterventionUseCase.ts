import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { AddCommentCommand, IAddCommentCommandProps } from '../../../../comments/useCases/addComment/addCommentCommand';
import { AddCommentUseCase } from '../../../../comments/useCases/addComment/addCommentUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';
import { InterventionValidator, interventionValidator } from '../../../validators/interventionValidator';

export class AddCommentToInterventionUseCase extends AddCommentUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;

  protected createCommand(req: IAddCommentCommandProps): Result<AddCommentCommand<IAddCommentCommandProps>> {
    return AddCommentCommand.create(req, GuardType.VALID_INTERVENTION_ID);
  }

  protected async validateBusinessRules(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return InterventionValidator.validateCanInteract(intervention);
  }

  protected validateRestrictions(intervention: IEnrichedIntervention): Result<IGuardResult> {
    return interventionValidator.validateRestrictions(intervention);
  }
}

export const addCommentToInterventionUseCase = new AddCommentToInterventionUseCase();

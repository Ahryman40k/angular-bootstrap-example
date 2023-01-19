import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IUpdateCommentCommandProps,
  UpdateCommentCommand
} from '../../../../comments/useCases/updateComment/updateCommentCommand';
import { UpdateCommentUseCase } from '../../../../comments/useCases/updateComment/updateCommentUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';
import { InterventionValidator, interventionValidator } from '../../../validators/interventionValidator';

export class UpdateCommentInterventionUseCase extends UpdateCommentUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;

  protected createCommand(req: IUpdateCommentCommandProps): Result<UpdateCommentCommand<IUpdateCommentCommandProps>> {
    return UpdateCommentCommand.create(req, GuardType.VALID_INTERVENTION_ID);
  }

  protected async validateBusinessRules(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return InterventionValidator.validateCanInteract(intervention);
  }

  protected validateRestrictions(intervention: IEnrichedIntervention): Result<IGuardResult> {
    return interventionValidator.validateRestrictions(intervention);
  }
}

export const updateCommentInterventionUseCase = new UpdateCommentInterventionUseCase();

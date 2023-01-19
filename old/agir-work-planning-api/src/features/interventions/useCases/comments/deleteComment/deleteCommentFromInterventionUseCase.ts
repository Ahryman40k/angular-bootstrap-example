import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  DeleteCommentCommand,
  IDeleteCommentCommandProps
} from '../../../../comments/useCases/deleteComment/deleteCommentCommand';
import { DeleteCommentUseCase } from '../../../../comments/useCases/deleteComment/deleteCommentUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';
import { InterventionValidator, interventionValidator } from '../../../validators/interventionValidator';

export class DeleteCommentFromInterventionUseCase extends DeleteCommentUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;

  protected createCommand(req: IDeleteCommentCommandProps): Result<DeleteCommentCommand> {
    return DeleteCommentCommand.create(req, GuardType.VALID_INTERVENTION_ID);
  }

  protected async validateBusinessRules(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return InterventionValidator.validateCanInteract(intervention);
  }

  protected validateRestrictions(intervention: IEnrichedIntervention): Result<IGuardResult> {
    return interventionValidator.validateRestrictions(intervention);
  }
}

export const deleteCommentFromInterventionUseCase = new DeleteCommentFromInterventionUseCase();

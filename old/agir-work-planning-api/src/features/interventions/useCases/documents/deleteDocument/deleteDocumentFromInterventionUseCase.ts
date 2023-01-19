import { IEnrichedIntervention, InterventionStatus } from '@villemontreal/agir-work-planning-lib';

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  DeleteDocumentCommand,
  IDeleteDocumentCommandProps
} from '../../../../documents/useCases/deleteDocument/deleteDocumentCommand';
import { DeleteDocumentUseCase } from '../../../../documents/useCases/deleteDocument/deleteDocumentUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';
import { InterventionValidator, interventionValidator } from '../../../validators/interventionValidator';

export class DeleteDocumentFromInterventionUseCase extends DeleteDocumentUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;

  protected createCommand(req: IDeleteDocumentCommandProps): Result<DeleteDocumentCommand> {
    return DeleteDocumentCommand.create(req, GuardType.VALID_INTERVENTION_ID);
  }

  protected async validateBusinessRules(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return InterventionValidator.validateCanInteract(intervention, [InterventionStatus.canceled]);
  }

  protected async validateRestrictions(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return interventionValidator.validateRestrictions(intervention);
  }
}

export const deleteDocumentFromInterventionUseCase = new DeleteDocumentFromInterventionUseCase();

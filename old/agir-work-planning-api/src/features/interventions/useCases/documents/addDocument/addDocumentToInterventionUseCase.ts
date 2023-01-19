import { IEnrichedIntervention, InterventionStatus } from '@villemontreal/agir-work-planning-lib';

import { IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { IUploadFileResult } from '../../../../../shared/storage/iStorageService';
import { DocumentIntervention } from '../../../../documents/models/documentIntervention';
import { AddDocumentUseCase } from '../../../../documents/useCases/addDocument/addDocumentUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';
import { InterventionValidator, interventionValidator } from '../../../validators/interventionValidator';
import {
  AddDocumentToInterventionCommand,
  IAddDocumentToInterventionCommandProps
} from './addDocumentToInterventionCommand';

export class AddDocumentToInterventionUseCase extends AddDocumentUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;

  protected createCommand(
    req: IAddDocumentToInterventionCommandProps
  ): Result<AddDocumentToInterventionCommand<IAddDocumentToInterventionCommandProps>> {
    return AddDocumentToInterventionCommand.create(req);
  }

  protected createDocument(
    addDocumentCmd: AddDocumentToInterventionCommand<IAddDocumentToInterventionCommandProps>,
    uploadedFile: IUploadFileResult
  ): Result<DocumentIntervention> {
    return DocumentIntervention.create({
      ...this.toDocumentProps(addDocumentCmd, uploadedFile),
      isProjectVisible: addDocumentCmd.isProjectVisible
    });
  }

  protected async validateBusinessRules(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return InterventionValidator.validateCanInteract(intervention, [InterventionStatus.canceled]);
  }

  protected async validateRestrictions(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return interventionValidator.validateRestrictions(intervention);
  }
}

export const addDocumentToInterventionUseCase = new AddDocumentToInterventionUseCase();

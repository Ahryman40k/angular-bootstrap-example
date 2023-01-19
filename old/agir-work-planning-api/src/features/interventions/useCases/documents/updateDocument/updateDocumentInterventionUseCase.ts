import { IEnrichedDocument, IEnrichedIntervention, InterventionStatus } from '@villemontreal/agir-work-planning-lib';
import { isNil } from 'lodash';

import { IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { IUploadFileResult } from '../../../../../shared/storage/iStorageService';
import { DocumentIntervention } from '../../../../documents/models/documentIntervention';
import { UpdateDocumentUseCase } from '../../../../documents/useCases/updateDocument/updateDocumentUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';
import { InterventionValidator, interventionValidator } from '../../../validators/interventionValidator';
import {
  IUpdateDocumentInterventionCommandProps,
  UpdateDocumentInterventionCommand
} from './updateDocumentInterventionCommand';

export class UpdateDocumentInterventionUseCase extends UpdateDocumentUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;

  protected createCommand(
    req: IUpdateDocumentInterventionCommandProps
  ): Result<UpdateDocumentInterventionCommand<IUpdateDocumentInterventionCommandProps>> {
    return UpdateDocumentInterventionCommand.create(req);
  }

  protected createDocument(
    updateDocumentCmd: UpdateDocumentInterventionCommand<IUpdateDocumentInterventionCommandProps>,
    uploadedFile: IUploadFileResult,
    existingDocument: DocumentIntervention | IEnrichedDocument
  ): Result<DocumentIntervention> {
    return DocumentIntervention.create(
      {
        ...this.toDocumentProps(updateDocumentCmd, uploadedFile, existingDocument),
        isProjectVisible: !isNil(updateDocumentCmd.isProjectVisible)
          ? updateDocumentCmd.isProjectVisible
          : existingDocument.isProjectVisible
      },
      updateDocumentCmd.documentId
    );
  }

  protected async validateBusinessRules(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return InterventionValidator.validateCanInteract(intervention, [InterventionStatus.canceled]);
  }

  protected async validateRestrictions(intervention: IEnrichedIntervention): Promise<Result<IGuardResult>> {
    return interventionValidator.validateRestrictions(intervention);
  }
}

export const updateDocumentInterventionUseCase = new UpdateDocumentInterventionUseCase();

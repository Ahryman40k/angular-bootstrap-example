import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IUpdateDocumentCommandProps,
  UpdateDocumentCommand
} from '../../../../documents/useCases/updateDocument/updateDocumentCommand';
import { UpdateDocumentUseCase } from '../../../../documents/useCases/updateDocument/updateDocumentUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { ProjectValidator, projectValidator } from '../../../validators/projectValidator';

export class UpdateDocumentProjectUseCase extends UpdateDocumentUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;

  protected createCommand(
    req: IUpdateDocumentCommandProps
  ): Result<UpdateDocumentCommand<IUpdateDocumentCommandProps>> {
    // omit isProjectVisible
    return UpdateDocumentCommand.create(req, GuardType.VALID_PROJECT_ID);
  }

  protected async validateBusinessRules(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return ProjectValidator.validateCanInteract(project);
  }

  protected async validateRestrictions(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return projectValidator.validateRestrictions(project);
  }
}

export const updateDocumentProjectUseCase = new UpdateDocumentProjectUseCase();

import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  AddDocumentCommand,
  IAddDocumentCommandProps
} from '../../../../documents/useCases/addDocument/addDocumentCommand';
import { AddDocumentUseCase } from '../../../../documents/useCases/addDocument/addDocumentUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { ProjectValidator, projectValidator } from '../../../validators/projectValidator';

export class AddDocumentToProjectUseCase extends AddDocumentUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;

  protected createCommand(req: IAddDocumentCommandProps): Result<AddDocumentCommand<IAddDocumentCommandProps>> {
    // omit isProjectVisible
    return AddDocumentCommand.create(req, GuardType.VALID_PROJECT_ID);
  }

  protected async validateBusinessRules(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return ProjectValidator.validateCanInteract(project);
  }

  protected async validateRestrictions(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return projectValidator.validateRestrictions(project);
  }
}

export const addDocumentToProjectUseCase = new AddDocumentToProjectUseCase();

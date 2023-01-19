import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  DeleteDocumentCommand,
  IDeleteDocumentCommandProps
} from '../../../../documents/useCases/deleteDocument/deleteDocumentCommand';
import { DeleteDocumentUseCase } from '../../../../documents/useCases/deleteDocument/deleteDocumentUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { ProjectValidator, projectValidator } from '../../../validators/projectValidator';

export class DeleteDocumentFromProjectUseCase extends DeleteDocumentUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;
  protected createCommand(req: IDeleteDocumentCommandProps): Result<DeleteDocumentCommand> {
    return DeleteDocumentCommand.create(req, GuardType.VALID_PROJECT_ID);
  }

  protected async validateBusinessRules(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return ProjectValidator.validateCanInteract(project);
  }

  protected async validateRestrictions(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return projectValidator.validateRestrictions(project);
  }
}

export const deleteDocumentFromProjectUseCase = new DeleteDocumentFromProjectUseCase();

import { IComment, IEnrichedProject, Permission } from '@villemontreal/agir-work-planning-lib';

import { userService } from '../../../../../services/userService';
import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  DeleteCommentCommand,
  IDeleteCommentCommandProps
} from '../../../../comments/useCases/deleteComment/deleteCommentCommand';
import { DeleteCommentUseCase } from '../../../../comments/useCases/deleteComment/deleteCommentUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { ProjectValidator, projectValidator } from '../../../validators/projectValidator';

export class DeleteCommentFromProjectUseCase extends DeleteCommentUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;
  protected createCommand(req: IDeleteCommentCommandProps): Result<DeleteCommentCommand> {
    return DeleteCommentCommand.create(req, GuardType.VALID_PROJECT_ID);
  }

  protected async validateBusinessRules(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return ProjectValidator.validateCanInteract(project);
  }

  protected async validatePermissions(commentToBeDeleted: IComment): Promise<Result<IGuardResult>> {
    const user = userService.currentUser;
    if (!user.hasPermission(Permission.PROJECT_COMMENT_WRITE_PRIVATE) && !commentToBeDeleted.isPublic) {
      return Result.fail(`You are not allowed to edit a private comment.`);
    }
    return Result.ok();
  }

  protected validateRestrictions(project: IEnrichedProject): Result<IGuardResult> {
    return projectValidator.validateRestrictions(project);
  }
}

export const deleteCommentFromProjectUseCase = new DeleteCommentFromProjectUseCase();

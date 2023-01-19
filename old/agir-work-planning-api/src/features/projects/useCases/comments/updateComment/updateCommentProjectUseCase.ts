import { IEnrichedProject, Permission } from '@villemontreal/agir-work-planning-lib';
import { omit } from 'lodash';

import { userService } from '../../../../../services/userService';
import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IUpdateCommentCommandProps,
  UpdateCommentCommand
} from '../../../../comments/useCases/updateComment/updateCommentCommand';
import { UpdateCommentUseCase } from '../../../../comments/useCases/updateComment/updateCommentUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { ProjectValidator, projectValidator } from '../../../validators/projectValidator';

export class UpdateCommentProjectUseCase extends UpdateCommentUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;

  protected createCommand(req: IUpdateCommentCommandProps): Result<UpdateCommentCommand<IUpdateCommentCommandProps>> {
    // omit isProjectVisible
    return UpdateCommentCommand.create(omit(req, ['isProjectVisible']), GuardType.VALID_PROJECT_ID);
  }

  protected async validateBusinessRules(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return ProjectValidator.validateCanInteract(project);
  }

  protected async validatePermissions(commentToBeDeleted: IUpdateCommentCommandProps): Promise<Result<IGuardResult>> {
    const user = userService.currentUser;
    if (
      !user.hasPermission(Permission.PROJECT_COMMENT_WRITE_PRIVATE) &&
      (!this.comments.find(comment => comment.id === commentToBeDeleted.commentId)?.isPublic ||
        !commentToBeDeleted.isPublic)
    ) {
      return Result.fail(`You are not allowed to edit a private comment.`);
    }
    return Result.ok();
  }

  protected validateRestrictions(project: IEnrichedProject): Result<IGuardResult> {
    return projectValidator.validateRestrictions(project);
  }
}

export const updateCommentProjectUseCase = new UpdateCommentProjectUseCase();

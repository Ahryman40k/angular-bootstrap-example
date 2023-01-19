import { IEnrichedProject, Permission } from '@villemontreal/agir-work-planning-lib';
import { omit } from 'lodash';

import { userService } from '../../../../../services/userService';
import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { AddCommentCommand, IAddCommentCommandProps } from '../../../../comments/useCases/addComment/addCommentCommand';
import { AddCommentUseCase } from '../../../../comments/useCases/addComment/addCommentUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { ProjectValidator, projectValidator } from '../../../validators/projectValidator';

export class AddCommentToProjectUseCase extends AddCommentUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;

  protected createCommand(req: IAddCommentCommandProps): Result<AddCommentCommand<IAddCommentCommandProps>> {
    // omit isProjectVisible
    return AddCommentCommand.create(omit(req, ['isProjectVisible']), GuardType.VALID_PROJECT_ID);
  }

  protected async validateBusinessRules(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    return ProjectValidator.validateCanInteract(project);
  }

  protected async validatePermissions(options: IAddCommentCommandProps): Promise<Result<IGuardResult>> {
    const user = userService.currentUser;
    if (!user.hasPermission(Permission.PROJECT_COMMENT_WRITE_PRIVATE) && !options.isPublic) {
      return Result.fail(`You are not allowed to create a private comment.`);
    }
    return Result.ok();
  }

  protected validateRestrictions(project: IEnrichedProject): Result<IGuardResult> {
    return projectValidator.validateRestrictions(project);
  }
}

export const addCommentToProjectUseCase = new AddCommentToProjectUseCase();

import { DeleteUseCase } from '../../../../../shared/domain/useCases/deleteUseCase/deleteUseCase';
import { Response } from '../../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../../shared/logic/left';
import { Result } from '../../../../../shared/logic/result';
import { right } from '../../../../../shared/logic/right';
import { SubmissionRequirement } from '../../../models/requirements/submissionRequirement';
import { submissionRepository } from '../../../mongo/submissionRepository';
import { SubmissionValidator } from '../../../validators/submissionValidator';
import {
  DeleteSubmissionRequirementCommand,
  ISubmissionDeleteRequirementRequestProps
} from './submissionRequirementDeleteRequest';

export class DeleteSubmissionRequirementUseCase extends DeleteUseCase<
  SubmissionRequirement,
  ISubmissionDeleteRequirementRequestProps
> {
  protected createCommand(
    req: ISubmissionDeleteRequirementRequestProps
  ): Result<ISubmissionDeleteRequirementRequestProps> {
    return DeleteSubmissionRequirementCommand.create(req);
  }
  public async execute(req: ISubmissionDeleteRequirementRequestProps): Promise<Response<void>> {
    const submissionRequirementResult = this.createCommand(req);

    if (submissionRequirementResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(submissionRequirementResult)));
    }

    const submissionRequirementCmd = submissionRequirementResult.getValue();

    const submission = await submissionRepository.findById(submissionRequirementCmd.submissionNumber);

    if (!submission) {
      return left(new NotFoundError(`Submission with id ${submissionRequirementCmd.submissionNumber} was not found`));
    }

    const restrictionResult = await SubmissionValidator.validateProjectIdsRestrictions(submission.projectIds);
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }

    const requirementIndex = submission.requirements.findIndex(item => item.id === submissionRequirementCmd.id);

    if (requirementIndex < 0) {
      return left(new NotFoundError(`Submission requirement with id ${submissionRequirementCmd.id} was not found`));
    }

    const requirement = submission.requirements[requirementIndex];

    const businessRulesResult = await SubmissionValidator.validateDeleteRequirementBusinessRules(
      submission,
      requirement
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    submission.requirements.splice(requirementIndex, 1);

    const savedResult = await submissionRepository.save(submission);

    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }

    return right(Result.ok<void>());
  }
}

export const deleteSubmissionRequirementUseCase = new DeleteSubmissionRequirementUseCase();

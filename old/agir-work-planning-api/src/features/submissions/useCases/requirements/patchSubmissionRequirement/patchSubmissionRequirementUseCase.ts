import { ISubmissionRequirement, ISubmissionRequirementRequest } from '@villemontreal/agir-work-planning-lib';

import { Response, UseCase } from '../../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../../shared/logic/left';
import { Result } from '../../../../../shared/logic/result';
import { right } from '../../../../../shared/logic/right';
import { Audit } from '../../../../audit/audit';
import { submissionRequirementMapperDTO } from '../../../mappers/requirementItemMapperDTO';
import { SubmissionRequirement } from '../../../models/requirements/submissionRequirement';
import { submissionRepository } from '../../../mongo/submissionRepository';
import { SubmissionValidator } from '../../../validators/submissionValidator';
import {
  ISubmissionRequirementPatchRequestProps,
  SubmissionRequirementPatchRequest
} from './submissionRequirementPatchRequest';

export class PatchSubmissionRequirementUseCase extends UseCase<
  ISubmissionRequirementPatchRequestProps,
  ISubmissionRequirementRequest
> {
  public async execute(req: ISubmissionRequirementPatchRequestProps): Promise<Response<ISubmissionRequirement>> {
    const submissionRequirementResult = SubmissionRequirementPatchRequest.create(req);

    if (submissionRequirementResult.isFailure) {
      return left(new InvalidParameterError(submissionRequirementResult.errorValue()));
    }

    const submissionRequirementCmd: SubmissionRequirementPatchRequest = submissionRequirementResult.getValue();

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

    const businessRulesResult = await SubmissionValidator.validatePatchRequirementBusinessRules(submission);

    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const submissionRequirementPatch = SubmissionRequirement.create(
      {
        projectIds: requirement.projectIds,
        mentionId: requirement.mentionId,
        typeId: requirement.typeId,
        subtypeId: requirement.subtypeId,
        text: requirement.text,
        isDeprecated: submissionRequirementCmd.isDeprecated,
        audit: Audit.fromUpdateContext(submission.requirements[requirementIndex].audit)
      },
      requirement.id
    ).getValue();

    submission.addOrReplaceRequirement(submissionRequirementPatch);

    const savedResult = await submissionRepository.save(submission);

    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }

    return right(
      Result.ok<ISubmissionRequirement>(await submissionRequirementMapperDTO.getFromModel(submissionRequirementPatch))
    );
  }
}

export const patchSubmissionRequirementUseCase = new PatchSubmissionRequirementUseCase();

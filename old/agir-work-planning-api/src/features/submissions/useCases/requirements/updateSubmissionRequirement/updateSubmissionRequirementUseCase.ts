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
  ISubmissionRequirementUpdateRequestProps,
  SubmissionRequirementUpdateRequest
} from './submissionRequirementUpdateRequest';

export class UpdateSubmissionRequirementUseCase extends UseCase<
  ISubmissionRequirementUpdateRequestProps,
  ISubmissionRequirementRequest
> {
  public async execute(req: ISubmissionRequirementUpdateRequestProps): Promise<Response<ISubmissionRequirement>> {
    const [submissionRequirementResult, taxonomyResult] = await Promise.all([
      SubmissionRequirementUpdateRequest.create(req),
      SubmissionValidator.validateRequirementAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([submissionRequirementResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const submissionRequirementCmd: SubmissionRequirementUpdateRequest = submissionRequirementResult.getValue();

    const submission = await submissionRepository.findById(submissionRequirementCmd.submissionNumber);

    if (!submission) {
      return left(new NotFoundError(`Submission with id ${submissionRequirementCmd.submissionNumber} was not found`));
    }
    const restrictionResult = await SubmissionValidator.validateProjectIdsRestrictions(submission.projectIds);
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }
    const requirementIndex = submission.requirements.findIndex(
      requirement => requirement.id === submissionRequirementCmd.id
    );

    if (requirementIndex < 0) {
      return left(new NotFoundError(`Submission requirement with id ${submissionRequirementCmd.id} was not found`));
    }

    const submissionRequirement: SubmissionRequirement = submission.requirements[requirementIndex];
    const businessRulesResult = await SubmissionValidator.validateRequirementUpdateBusinessRules(
      submission,
      submissionRequirement,
      submissionRequirementCmd
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const typeId = await SubmissionRequirementUpdateRequest.getType(submissionRequirementCmd.subtypeId);

    const submissionRequirementUpdate = SubmissionRequirement.create(
      {
        projectIds: submissionRequirementCmd.projectIds || submissionRequirement.projectIds,
        mentionId: submissionRequirement.mentionId,
        typeId,
        subtypeId: submissionRequirementCmd.subtypeId || submissionRequirement.subtypeId,
        text: submissionRequirementCmd.text || submissionRequirement.text,
        isDeprecated: submissionRequirement.isDeprecated,
        audit: Audit.fromUpdateContext(submissionRequirement.audit)
      },
      submissionRequirement.id
    ).getValue();

    submission.addOrReplaceRequirement(submissionRequirementUpdate);

    const savedResult = await submissionRepository.save(submission);

    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }

    return right(
      Result.ok<ISubmissionRequirement>(await submissionRequirementMapperDTO.getFromModel(submissionRequirementUpdate))
    );
  }
}

export const updateSubmissionRequirementUseCase = new UpdateSubmissionRequirementUseCase();

import {
  ISubmissionRequirement,
  SubmissionProgressStatus,
  SubmissionRequirementMention
} from '@villemontreal/agir-work-planning-lib';

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
  ISubmissionRequirementCreateRequestProps,
  SubmissionRequirementCreateRequest
} from './submissionRequirementCreateRequest';

export class CreateSubmissionRequirementUseCase extends UseCase<
  ISubmissionRequirementCreateRequestProps,
  ISubmissionRequirement
> {
  public async execute(req: ISubmissionRequirementCreateRequestProps): Promise<Response<ISubmissionRequirement>> {
    const [submissionRequirementResult, taxonomyResult] = await Promise.all([
      SubmissionRequirementCreateRequest.create(req),
      SubmissionValidator.validateRequirementAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([submissionRequirementResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const submissionRequirementCmd: SubmissionRequirementCreateRequest<ISubmissionRequirementCreateRequestProps> = submissionRequirementResult.getValue();

    const submission = await submissionRepository.findById(submissionRequirementCmd.submissionNumber);

    if (!submission) {
      return left(new NotFoundError(`Submission with id ${submissionRequirementCmd.submissionNumber} was not found`));
    }

    const restrictionResult = await SubmissionValidator.validateProjectIdsRestrictions(submission.projectIds);
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }

    const businessRulesResult = await SubmissionValidator.validateRequirementCreateBusinessRules(
      submission,
      submissionRequirementCmd
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const mentionId = [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN].includes(
      submission.progressStatus
    )
      ? SubmissionRequirementMention.BEFORE_TENDER
      : SubmissionRequirementMention.AFTER_TENDER;

    const audit: Audit = Audit.fromCreateContext();
    const typeId = await SubmissionRequirementCreateRequest.getType(submissionRequirementCmd.subtypeId);
    const submissionRequirement = SubmissionRequirement.create({
      projectIds: submissionRequirementCmd.projectIds,
      mentionId,
      typeId,
      subtypeId: submissionRequirementCmd.subtypeId,
      text: submissionRequirementCmd.text,
      isDeprecated: false,
      audit
    }).getValue();

    submission.requirements.push(submissionRequirement);

    const savedResult = await submissionRepository.save(submission);

    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }

    return right(
      Result.ok<ISubmissionRequirement>(await submissionRequirementMapperDTO.getFromModel(submissionRequirement))
    );
  }
}

export const createSubmissionRequirementUseCase = new CreateSubmissionRequirementUseCase();

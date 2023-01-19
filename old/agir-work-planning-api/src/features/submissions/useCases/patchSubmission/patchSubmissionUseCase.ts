import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import { isNil } from 'lodash';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { Audit } from '../../../audit/audit';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { ProgressHistoryItem } from '../../models/progressHistoryItem';
import { StatusHistoryItem } from '../../models/statusHistoryItem';
import { Submission } from '../../models/submission';
import { submissionRepository } from '../../mongo/submissionRepository';
import { SubmissionValidator } from '../../validators/submissionValidator';
import { ISubmissionPatchRequestProps, SubmissionPatchRequest } from './submissionPatchRequest';

export class PatchSubmissionUseCase extends UseCase<ISubmissionPatchRequestProps, ISubmission> {
  public async execute(req: ISubmissionPatchRequestProps): Promise<Response<ISubmission>> {
    const [submissionPatchRequestResult, taxonomyResult] = await Promise.all([
      SubmissionPatchRequest.create(req),
      SubmissionValidator.validatePatchAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([submissionPatchRequestResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const submissionPatchRequest = submissionPatchRequestResult.getValue();

    // Check for specific permissions
    const permissionsResult = SubmissionValidator.validatePatchPermissions(submissionPatchRequest);
    if (permissionsResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(permissionsResult)));
    }

    const currentSubmission = await submissionRepository.findById(submissionPatchRequest.submissionNumber);
    if (!currentSubmission) {
      return left(new NotFoundError(`Submission with id ${submissionPatchRequest.submissionNumber} was not found`));
    }
    const restrictionResult = await SubmissionValidator.validateProjectIdsRestrictions(currentSubmission.projectIds);
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }

    const businessRulesResult = await SubmissionValidator.validatePatchBusinessRules(
      currentSubmission,
      submissionPatchRequest
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const progressHistory: ProgressHistoryItem[] = currentSubmission.progressHistory;
    if (
      !isNil(submissionPatchRequest.progressStatus) &&
      submissionPatchRequest.progressStatus !== currentSubmission.progressStatus
    ) {
      const progressItem = ProgressHistoryItem.create({
        progressStatus: submissionPatchRequest.progressStatus,
        audit: Audit.create({
          createdAt: submissionPatchRequest.progressStatusChangeDate.toISOString(),
          createdBy: Audit.getAuthor()
        }).getValue()
      }).getValue();
      progressHistory.push(progressItem);
    }

    if (submissionPatchRequest.status) {
      const statusItem = StatusHistoryItem.create({
        status: submissionPatchRequest.status,
        comment: submissionPatchRequest.comment,
        createdAt: MomentUtils.now().toISOString(),
        createdBy: Audit.getAuthor()
      }).getValue();
      currentSubmission.addStatusHistory(statusItem);
    }

    const submissionResult = Submission.create({
      submissionNumber: currentSubmission.submissionNumber,
      drmNumber: currentSubmission.drmNumber,
      projectIds: currentSubmission.projectIds,
      documents: currentSubmission.documents,
      requirements: currentSubmission.requirements,
      programBookId: currentSubmission.programBookId,
      status: submissionPatchRequest.status || currentSubmission.status,
      progressStatus: submissionPatchRequest.progressStatus || currentSubmission.progressStatus,
      progressHistory,
      statusHistory: currentSubmission.statusHistory,
      audit: Audit.fromUpdateContext(currentSubmission.audit)
    });

    if (submissionResult.isFailure) {
      return left(new UnexpectedError(submissionResult.errorValue()));
    }

    const savedResult = await submissionRepository.save(submissionResult.getValue());
    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }
    return right(Result.ok<ISubmission>(await submissionMapperDTO.getFromModel(savedResult.getValue())));
  }
}

export const patchSubmissionUseCase = new PatchSubmissionUseCase();

import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IUpdateDocumentCommandProps,
  UpdateDocumentCommand
} from '../../../../documents/useCases/updateDocument/updateDocumentCommand';
import { UpdateDocumentUseCase } from '../../../../documents/useCases/updateDocument/updateDocumentUseCase';
import { ISubmissionRepository } from '../../../iSubmissionRepository';
import { Submission } from '../../../models/submission';
import { submissionRepository } from '../../../mongo/submissionRepository';
import { SubmissionValidator } from '../../../validators/submissionValidator';

export class UpdateDocumentSubmissionUseCase extends UpdateDocumentUseCase<Submission> {
  protected entityRepository: ISubmissionRepository = submissionRepository;

  protected createCommand(
    req: IUpdateDocumentCommandProps
  ): Result<UpdateDocumentCommand<IUpdateDocumentCommandProps>> {
    return UpdateDocumentCommand.create(req, GuardType.VALID_SUBMISSION_NUMBER);
  }

  protected async validateBusinessRules(submission: Submission): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateDocumentsBusinessRules(submission);
  }
  protected async validateRestrictions(submission: Submission): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateProjectIdsRestrictions(submission.projectIds);
  }
}

export const updateDocumentSubmissionUseCase = new UpdateDocumentSubmissionUseCase();

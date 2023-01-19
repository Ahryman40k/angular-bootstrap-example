import { GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  DeleteDocumentCommand,
  IDeleteDocumentCommandProps
} from '../../../../documents/useCases/deleteDocument/deleteDocumentCommand';
import { DeleteDocumentUseCase } from '../../../../documents/useCases/deleteDocument/deleteDocumentUseCase';
import { ISubmissionRepository } from '../../../iSubmissionRepository';
import { Submission } from '../../../models/submission';
import { submissionRepository } from '../../../mongo/submissionRepository';
import { SubmissionValidator } from '../../../validators/submissionValidator';

export class DeleteDocumentFromSubmissionUseCase extends DeleteDocumentUseCase<Submission> {
  protected entityRepository: ISubmissionRepository = submissionRepository;
  protected createCommand(req: IDeleteDocumentCommandProps): Result<DeleteDocumentCommand> {
    return DeleteDocumentCommand.create(req, GuardType.VALID_SUBMISSION_NUMBER);
  }

  protected async validateBusinessRules(submission: Submission): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateDocumentsBusinessRules(submission);
  }
  protected async validateRestrictions(submission: Submission): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateProjectIdsRestrictions(submission.projectIds);
  }
}

export const deleteDocumentFromSubmissionUseCase = new DeleteDocumentFromSubmissionUseCase();

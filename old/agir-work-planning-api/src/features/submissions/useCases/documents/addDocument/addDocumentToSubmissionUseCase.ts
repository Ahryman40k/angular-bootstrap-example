import { IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { IUploadFileResult } from '../../../../../shared/storage/iStorageService';
import { Document } from '../../../../documents/models/document';
import { AddDocumentUseCase } from '../../../../documents/useCases/addDocument/addDocumentUseCase';
import { ISubmissionRepository } from '../../../iSubmissionRepository';
import { Submission } from '../../../models/submission';
import { submissionRepository } from '../../../mongo/submissionRepository';
import { SubmissionValidator } from '../../../validators/submissionValidator';
import { AddDocumentToSubmissionCommand, IAddDocumentToSubmissionCommandProps } from './addDocumentToSubmissionCommand';

export class AddDocumentToSubmissionUseCase extends AddDocumentUseCase<Submission> {
  protected entityRepository: ISubmissionRepository = submissionRepository;

  protected createCommand(req: IAddDocumentToSubmissionCommandProps): Result<AddDocumentToSubmissionCommand> {
    return AddDocumentToSubmissionCommand.create(req);
  }

  protected createDocument(
    addDocumentCmd: AddDocumentToSubmissionCommand,
    uploadedFile: IUploadFileResult
  ): Result<Document> {
    return Document.create({
      ...this.toDocumentProps(addDocumentCmd, uploadedFile)
    });
  }

  protected async validateBusinessRules(submission: Submission): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateDocumentsBusinessRules(submission);
  }
  protected async validateRestrictions(submission: Submission): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateProjectIdsRestrictions(submission.projectIds);
  }
}

export const addDocumentToSubmissionUseCase = new AddDocumentToSubmissionUseCase();

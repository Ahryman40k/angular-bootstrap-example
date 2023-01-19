import { ISubmission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { GuardType } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  GetDocumentByIdCommand,
  IGetDocumentByIdCommandProps
} from '../../../../documents/useCases/getDocumentById/getDocumentByIdCommand';
import { GetDocumentByIdUseCase } from '../../../../documents/useCases/getDocumentById/getDocumentByIdUseCase';
import { ISubmissionRepository } from '../../../iSubmissionRepository';
import { submissionRepository } from '../../../mongo/submissionRepository';

export class GetSubmissionDocumentByIdUseCase extends GetDocumentByIdUseCase<ISubmission> {
  protected entityRepository: ISubmissionRepository = submissionRepository;
  protected createCommand(
    req: IGetDocumentByIdCommandProps
  ): Result<GetDocumentByIdCommand<IGetDocumentByIdCommandProps>> {
    return GetDocumentByIdCommand.create(req, GuardType.VALID_SUBMISSION_NUMBER);
  }
}

export const getSubmissionDocumentByIdUseCase = new GetSubmissionDocumentByIdUseCase();

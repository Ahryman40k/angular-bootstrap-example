import * as autobind from 'autobind-decorator';
import { UploadRequest } from '../../../../../models/requests';
import { IUpdateDocumentCommandProps } from '../../../../documents/useCases/updateDocument/updateDocumentCommand';
import { UpdateDocumentController } from '../../../../documents/useCases/updateDocument/updateDocumentController';
import { Submission } from '../../../models/submission';
import { UpdateDocumentSubmissionUseCase, updateDocumentSubmissionUseCase } from './updateDocumentSubmissionUseCase';

@autobind
export class UpdateDocumentSubmissionController extends UpdateDocumentController<Submission> {
  protected useCase: UpdateDocumentSubmissionUseCase = updateDocumentSubmissionUseCase;

  protected reqToInput(req: UploadRequest): IUpdateDocumentCommandProps {
    return {
      ...super.reqToInput(req),
      id: req.params.submissionNumber
    };
  }
}

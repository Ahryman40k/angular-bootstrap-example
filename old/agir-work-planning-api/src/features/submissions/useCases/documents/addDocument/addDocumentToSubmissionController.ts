import * as autobind from 'autobind-decorator';
import { UploadRequest } from '../../../../../models/requests';
import { IAddDocumentCommandProps } from '../../../../documents/useCases/addDocument/addDocumentCommand';
import { AddDocumentController } from '../../../../documents/useCases/addDocument/addDocumentController';
import { Submission } from '../../../models/submission';
import { AddDocumentToSubmissionUseCase, addDocumentToSubmissionUseCase } from './addDocumentToSubmissionUseCase';

@autobind
export class AddDocumentToSubmissionController extends AddDocumentController<Submission> {
  protected useCase: AddDocumentToSubmissionUseCase = addDocumentToSubmissionUseCase;

  protected reqToInput(req: UploadRequest): IAddDocumentCommandProps {
    return {
      ...super.reqToInput(req),
      id: req.params.submissionNumber
    };
  }
}

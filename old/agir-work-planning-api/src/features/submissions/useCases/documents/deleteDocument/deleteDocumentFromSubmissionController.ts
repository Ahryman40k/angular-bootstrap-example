import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { IDeleteDocumentCommandProps } from '../../../../documents/useCases/deleteDocument/deleteDocumentCommand';
import { DeleteDocumentController } from '../../../../documents/useCases/deleteDocument/deleteDocumentController';
import { Submission } from '../../../models/submission';
import {
  DeleteDocumentFromSubmissionUseCase,
  deleteDocumentFromSubmissionUseCase
} from './deleteDocumentFromSubmissionUseCase';

@autobind
export class DeleteDocumentFromSubmissionController extends DeleteDocumentController<Submission> {
  protected useCase: DeleteDocumentFromSubmissionUseCase = deleteDocumentFromSubmissionUseCase;

  protected reqToInput(req: express.Request): IDeleteDocumentCommandProps {
    return {
      ...super.reqToInput(req),
      id: req.params.submissionNumber
    };
  }
}

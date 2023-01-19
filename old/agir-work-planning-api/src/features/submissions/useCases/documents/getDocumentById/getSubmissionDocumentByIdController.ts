import { ISubmission } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { IGetDocumentByIdCommandProps } from '../../../../documents/useCases/getDocumentById/getDocumentByIdCommand';
import { GetDocumentByIdController } from '../../../../documents/useCases/getDocumentById/getDocumentByIdController';
import { GetSubmissionDocumentByIdUseCase, getSubmissionDocumentByIdUseCase } from './getSubmissionDocumentByIdUseCase';

@autobind
export class GetSubmissionDocumentByIdController extends GetDocumentByIdController<ISubmission> {
  protected useCase: GetSubmissionDocumentByIdUseCase = getSubmissionDocumentByIdUseCase;

  protected reqToInput(req: express.Request): IGetDocumentByIdCommandProps {
    return {
      ...super.reqToInput(req),
      id: req.params.submissionNumber
    };
  }
}

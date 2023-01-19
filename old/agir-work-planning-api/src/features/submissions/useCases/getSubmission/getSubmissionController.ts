import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { Submission } from '../../models/submission';
import { SubmissionFindOptions } from '../../models/submissionFindOptions';
import { getSubmissionUseCase, GetSubmissionUseCase } from './getSubmissionUseCase';

@autobind
export class GetSubmissionController extends GetByIdController<Submission, ISubmission, SubmissionFindOptions> {
  protected useCase: GetSubmissionUseCase = getSubmissionUseCase;

  protected reqToInput(req: express.Request): IByIdCommandProps {
    return {
      id: req.params.submissionNumber,
      expand: req.query.expand
    };
  }
}

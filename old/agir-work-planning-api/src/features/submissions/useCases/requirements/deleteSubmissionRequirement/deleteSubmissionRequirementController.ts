import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { DeleteController } from '../../../../../shared/controllers/deleteController';
import { SubmissionRequirement } from '../../../models/requirements/submissionRequirement';
import {
  DeleteSubmissionRequirementUseCase,
  deleteSubmissionRequirementUseCase
} from './deleteSubmissionRequirementUseCase';
import { ISubmissionDeleteRequirementRequestProps } from './submissionRequirementDeleteRequest';

@autobind
export class DeleteSubmissionRequirementController extends DeleteController<
  SubmissionRequirement,
  ISubmissionDeleteRequirementRequestProps
> {
  protected readonly useCase: DeleteSubmissionRequirementUseCase = deleteSubmissionRequirementUseCase;

  protected reqToInput(req: express.Request): ISubmissionDeleteRequirementRequestProps {
    return {
      submissionNumber: req.params.submissionNumber,
      id: req.params.id
    };
  }
}

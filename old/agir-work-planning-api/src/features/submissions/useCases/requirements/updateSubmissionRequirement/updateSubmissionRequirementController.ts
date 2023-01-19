import { ISubmissionRequirement } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { UpdateController } from '../../../../../shared/controllers/updateController';
import { ISubmissionRequirementUpdateRequestProps } from './submissionRequirementUpdateRequest';
import {
  UpdateSubmissionRequirementUseCase,
  updateSubmissionRequirementUseCase
} from './updateSubmissionRequirementUseCase';

@autobind
export class UpdateSubmissionRequirementController extends UpdateController<
  ISubmissionRequirementUpdateRequestProps,
  ISubmissionRequirement
> {
  protected readonly useCase: UpdateSubmissionRequirementUseCase = updateSubmissionRequirementUseCase;
  protected success = this.created;

  protected reqToInput(req: express.Request): ISubmissionRequirementUpdateRequestProps {
    return {
      ...super.reqToInput(req),
      submissionNumber: req.params.submissionNumber
    };
  }
}

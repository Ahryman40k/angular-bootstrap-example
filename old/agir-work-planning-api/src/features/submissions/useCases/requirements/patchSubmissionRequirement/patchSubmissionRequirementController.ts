import { ISubmissionRequirement } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { UpdateController } from '../../../../../shared/controllers/updateController';
import {
  PatchSubmissionRequirementUseCase,
  patchSubmissionRequirementUseCase
} from './patchSubmissionRequirementUseCase';
import { ISubmissionRequirementPatchRequestProps } from './submissionRequirementPatchRequest';

@autobind
export class PatchSubmissionRequirementController extends UpdateController<
  ISubmissionRequirementPatchRequestProps,
  ISubmissionRequirement
> {
  protected readonly useCase: PatchSubmissionRequirementUseCase = patchSubmissionRequirementUseCase;
  protected success = this.created;

  protected reqToInput(req: express.Request): ISubmissionRequirementPatchRequestProps {
    return {
      ...super.reqToInput(req),
      submissionNumber: req.params.submissionNumber
    };
  }
}

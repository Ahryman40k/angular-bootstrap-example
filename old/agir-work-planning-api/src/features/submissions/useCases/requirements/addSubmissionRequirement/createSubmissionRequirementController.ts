import { ISubmissionRequirement, ISubmissionRequirementRequest } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { CreateController } from '../../../../../shared/controllers/createController';
import {
  CreateSubmissionRequirementUseCase,
  createSubmissionRequirementUseCase
} from './createSubmissionRequirementUseCase';
import { ISubmissionRequirementCreateRequestProps } from './submissionRequirementCreateRequest';

@autobind
export class CreateSubmissionRequirementController extends CreateController<
  ISubmissionRequirementRequest,
  ISubmissionRequirement
> {
  protected readonly useCase: CreateSubmissionRequirementUseCase = createSubmissionRequirementUseCase;

  protected reqToInput(req: express.Request): ISubmissionRequirementCreateRequestProps {
    return {
      ...req.body,
      submissionNumber: req.params.submissionNumber
    };
  }
}

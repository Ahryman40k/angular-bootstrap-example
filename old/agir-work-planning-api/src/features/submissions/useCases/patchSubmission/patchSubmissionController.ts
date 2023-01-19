import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { patchSubmissionUseCase, PatchSubmissionUseCase } from './patchSubmissionUseCase';
import { ISubmissionPatchRequestProps } from './submissionPatchRequest';

@autobind
export class PatchSubmissionController extends UseCaseController<ISubmissionPatchRequestProps, ISubmission> {
  protected readonly useCase: PatchSubmissionUseCase = patchSubmissionUseCase;
  protected success = this.created;

  protected reqToInput(req: express.Request): ISubmissionPatchRequestProps {
    return {
      ...req.body,
      submissionNumber: req.params.submissionNumber
    };
  }
}

import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { UseCaseController } from '../../../../shared/useCaseController';
import { IProjectSubmissionProps } from '../../models/projectSubmissionCommand';
import { ProjectSubmissionUseCase } from './projectSubmissionUseCase';

@autobind
export abstract class ProjectSubmissionController extends UseCaseController<IProjectSubmissionProps, ISubmission> {
  protected abstract readonly useCase: ProjectSubmissionUseCase;
  protected reqToInput(req: express.Request): IProjectSubmissionProps {
    return {
      submissionNumber: req.params.submissionNumber,
      projectId: req.params.id
    };
  }
}

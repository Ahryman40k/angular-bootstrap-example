import { ISubmission } from '@villemontreal/agir-work-planning-lib';

import * as autobind from 'autobind-decorator';
import { CreateController } from '../../../../shared/controllers/createController';
import { ISubmissionCreateRequestProps } from '../../models/submissionCreateRequest';
import { CreateSubmissionUseCase, createSubmissionUseCase } from './createSubmissionUseCase';

@autobind
export class CreateSubmissionController extends CreateController<ISubmissionCreateRequestProps, ISubmission> {
  protected readonly useCase: CreateSubmissionUseCase = createSubmissionUseCase;
}

import * as autobind from 'autobind-decorator';
import { ProjectSubmissionController } from '../projectSubmissionController';
import { addProjectToSubmissionUseCase, AddProjectToSubmissionUseCase } from './addProjectToSubmissionUseCase';

@autobind
export class AddProjectToSubmissionController extends ProjectSubmissionController {
  protected readonly useCase: AddProjectToSubmissionUseCase = addProjectToSubmissionUseCase;
}

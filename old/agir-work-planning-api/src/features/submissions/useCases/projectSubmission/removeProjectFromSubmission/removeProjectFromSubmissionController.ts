import * as autobind from 'autobind-decorator';
import { ProjectSubmissionController } from '../projectSubmissionController';
import {
  removeProjectFromSubmissionUseCase,
  RemoveProjectFromSubmissionUseCase
} from './removeProjectFromSubmissionUseCase';

@autobind
export class RemoveProjectFromSubmissionController extends ProjectSubmissionController {
  protected readonly useCase: RemoveProjectFromSubmissionUseCase = removeProjectFromSubmissionUseCase;
}

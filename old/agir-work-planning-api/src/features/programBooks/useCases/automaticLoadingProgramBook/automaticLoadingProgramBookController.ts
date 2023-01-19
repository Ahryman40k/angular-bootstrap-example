import * as autobind from 'autobind-decorator';
import { ByIdController } from '../../../../shared/controllers/byIdController';
import {
  AutomaticLoadingProgramBookUseCase,
  automaticLoadingProgramBookUseCase
} from './automaticLoadingProgramBookUseCase';

@autobind
export class AutomaticLoadingProgramBookController extends ByIdController<void> {
  protected readonly useCase: AutomaticLoadingProgramBookUseCase = automaticLoadingProgramBookUseCase;
  protected success = this.accepted;
}

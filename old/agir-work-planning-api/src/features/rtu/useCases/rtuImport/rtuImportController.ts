import * as autobind from 'autobind-decorator';
import { TriggerController } from '../../../../shared/controllers/triggerController';
import { rtuImportUseCase, RtuImportUseCase } from './rtuImportUseCase';

@autobind
export class RtuImportController extends TriggerController {
  protected readonly useCase: RtuImportUseCase = rtuImportUseCase;
}

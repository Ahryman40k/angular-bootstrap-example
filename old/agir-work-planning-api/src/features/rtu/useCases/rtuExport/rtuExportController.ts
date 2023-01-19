import * as autobind from 'autobind-decorator';
import { TriggerController } from '../../../../shared/controllers/triggerController';
import { rtuExportUseCase, RtuExportUseCase } from './rtuExportUseCase';

@autobind
export class RtuExportController extends TriggerController {
  protected readonly useCase: RtuExportUseCase = rtuExportUseCase;
}

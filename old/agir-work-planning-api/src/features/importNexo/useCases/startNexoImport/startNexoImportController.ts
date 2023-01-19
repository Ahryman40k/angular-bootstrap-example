import * as autobind from 'autobind-decorator';
import { ByIdController } from '../../../../shared/controllers/byIdController';
import { StartNexoImportUseCase, startNexoImportUseCase } from './startNexoImportUseCase';

@autobind
export class StartNexoImportController extends ByIdController<void> {
  protected readonly useCase: StartNexoImportUseCase = startNexoImportUseCase;
  protected readonly success = this.accepted;
}

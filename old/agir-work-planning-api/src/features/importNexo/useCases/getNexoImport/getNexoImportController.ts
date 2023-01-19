import { INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { NexoImportLog } from '../../models/nexoImportLog';
import { NexoImportLogFindOptions } from '../../models/nexoImportLogFindOptions';
import { getNexoImportUseCase, GetNexoImportUseCase } from './getNexoImportUseCase';

@autobind
export class GetNexoImportController extends GetByIdController<
  NexoImportLog,
  INexoImportLog,
  NexoImportLogFindOptions
> {
  protected useCase: GetNexoImportUseCase = getNexoImportUseCase;
}

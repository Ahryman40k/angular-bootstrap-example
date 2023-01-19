import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { RtuImportLog } from '../../models/rtuImportLog';
import { RtuImportLogFindOptions } from '../../models/rtuImportLogFindOptions';
import { getRtuImportLogUseCase, GetRtuImportLogUseCase } from './getRtuImportLogUseCase';

@autobind
export class GetRtuImportLogController extends GetByIdController<RtuImportLog, IRtuImportLog, RtuImportLogFindOptions> {
  protected useCase: GetRtuImportLogUseCase = getRtuImportLogUseCase;
}

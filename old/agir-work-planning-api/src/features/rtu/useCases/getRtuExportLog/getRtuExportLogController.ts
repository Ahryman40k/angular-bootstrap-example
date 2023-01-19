import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { RtuExportLog } from '../../models/rtuExportLog';
import { RtuExportLogFindOptions } from '../../models/rtuExportLogFindOptions';
import { getRtuExportLogUseCase, GetRtuExportLogUseCase } from './getRtuExportLogUseCase';

@autobind
export class GetRtuExportLogController extends GetByIdController<RtuExportLog, IRtuExportLog, RtuExportLogFindOptions> {
  protected useCase: GetRtuExportLogUseCase = getRtuExportLogUseCase;
}

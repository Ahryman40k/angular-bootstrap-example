import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { GetByUuidUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByUuidUseCase';
import { rtuExportLogMapperDTO } from '../../mappers/rtuExportLogMapperDTO';
import { RtuExportLog } from '../../models/rtuExportLog';
import { RtuExportLogFindOptions } from '../../models/rtuExportLogFindOptions';
import { IRtuExportLogRepository, rtuExportLogRepository } from '../../mongo/rtuExportLogRepository';

export class GetRtuExportLogUseCase extends GetByUuidUseCase<RtuExportLog, IRtuExportLog, RtuExportLogFindOptions> {
  protected entityRepository: IRtuExportLogRepository = rtuExportLogRepository;
  protected mapper = rtuExportLogMapperDTO;
}

export const getRtuExportLogUseCase = new GetRtuExportLogUseCase();

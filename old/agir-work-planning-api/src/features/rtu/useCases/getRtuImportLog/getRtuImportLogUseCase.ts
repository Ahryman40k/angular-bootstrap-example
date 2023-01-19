import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { GetByUuidUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByUuidUseCase';
import { rtuImportLogMapperDTO } from '../../mappers/rtuImportLogMapperDTO';
import { RtuImportLog } from '../../models/rtuImportLog';
import { RtuImportLogFindOptions } from '../../models/rtuImportLogFindOptions';
import { IRtuImportLogRepository, rtuImportLogRepository } from '../../mongo/rtuImportLogRepository';

export class GetRtuImportLogUseCase extends GetByUuidUseCase<RtuImportLog, IRtuImportLog, RtuImportLogFindOptions> {
  protected entityRepository: IRtuImportLogRepository = rtuImportLogRepository;
  protected mapper = rtuImportLogMapperDTO;
}

export const getRtuImportLogUseCase = new GetRtuImportLogUseCase();

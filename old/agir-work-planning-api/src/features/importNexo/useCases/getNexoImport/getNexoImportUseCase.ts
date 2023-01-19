import { INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ByUuidCommand } from '../../../../shared/domain/useCases/byUuidCommand';
import { GetByUuidUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByUuidUseCase';
import { Result } from '../../../../shared/logic/result';
import { INexoImportLogRepository } from '../../iNexoImportLogRepository';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportLog } from '../../models/nexoImportLog';
import { NexoImportLogFindOptions } from '../../models/nexoImportLogFindOptions';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';

export class GetNexoImportUseCase extends GetByUuidUseCase<NexoImportLog, INexoImportLog, NexoImportLogFindOptions> {
  protected entityRepository: INexoImportLogRepository = nexoImportLogRepository;
  protected mapper = nexoImportLogMapperDTO;

  protected getFindOptions(byIdCmd: ByUuidCommand): Result<NexoImportLogFindOptions> {
    return NexoImportLogFindOptions.create({
      criterias: {
        id: byIdCmd.id
      },
      expand: byIdCmd.expand
    });
  }
}

export const getNexoImportUseCase = new GetNexoImportUseCase();

import { INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { Result } from '../../../../shared/logic/result';
import { INexoImportLogRepository } from '../../iNexoImportLogRepository';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportLog } from '../../models/nexoImportLog';
import { INexoImportLogPaginatedFindOptionsProps, NexoImportSearchOptions } from '../../models/nexoImportSearchOptions';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
export class SearchNexoImportUseCase extends SearchUseCase<
  NexoImportLog,
  INexoImportLog,
  INexoImportLogPaginatedFindOptionsProps
> {
  protected entityRepository: INexoImportLogRepository = nexoImportLogRepository;
  protected mapper = nexoImportLogMapperDTO;

  protected createCommand(req: INexoImportLogPaginatedFindOptionsProps): Result<NexoImportSearchOptions> {
    return NexoImportSearchOptions.create(req);
  }
}

export const searchNexoImportUseCase = new SearchNexoImportUseCase();

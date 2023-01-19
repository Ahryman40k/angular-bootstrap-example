import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { FindPaginated } from '../../../../shared/findOptions/findPaginated';
import { Result } from '../../../../shared/logic/result';
import { IBicImportLogRepository } from '../../iBicImportLogRepository';
import { bicImportLogMapperDTO } from '../../mappers/bicImportLogMapperDTO';
import { BicImportLog } from '../../models/bicImportLog';
import {
  BicImportLogFindPaginatedOptions,
  IBicImportLogPaginatedFindOptionsProps
} from '../../models/bicImportLogFindPaginatedOptions';
import { bicImportLogRepository } from '../../mongo/bicImportLogRepository';

export class SearchBicImportLogsUseCase extends SearchUseCase<
  BicImportLog,
  IBicImportLog,
  IBicImportLogPaginatedFindOptionsProps
> {
  protected entityRepository: IBicImportLogRepository = bicImportLogRepository;
  protected mapper = bicImportLogMapperDTO;

  protected createCommand(
    req: IBicImportLogPaginatedFindOptionsProps
  ): Result<FindPaginated<IBicImportLogPaginatedFindOptionsProps>> {
    return BicImportLogFindPaginatedOptions.create(req);
  }
}

export const searchBicImportLogsUseCase = new SearchBicImportLogsUseCase();

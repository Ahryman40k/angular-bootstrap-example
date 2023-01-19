import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { Result } from '../../../../shared/logic/result';
import { IRtuExportMapperOptions, rtuExportLogMapperDTO } from '../../mappers/rtuExportLogMapperDTO';
import { RtuExportLog } from '../../models/rtuExportLog';
import {
  IRtuExportLogsPaginatedFindOptionsProps,
  RtuExportLogFindPaginatedOptions
} from '../../models/rtuExportLogFindPaginatedOptions';
import { IRtuExportLogRepository, rtuExportLogRepository } from '../../mongo/rtuExportLogRepository';
export class SearchRtuExportLogsUseCase extends SearchUseCase<
  RtuExportLog,
  IRtuExportLog,
  IRtuExportLogsPaginatedFindOptionsProps
> {
  protected entityRepository: IRtuExportLogRepository = rtuExportLogRepository;
  protected mapper = rtuExportLogMapperDTO;

  protected createCommand(req: IRtuExportLogsPaginatedFindOptionsProps): Result<RtuExportLogFindPaginatedOptions> {
    return RtuExportLogFindPaginatedOptions.create(req);
  }

  protected getMapperOptions(findOptions: RtuExportLogFindPaginatedOptions): IRtuExportMapperOptions {
    let fields: string[];
    if (!isEmpty(findOptions.fields)) {
      if (findOptions.fields.includes('errorDetail')) {
        findOptions.fields[findOptions.fields.indexOf('errorDetail')] = 'errorDescription';
      }
      fields = findOptions.fields;
    }
    return {
      ...super.getMapperOptions(findOptions),
      fields
    };
  }
}

export const searchRtuExportLogsUseCase = new SearchRtuExportLogsUseCase();

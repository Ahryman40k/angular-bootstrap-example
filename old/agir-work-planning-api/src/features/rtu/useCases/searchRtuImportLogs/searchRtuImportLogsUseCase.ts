import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { Result } from '../../../../shared/logic/result';
import { IRtuImportMapperOptions, rtuImportLogMapperDTO } from '../../mappers/rtuImportLogMapperDTO';
import { RtuImportLog } from '../../models/rtuImportLog';
import {
  IRtuImportLogsPaginatedFindOptionsProps,
  RtuImportLogFindPaginatedOptions
} from '../../models/rtuImportLogFindPaginatedOptions';
import { IRtuImportLogRepository, rtuImportLogRepository } from '../../mongo/rtuImportLogRepository';
export class SearchRtuImportLogsUseCase extends SearchUseCase<
  RtuImportLog,
  IRtuImportLog,
  IRtuImportLogsPaginatedFindOptionsProps
> {
  protected entityRepository: IRtuImportLogRepository = rtuImportLogRepository;
  protected mapper = rtuImportLogMapperDTO;

  protected createCommand(req: IRtuImportLogsPaginatedFindOptionsProps): Result<RtuImportLogFindPaginatedOptions> {
    return RtuImportLogFindPaginatedOptions.create(req);
  }

  protected getMapperOptions(findOptions: RtuImportLogFindPaginatedOptions): IRtuImportMapperOptions {
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

export const searchRtuImportLogsUseCase = new SearchRtuImportLogsUseCase();

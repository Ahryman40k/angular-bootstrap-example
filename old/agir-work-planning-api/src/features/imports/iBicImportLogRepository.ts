import { IBaseRepository } from '../../repositories/core/baseRepository';
import { BicImportLog } from './models/bicImportLog';
import { BicImportLogFindPaginatedOptions } from './models/bicImportLogFindPaginatedOptions';

export interface IBicImportLogRepository extends IBaseRepository<BicImportLog, BicImportLogFindPaginatedOptions> {}

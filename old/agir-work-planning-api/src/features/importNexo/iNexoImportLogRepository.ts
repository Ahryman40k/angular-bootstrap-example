import { IBaseRepository } from '../../repositories/core/baseRepository';
import { NexoImportLog } from './models/nexoImportLog';
import { NexoImportLogFindOptions } from './models/nexoImportLogFindOptions';

// tslint:disable:no-empty-interface
export interface INexoImportLogRepository extends IBaseRepository<NexoImportLog, NexoImportLogFindOptions> {}

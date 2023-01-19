import { NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

import { NexoImportLog } from '../models/nexoImportLog';
import { INexoImportLogCriterias, NexoImportLogFindOptions } from '../models/nexoImportLogFindOptions';
import { nexoImportLogRepository } from '../mongo/nexoImportLogRepository';

export class NexoImportLogValidator {
  public static async importAlreadyRunning(id?: string): Promise<NexoImportLog> {
    const criterias: INexoImportLogCriterias = {
      status: [NexoImportStatus.PENDING, NexoImportStatus.IN_PROGRESS]
    };
    if (id) {
      criterias.excludeIds = [id];
    }
    return nexoImportLogRepository.findOne(
      NexoImportLogFindOptions.create({
        criterias
      }).getValue()
    );
  }
}

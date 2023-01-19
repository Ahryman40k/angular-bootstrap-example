import { BaseRepository } from '../../../repositories/core/baseRepository';
import { Audit } from '../../audit/audit';
import { INexoImportLogRepository } from '../iNexoImportLogRepository';
import { NexoImportFile } from '../models/nexoImportFile';
import { INexoImportLogProps, NexoImportLog } from '../models/nexoImportLog';
import { INexoImportLogCriterias, NexoImportLogFindOptions } from '../models/nexoImportLogFindOptions';
import { nexoImportMatchBuilder } from '../nexoImportMatchBuilder';
import { INexoImportLogMongoAttributes, INexoImportLogMongoDocument, NexoImportLogModel } from './nexoImportLogModel';

class NexoImportLogRepository
  extends BaseRepository<NexoImportLog, INexoImportLogMongoDocument, NexoImportLogFindOptions>
  implements INexoImportLogRepository {
  public get model(): NexoImportLogModel {
    return this.db.models.NexoImportLog;
  }

  protected async getMatchFromQueryParams(criterias: INexoImportLogCriterias): Promise<any> {
    return nexoImportMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected async toDomainModel(raw: INexoImportLogMongoAttributes): Promise<NexoImportLog> {
    const files = await Promise.all(raw.files.map(file => NexoImportFile.toDomainModel(file)));
    const nexoImportProps: INexoImportLogProps = {
      status: raw.status,
      files,
      audit: await Audit.toDomainModel(raw.audit)
    };
    return NexoImportLog.create(nexoImportProps, raw._id.toString()).getValue();
  }

  protected toPersistence(nexoImportLog: NexoImportLog): INexoImportLogMongoAttributes {
    return {
      _id: nexoImportLog.id,
      files: nexoImportLog.files.map(file => NexoImportFile.toPersistance(file)),
      status: nexoImportLog.status,
      audit: Audit.toPersistance(nexoImportLog.audit)
    };
  }
}

export const nexoImportLogRepository: INexoImportLogRepository = new NexoImportLogRepository();

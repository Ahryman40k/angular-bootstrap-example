import { IAudit, INexoImportFile, INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { NexoImportLog } from '../models/nexoImportLog';
import { nexoImportFileMapperDTO } from './nexoImportFileMapperDTO';

class NexoImportLogMapperDTO extends FromModelToDtoMappings<NexoImportLog, INexoImportLog, void> {
  protected async getFromNotNullModel(nexoImportLog: NexoImportLog): Promise<INexoImportLog> {
    const [filesDTO, auditDTO] = await Promise.all([
      nexoImportFileMapperDTO.getFromModels(nexoImportLog.files),
      auditMapperDTO.getFromModel(nexoImportLog.audit)
    ]);
    return this.map(nexoImportLog, filesDTO, auditDTO);
  }

  private map(nexoImportLog: NexoImportLog, filesDTO: INexoImportFile[], auditDTO: IAudit): INexoImportLog {
    return {
      id: nexoImportLog.id,
      status: nexoImportLog.status,
      files: filesDTO,
      audit: auditDTO
    };
  }
}

export const nexoImportLogMapperDTO = new NexoImportLogMapperDTO();

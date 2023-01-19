import { IAudit, IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { BicImportLog } from '../models/bicImportLog';

class BicImportLogMapperDTO extends FromModelToDtoMappings<BicImportLog, IBicImportLog, void> {
  protected async getFromNotNullModel(bicImportLogs: BicImportLog): Promise<IBicImportLog> {
    const auditDTO = await auditMapperDTO.getFromModel(bicImportLogs.audit);
    return this.map(bicImportLogs, auditDTO);
  }

  private map(bicImportLogs: BicImportLog, auditDTO: IAudit): IBicImportLog {
    return {
      id: bicImportLogs.id,
      audit: auditDTO
    };
  }
}

export const bicImportLogMapperDTO = new BicImportLogMapperDTO();

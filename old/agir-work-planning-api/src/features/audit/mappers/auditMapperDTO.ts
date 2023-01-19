import { IAudit, IAuthor } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { Audit } from '../audit';
import { authorMapperDTO } from './authorMapperDTO';

class AuditMapperDTO extends FromModelToDtoMappings<Audit, IAudit, void> {
  protected async getFromNotNullModel(audit: Audit): Promise<IAudit> {
    const [createdByDTO, lastModifiedByDTO, expiredByDTO] = await Promise.all([
      authorMapperDTO.getFromModel(audit.createdBy),
      authorMapperDTO.getFromModel(audit.lastModifiedBy),
      authorMapperDTO.getFromModel(audit.expiredBy)
    ]);
    return this.map(audit, createdByDTO, lastModifiedByDTO, expiredByDTO);
  }

  private map(audit: Audit, createdByDTO: IAuthor, lastModifiedByDTO: IAuthor, expiredByDTO: IAuthor) {
    return {
      createdAt: audit.createdAt,
      createdBy: createdByDTO,
      lastModifiedAt: audit.lastModifiedAt,
      lastModifiedBy: lastModifiedByDTO,
      expiredAt: audit.expiredAt,
      expiredBy: expiredByDTO
    };
  }
}

export const auditMapperDTO = new AuditMapperDTO();

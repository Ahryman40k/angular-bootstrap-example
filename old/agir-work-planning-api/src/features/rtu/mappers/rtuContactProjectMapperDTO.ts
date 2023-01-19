import { IRtuProjectContact } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { RtuContactProject } from '../models/rtuContactProject';

class RtuContactProjectMapperDTO extends FromModelToDtoMappings<RtuContactProject, IRtuProjectContact, void> {
  protected async getFromNotNullModel(rtuContactProject: RtuContactProject): Promise<IRtuProjectContact> {
    return this.map(rtuContactProject);
  }

  // For now it is a one/one but could be different
  private map(rtuContactProject: RtuContactProject): IRtuProjectContact {
    return {
      id: rtuContactProject.id,
      officeId: rtuContactProject.officeId,
      num: rtuContactProject.num,
      prefix: rtuContactProject.prefix,
      name: rtuContactProject.name,
      title: rtuContactProject.title,
      email: rtuContactProject.email,
      phone: rtuContactProject.phone,
      phoneExtensionNumber: rtuContactProject.phoneExtensionNumber,
      cell: rtuContactProject.cell,
      fax: rtuContactProject.fax,
      typeNotfc: rtuContactProject.typeNotfc,
      paget: rtuContactProject.paget,
      profile: rtuContactProject.profile,
      globalRole: rtuContactProject.globalRole,
      idInterim: rtuContactProject.idInterim,
      inAutoNotification: rtuContactProject.inAutoNotification,
      inDiffusion: rtuContactProject.inDiffusion,
      areaName: rtuContactProject.areaName,
      role: rtuContactProject.role,
      partnerType: rtuContactProject.partnerType,
      partnerId: rtuContactProject.partnerId
    };
  }
}

export const rtuContactProjectMapperDTO = new RtuContactProjectMapperDTO();

import { IAudit, IRtuProject, IRtuProjectContact } from '@villemontreal/agir-work-planning-lib/dist/src';

import { isEmpty, pick } from 'lodash';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { RtuProject } from '../models/rtuProject';
import { rtuContactProjectMapperDTO } from './rtuContactProjectMapperDTO';

export interface IRtuProjectMapperDTOOptions {
  fields: string[];
}

class RtuProjectMapperDTO extends FromModelToDtoMappings<RtuProject, IRtuProject, IRtuProjectMapperDTOOptions> {
  protected async getFromNotNullModel(
    rtuProject: RtuProject,
    options: IRtuProjectMapperDTOOptions
  ): Promise<IRtuProject> {
    const [contactDTO, auditDTO] = await Promise.all([
      rtuContactProjectMapperDTO.getFromModel(rtuProject.contact),
      auditMapperDTO.getFromModel(rtuProject.audit)
    ]);
    return this.map(rtuProject, contactDTO, auditDTO, options);
  }

  // For now it is a one/one but could be different
  private map(
    rtuProject: RtuProject,
    contactDTO: IRtuProjectContact,
    auditDTO: IAudit,
    options: IRtuProjectMapperDTOOptions
  ): IRtuProject {
    const mappedRtuProject = {
      id: rtuProject.id,
      name: rtuProject.name,
      description: rtuProject.description,
      areaId: rtuProject.areaId,
      partnerId: rtuProject.partnerId,
      noReference: rtuProject.noReference,
      geometryPin: rtuProject.geometryPin,
      geometry: rtuProject.geometry,
      status: rtuProject.status,
      type: rtuProject.type,
      phase: rtuProject.phase,
      dateStart: rtuProject.dateStart ? rtuProject.dateStart.toISOString() : undefined,
      dateEnd: rtuProject.dateEnd ? rtuProject.dateEnd.toISOString() : undefined,
      dateEntry: rtuProject.dateEntry ? rtuProject.dateEntry.toISOString() : undefined,
      dateModification: rtuProject.dateModification ? rtuProject.dateModification.toISOString() : undefined,
      cancellationReason: rtuProject.cancellationReason,
      productionPb: rtuProject.productionPb,
      conflict: rtuProject.conflict,
      duration: rtuProject.duration,
      localization: rtuProject.localization,
      streetName: rtuProject.streetName,
      streetFrom: rtuProject.streetFrom,
      streetTo: rtuProject.streetTo,
      contact: contactDTO,
      audit: auditDTO
    };
    if (!isEmpty(options?.fields)) {
      return pick(mappedRtuProject, ['id', ...options.fields]) as IRtuProject;
    }
    return mappedRtuProject;
  }
}

export const rtuProjectMapperDTO = new RtuProjectMapperDTO();

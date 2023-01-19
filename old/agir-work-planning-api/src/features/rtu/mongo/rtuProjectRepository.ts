import { isNil } from 'lodash';

import { BaseRepository, IBaseRepository } from '../../../repositories/core/baseRepository';
import { Audit } from '../../audit/audit';
import { RtuContactProject } from '../models/rtuContactProject';
import { RtuProject } from '../models/rtuProject';
import { IRtuProjectCriterias, RtuProjectFindOptions } from '../models/rtuProjectFindOptions';
import { rtuProjectMatchBuilder } from '../rtuProjectMatchBuilder';
import { IRtuProjectMongoAttributes, IRtuProjectMongoDocument, RtuProjectModel } from './rtuProjectModel';

const RTU_PROJECT_MANDATORY_FIELDS = [
  'name',
  'areaId',
  'partnerId',
  'noReference',
  'status',
  'type',
  'phase',
  'dateStart',
  'dateEnd',
  'dateEntry',
  'geometryPin'
];

// tslint:disable:no-empty-interface

export interface IRtuProjectRepository extends IBaseRepository<RtuProject, RtuProjectFindOptions> {}

class RtuProjectRepository extends BaseRepository<RtuProject, IRtuProjectMongoDocument, RtuProjectFindOptions>
  implements IRtuProjectRepository {
  public get model(): RtuProjectModel {
    return this.db.models.RtuProject;
  }

  protected async getMatchFromQueryParams(criterias: IRtuProjectCriterias): Promise<any> {
    return rtuProjectMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected async toDomainModel(raw: IRtuProjectMongoAttributes): Promise<RtuProject> {
    let contact: RtuContactProject;
    if (!isNil(raw.contact)) {
      contact = await RtuContactProject.toDomainModel(raw.contact);
    }
    return RtuProject.create(
      {
        name: raw.name,
        description: raw.description,
        areaId: raw.areaId,
        partnerId: raw.partnerId,
        noReference: raw.noReference,
        geometryPin: raw.geometryPin,
        geometry: raw.geometry,
        status: raw.status,
        type: raw.type,
        phase: raw.phase,
        dateStart: raw.dateStart,
        dateEnd: raw.dateEnd,
        dateEntry: raw.dateEntry,
        dateModification: raw.dateModification,
        cancellationReason: raw.cancellationReason,
        productionPb: raw.productionPb,
        conflict: raw.conflict,
        duration: raw.duration,
        localization: raw.localization,
        streetName: raw.streetName,
        streetFrom: raw.streetFrom,
        streetTo: raw.streetTo,
        contact,
        audit: await Audit.toDomainModel(raw.audit)
      },
      raw._id
    ).getValue();
  }

  protected toPersistence(rtuProject: RtuProject): IRtuProjectMongoAttributes {
    return {
      _id: rtuProject.id,
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
      dateStart: rtuProject.dateStart.toISOString(),
      dateEnd: rtuProject.dateEnd.toISOString(),
      dateEntry: rtuProject.dateEntry.toISOString(),
      dateModification: rtuProject.dateModification.toISOString(),
      cancellationReason: rtuProject.cancellationReason,
      productionPb: rtuProject.productionPb,
      conflict: rtuProject.conflict,
      duration: rtuProject.duration,
      localization: rtuProject.localization,
      streetName: rtuProject.streetName,
      streetFrom: rtuProject.streetFrom,
      streetTo: rtuProject.streetTo,
      contact: RtuContactProject.toPersistance(rtuProject.contact),
      audit: Audit.toPersistance(rtuProject.audit)
    };
  }

  // TODO how to not force mandatory fields ?
  protected getProjection(fields: string[]): any {
    return super.getProjection(fields, RTU_PROJECT_MANDATORY_FIELDS);
  }
}

export const rtuProjectRepository: IRtuProjectRepository = new RtuProjectRepository();

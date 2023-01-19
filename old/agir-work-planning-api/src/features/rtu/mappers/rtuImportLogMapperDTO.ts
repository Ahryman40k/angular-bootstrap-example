import { IAudit, IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { pick } from 'lodash';

import { FromModelToDtoMappings, IMapperOptions } from '../../../shared/mappers/fromModelToDtoMappings';
import { isEmpty } from '../../../utils/utils';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { RtuImportLog } from '../models/rtuImportLog';
import { rtuImportErrorMapperDTO } from './rtuImportErrorMapperDTO';
import { IRtuProjectError, rtuProjectErrorMapperDTO } from './rtuProjectErrorMapperDTO';

// tslint:disable:no-empty-interface
export interface IRtuImportMapperOptions extends IMapperOptions {}
class RtuImportLogMapperDTO extends FromModelToDtoMappings<RtuImportLog, IRtuImportLog, IRtuImportMapperOptions> {
  protected async getFromNotNullModel(
    rtuImportLog: RtuImportLog,
    options: IRtuImportMapperOptions
  ): Promise<IRtuImportLog> {
    const [auditDTO, errorDTO, failedProjectsDTO] = await Promise.all([
      auditMapperDTO.getFromModel(rtuImportLog.audit),
      rtuImportErrorMapperDTO.getFromModel(rtuImportLog.errorDetail),
      rtuProjectErrorMapperDTO.getFromModels(rtuImportLog.failedProjects)
    ]);
    return this.map(rtuImportLog, errorDTO, failedProjectsDTO, auditDTO, options);
  }

  // For now it is a one/one but could be different
  private map(
    rtuImportLog: RtuImportLog,
    errorDescriptionDTO: string,
    failedProjectsDTO: IRtuProjectError[],
    auditDTO: IAudit,
    options: IRtuImportMapperOptions
  ): IRtuImportLog {
    const fullReturn = {
      id: rtuImportLog.id,
      startDateTime: rtuImportLog.startDateTime ? rtuImportLog.startDateTime.toISOString() : undefined,
      endDateTime: rtuImportLog.endDateTime ? rtuImportLog.endDateTime.toISOString() : undefined,
      status: rtuImportLog.status,
      errorDescription: errorDescriptionDTO,
      failedProjects: failedProjectsDTO,
      audit: auditDTO
    };
    if (!isEmpty(options?.fields)) {
      if (!errorDescriptionDTO) {
        fullReturn.errorDescription = '';
      }
      return pick(fullReturn, ['id', ...options.fields]) as IRtuImportLog;
    }
    return fullReturn;
  }
}

export const rtuImportLogMapperDTO = new RtuImportLogMapperDTO();

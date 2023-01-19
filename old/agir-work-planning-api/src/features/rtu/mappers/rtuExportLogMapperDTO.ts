import { IAudit, IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { pick } from 'lodash';

import { FromModelToDtoMappings, IMapperOptions } from '../../../shared/mappers/fromModelToDtoMappings';
import { isEmpty } from '../../../utils/utils';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { RtuExportLog } from '../models/rtuExportLog';
import { rtuImportErrorMapperDTO } from './rtuImportErrorMapperDTO';
import { IRtuProjectExportSummary, rtuProjectExportSummaryMapperDTO } from './rtuProjectExportSummaryMapperDTO';

// tslint:disable:no-empty-interface
export interface IRtuExportMapperOptions extends IMapperOptions {}
class RtuExportLogMapperDTO extends FromModelToDtoMappings<RtuExportLog, IRtuExportLog, IRtuExportMapperOptions> {
  protected async getFromNotNullModel(
    rtuExportLog: RtuExportLog,
    options: IRtuExportMapperOptions
  ): Promise<IRtuExportLog> {
    const [auditDTO, errorDTO, projectsDTO] = await Promise.all([
      auditMapperDTO.getFromModel(rtuExportLog.audit),
      rtuImportErrorMapperDTO.getFromModel(rtuExportLog.errorDetail),
      rtuProjectExportSummaryMapperDTO.getFromModels(rtuExportLog.projects)
    ]);
    return this.map(rtuExportLog, errorDTO, projectsDTO, auditDTO, options);
  }

  // For now it is a one/one but could be different
  private map(
    rtuExportLog: RtuExportLog,
    errorDescriptionDTO: string,
    projectsDTO: IRtuProjectExportSummary[],
    auditDTO: IAudit,
    options: IRtuExportMapperOptions
  ): IRtuExportLog {
    const fullReturn = {
      id: rtuExportLog.id,
      startDateTime: rtuExportLog.startDateTime ? rtuExportLog.startDateTime.toISOString() : undefined,
      endDateTime: rtuExportLog.endDateTime ? rtuExportLog.endDateTime.toISOString() : undefined,
      status: rtuExportLog.status,
      errorDescription: errorDescriptionDTO,
      projects: projectsDTO,
      audit: auditDTO
    };
    if (!isEmpty(options?.fields)) {
      if (!errorDescriptionDTO) {
        fullReturn.errorDescription = '';
      }
      return pick(fullReturn, ['id', ...options.fields]) as IRtuExportLog;
    }
    return fullReturn;
  }
}

export const rtuExportLogMapperDTO = new RtuExportLogMapperDTO();

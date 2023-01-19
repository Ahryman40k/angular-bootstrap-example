import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { RtuProjectExportSummary } from '../models/rtuProjectExport/rtuProjectExportSummary';
import { rtuExportErrorMapperDTO } from './rtuExportErrorMapperDTO';

export interface IRtuProjectExportSummary {
  id: string;
  status: string;
  projectName: string;
  streetName: string;
  streetFrom: string;
  streetTo: string;
  errorDescriptions?: string[];
}

class RtuProjectExportSummaryMapperDTO extends FromModelToDtoMappings<
  RtuProjectExportSummary,
  IRtuProjectExportSummary,
  void
> {
  protected async getFromNotNullModel(
    rtuProjectExportSummary: RtuProjectExportSummary
  ): Promise<IRtuProjectExportSummary> {
    const errorsDTO = await rtuExportErrorMapperDTO.getFromModels(rtuProjectExportSummary.errorDetails);
    return this.map(rtuProjectExportSummary, errorsDTO);
  }

  private map(rtuProjectExportSummary: RtuProjectExportSummary, errorsDTO: string[]): IRtuProjectExportSummary {
    return {
      id: rtuProjectExportSummary.id,
      status: rtuProjectExportSummary.status,
      projectName: rtuProjectExportSummary.projectName,
      streetName: rtuProjectExportSummary.streetName,
      streetFrom: rtuProjectExportSummary.streetFrom,
      streetTo: rtuProjectExportSummary.streetTo,
      errorDescriptions: errorsDTO
    };
  }
}

export const rtuProjectExportSummaryMapperDTO = new RtuProjectExportSummaryMapperDTO();

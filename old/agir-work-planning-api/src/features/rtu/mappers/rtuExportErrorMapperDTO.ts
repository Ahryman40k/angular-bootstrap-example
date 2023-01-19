import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { RtuExportError } from '../models/rtuExportError';
import { getRtuExportErrorLabel } from './rtuErrorsLabels';

class RtuExportErrorMapperDTO extends FromModelToDtoMappings<RtuExportError, string, void> {
  protected async getFromNotNullModel(exportError: RtuExportError): Promise<string> {
    return this.map(exportError);
  }

  private map(exportError: RtuExportError): string {
    return getRtuExportErrorLabel(exportError);
  }
}

export const rtuExportErrorMapperDTO = new RtuExportErrorMapperDTO();

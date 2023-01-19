import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { RtuImportError } from '../models/rtuImportError';
import { getRtuImportErrorLabel } from './rtuErrorsLabels';

class RtuImportErrorMapperDTO extends FromModelToDtoMappings<RtuImportError, string, void> {
  protected async getFromNotNullModel(importError: RtuImportError): Promise<string> {
    return this.map(importError);
  }

  private map(importError: RtuImportError): string {
    return getRtuImportErrorLabel(importError);
  }
}

export const rtuImportErrorMapperDTO = new RtuImportErrorMapperDTO();

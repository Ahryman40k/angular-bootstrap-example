import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { RtuProjectError } from '../models/rtuProjectError';
import { rtuImportErrorMapperDTO } from './rtuImportErrorMapperDTO';

export interface IRtuProjectError {
  projectId: string;
  projectNoReference: string;
  projectName: string;
  streetName: string;
  streetFrom: string;
  streetTo: string;
  errorDescriptions: string[];
}

class RtuProjectErrorMapperDTO extends FromModelToDtoMappings<RtuProjectError, IRtuProjectError, void> {
  protected async getFromNotNullModel(rtuProjectError: RtuProjectError): Promise<IRtuProjectError> {
    const errorsDTO = await rtuImportErrorMapperDTO.getFromModels(rtuProjectError.errorDetails);
    return this.map(rtuProjectError, errorsDTO);
  }

  private map(rtuProjectError: RtuProjectError, errorsDTO: string[]): IRtuProjectError {
    return {
      projectId: rtuProjectError.projectId,
      projectNoReference: rtuProjectError.projectNoReference,
      projectName: rtuProjectError.projectName,
      streetName: rtuProjectError.streetName,
      streetFrom: rtuProjectError.streetFrom,
      streetTo: rtuProjectError.streetTo,
      errorDescriptions: errorsDTO
    };
  }
}

export const rtuProjectErrorMapperDTO = new RtuProjectErrorMapperDTO();

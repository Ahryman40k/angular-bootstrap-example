import { IExternalReferenceId } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../mappers/fromModelToDtoMappings';
import { ExternalReferenceId } from '../externalReferenceId';

class ExternalReferenceIdMapperDTO extends FromModelToDtoMappings<ExternalReferenceId, IExternalReferenceId, void> {
  protected async getFromNotNullModel(externalReferenceId: ExternalReferenceId): Promise<IExternalReferenceId> {
    return this.map(externalReferenceId);
  }

  private map(externalReferenceId: ExternalReferenceId): IExternalReferenceId {
    return {
      type: externalReferenceId.type,
      value: externalReferenceId.value
    };
  }
}

export const externalReferenceMapperDTO = new ExternalReferenceIdMapperDTO();

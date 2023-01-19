import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { NexoLogElement } from '../models/nexoLogElement';
import { nexoFileErrorMapperDTO } from './nexoFileErrorMapperDTO';

export abstract class NexoLogElementMapperDTO<P extends NexoLogElement<any>, DTO> extends FromModelToDtoMappings<
  P,
  DTO,
  void
> {
  protected async getFromNotNullModel(nexoLogElement: P): Promise<DTO> {
    const errorsAsString = await nexoFileErrorMapperDTO.getFromModels(nexoLogElement.errors);
    return this.map(nexoLogElement, errorsAsString);
  }
  // should return DTO instead of any but not common INExoLogElementDTO exists in the lib
  protected map(nexoLogElement: P, errorsAsString: string[]): any {
    return {
      id: nexoLogElement.id,
      importStatus: nexoLogElement.importStatus,
      modificationType: nexoLogElement.modificationType,
      description: `"${errorsAsString.join('\n')}"`
    };
  }
}

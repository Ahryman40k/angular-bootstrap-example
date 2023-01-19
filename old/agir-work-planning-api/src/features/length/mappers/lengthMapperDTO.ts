import { ILength } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { Length } from '../models/length';

class LengthMapperDTO extends FromModelToDtoMappings<Length, ILength, void> {
  protected async getFromNotNullModel(length: Length): Promise<ILength> {
    return this.map(length);
  }

  private map(length: Length): ILength {
    return {
      unit: length.unit,
      value: length.value
    };
  }
}

export const lengthMapperDTO = new LengthMapperDTO();

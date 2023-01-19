import { IAdditionalCost } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { AdditionalCost } from '../models/additionalCost';

class AdditionalCostMapperDTO extends FromModelToDtoMappings<AdditionalCost, IAdditionalCost, void> {
  protected async getFromNotNullModel(additionalCost: AdditionalCost): Promise<IAdditionalCost> {
    return this.map(additionalCost);
  }

  private map(additionalCost: AdditionalCost): IAdditionalCost {
    return {
      type: additionalCost.type,
      amount: additionalCost.amount,
      accountId: additionalCost.accountId
    };
  }
}

export const additionalCostMapperDTO = new AdditionalCostMapperDTO();

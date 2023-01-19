import { IRequirementItem } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { RequirementItem } from '../models/requirementItem';

class RequirementItemsMapperDTO extends FromModelToDtoMappings<RequirementItem, IRequirementItem, void> {
  protected async getFromNotNullModel(requirementItem: RequirementItem): Promise<IRequirementItem> {
    return this.map(requirementItem);
  }

  private map(requirementItem: RequirementItem): IRequirementItem {
    return {
      id: requirementItem.id,
      type: requirementItem.type
    };
  }
}

export const requirementItemsMapperDTO = new RequirementItemsMapperDTO();

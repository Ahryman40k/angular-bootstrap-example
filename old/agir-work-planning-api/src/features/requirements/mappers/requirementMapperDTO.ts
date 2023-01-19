import { IAudit, IRequirement, IRequirementItem } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { Requirement } from '../models/requirement';
import { requirementItemsMapperDTO } from './requirementItemsMapperDTO';

class RequirementMapperDTO extends FromModelToDtoMappings<Requirement, IRequirement, void> {
  protected async getFromNotNullModel(requirement: Requirement): Promise<IRequirement> {
    const [requirementItems, audit] = await Promise.all([
      requirementItemsMapperDTO.getFromModels(requirement.items),
      auditMapperDTO.getFromModel(requirement.audit)
    ]);
    return this.map(requirement, requirementItems, audit);
  }

  // For now it is a one/one but could be different
  private map(requirement: Requirement, requirementItems: IRequirementItem[], audit: IAudit): IRequirement {
    return {
      id: requirement.id,
      items: requirementItems,
      typeId: requirement.typeId,
      subtypeId: requirement.subtypeId,
      text: requirement.text,
      audit
    };
  }
}

export const requirementMapperDTO = new RequirementMapperDTO();

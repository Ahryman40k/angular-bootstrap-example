import { IAudit, IEnrichedObjective } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { Objective } from '../models/objective';

class ObjectiveMapperDTO extends FromModelToDtoMappings<Objective, IEnrichedObjective, void> {
  protected async getFromNotNullModel(objective: Objective): Promise<IEnrichedObjective> {
    const auditDTO = await auditMapperDTO.getFromModel(objective.audit);
    return this.map(objective, auditDTO);
  }

  // For now it is a one/one but could be different
  private map(objective: Objective, auditDTO: IAudit): IEnrichedObjective {
    return {
      id: objective.id,
      name: objective.name,
      targetType: objective.targetType,
      objectiveType: objective.objectiveType,
      requestorId: objective.requestorId,
      assetTypeIds: objective.assetTypeIds,
      workTypeIds: objective.workTypeIds,
      pin: objective.pin,
      values: {
        calculated: objective.values.calculated,
        reference: objective.values.reference
      },
      audit: auditDTO
    };
  }
}
export const objectiveMapperDTO = new ObjectiveMapperDTO();

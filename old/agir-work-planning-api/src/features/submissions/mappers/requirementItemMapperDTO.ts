import { IAudit, ISubmissionRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { SubmissionRequirement } from '../models/requirements/submissionRequirement';

class SubmissionRequirementMapperDTO extends FromModelToDtoMappings<
  SubmissionRequirement,
  ISubmissionRequirement,
  void
> {
  protected async getFromNotNullModel(requirement: SubmissionRequirement): Promise<ISubmissionRequirement> {
    const auditDTO = await auditMapperDTO.getFromModel(requirement.audit);
    return this.map(requirement, auditDTO);
  }

  private map(requirement: SubmissionRequirement, auditDTO: IAudit): ISubmissionRequirement {
    return {
      id: requirement.id,
      mentionId: requirement.props.mentionId,
      typeId: requirement.props.typeId,
      subtypeId: requirement.props.subtypeId,
      text: requirement.props.text,
      isDeprecated: requirement.props.isDeprecated,
      projectIds: requirement.props.projectIds,
      planningRequirementId: requirement.props.planningRequirementId,
      audit: auditDTO
    };
  }
}
export const submissionRequirementMapperDTO = new SubmissionRequirementMapperDTO();

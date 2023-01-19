import { DeleteByUuidUseCase } from '../../../../shared/domain/useCases/deleteUseCase/deleteByUuidUseCase';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IRequirementRepository } from '../../iRequirementRepository';
import { Requirement } from '../../models/requirement';
import { requirementRepository } from '../../mongo/requirementRepository';
import { RequirementValidator } from '../../validators/requirementValidator';

export class DeleteRequirementUseCase extends DeleteByUuidUseCase<Requirement> {
  protected entityRepository: IRequirementRepository = requirementRepository;

  protected async validateBusinessRules(requirement: Requirement): Promise<Result<any>> {
    await requirement.fetchItemsEntities();
    return RequirementValidator.validateDeleteBusinessRules(requirement);
  }

  protected async validateAuthorization(): Promise<Result<IGuardResult>> {
    return RequirementValidator.validateItemsRestrictions(this.entity);
  }
}
export const deleteRequirementUseCase = new DeleteRequirementUseCase();

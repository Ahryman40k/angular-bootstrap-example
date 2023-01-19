import { BaseRepository } from '../../../repositories/core/baseRepository';
import { IRequirementRepository } from '../iRequirementRepository';
import { Requirement } from '../models/requirement';
import { IRequirementCriterias, RequirementFindOptions } from '../models/requirementFindOptions';
import { requirementMatchBuilder } from '../requirementMatchBuilder';
import { IRequirementMongoAttributes, IRequirementMongoDocument, RequirementModel } from './requirementModel';

class RequirementRepository extends BaseRepository<Requirement, IRequirementMongoDocument, RequirementFindOptions>
  implements IRequirementRepository {
  public get model(): RequirementModel {
    return this.db.models.Requirement;
  }

  protected async getMatchFromQueryParams(criterias: IRequirementCriterias): Promise<any> {
    return requirementMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected async toDomainModel(raw: IRequirementMongoAttributes): Promise<Requirement> {
    return Requirement.toDomainModel(raw);
  }

  protected toPersistence(requirement: Requirement): IRequirementMongoAttributes {
    return Requirement.toPersistence(requirement);
  }
}

export const requirementRepository: IRequirementRepository = new RequirementRepository();

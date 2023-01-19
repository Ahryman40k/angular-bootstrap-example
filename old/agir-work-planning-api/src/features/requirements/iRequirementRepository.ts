import { IBaseRepository } from '../../repositories/core/baseRepository';
import { Requirement } from './models/requirement';
import { RequirementFindOptions } from './models/requirementFindOptions';

// tslint:disable:no-empty-interface
export interface IRequirementRepository extends IBaseRepository<Requirement, RequirementFindOptions> {}

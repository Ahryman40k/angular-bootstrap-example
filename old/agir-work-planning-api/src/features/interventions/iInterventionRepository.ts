import { ICountBy, IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';
import { Aggregate } from 'mongoose';
import { IBaseRepository } from '../../repositories/core/baseRepository';
import { InterventionFindOptions } from './models/interventionFindOptions';

export interface IInterventionRepository extends IBaseRepository<IEnrichedIntervention, InterventionFindOptions> {
  countBy(findOptions: InterventionFindOptions): Promise<ICountBy[]>;
  // TODO REMOVE IT
  setSort(aggregate: Aggregate<any>, query: any): void;
}

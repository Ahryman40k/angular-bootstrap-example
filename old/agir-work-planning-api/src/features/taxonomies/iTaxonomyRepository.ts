import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IBaseRepository } from '../../repositories/core/baseRepository';
import { TaxonomyFindOptions } from './models/taxonomyFindOptions';

export interface ITaxonomyRepository extends IBaseRepository<ITaxonomy, TaxonomyFindOptions> {
  mapTaxonomies(listData: any[]): ITaxonomy[];
}

import { ITaxonomy } from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { ITaxonomyRepository } from '../iTaxonomyRepository';
import { ITaxonomyCriterias, TaxonomyFindOptions } from '../models/taxonomyFindOptions';
import { taxonomyMatchBuilder } from '../taxonomyMatchBuilder';
import { ITaxonomyMongoDocument, TaxonomyModel } from './taxonomyModel';

class TaxonomyRepository extends BaseRepository<ITaxonomy, ITaxonomyMongoDocument, TaxonomyFindOptions>
  implements ITaxonomyRepository {
  public get model(): TaxonomyModel {
    return this.db.models.Taxonomy;
  }

  protected async getMatchFromQueryParams(criterias: ITaxonomyCriterias): Promise<any> {
    return taxonomyMatchBuilder.getMatchFromQueryParams(criterias);
  }

  public mapTaxonomies(listData: any[]): ITaxonomy[] {
    return listData.map(x => {
      return Object.assign(x, {
        group: x.group ? x.group.toString() : undefined,
        code: x.code ? x.code.toString() : undefined,
        label: {
          fr: _.get(x, 'label.fr') || '-',
          en: _.get(x, 'label.en') || '-'
        },
        valueString1: x.valueString1 ? x.valueString1.toString() : undefined
      });
    });
  }
}

export const taxonomyRepository: ITaxonomyRepository = new TaxonomyRepository();

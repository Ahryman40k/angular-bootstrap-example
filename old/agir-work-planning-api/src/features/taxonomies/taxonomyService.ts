import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';

import { constants } from '../../../config/constants';
import { TaxonomyFindOptions } from './models/taxonomyFindOptions';
import { taxonomyRepository } from './mongo/taxonomyRepository';

const MINUTE_MS = 60000;

class TaxonomyService {
  private lastFindAllTime: number;
  private taxonomiesMap: Map<TaxonomyGroup, ITaxonomy[]>;

  private async getTaxonomiesMapFromCache(): Promise<Map<TaxonomyGroup, ITaxonomy[]>> {
    const taxonomyFindOptions = TaxonomyFindOptions.create({
      criterias: {}
    });

    if (!this.taxonomiesMap || this.shouldRefresh() || !constants.taxonomy.CACHE_ENABLED) {
      const taxonomies = await taxonomyRepository.findAll(taxonomyFindOptions.getValue());
      this.taxonomiesMap = this.createTaxonomiesMap(taxonomies);
      this.lastFindAllTime = new Date().getTime();
    }
    return this.taxonomiesMap;
  }

  private createTaxonomiesMap(taxonomies: ITaxonomy[]): Map<TaxonomyGroup, ITaxonomy[]> {
    const taxonomiesMap = new Map<TaxonomyGroup, ITaxonomy[]>();
    taxonomies.forEach(element => {
      const group = element.group as TaxonomyGroup;
      if (!taxonomiesMap.has(group)) {
        taxonomiesMap.set(element.group as TaxonomyGroup, []);
      }
      taxonomiesMap.get(group).push(element);
    });
    return taxonomiesMap;
  }

  private getTaxonomiesFromMap(taxonomiesMap: Map<TaxonomyGroup, ITaxonomy[]>): ITaxonomy[] {
    const taxonomies: ITaxonomy[] = [];
    taxonomiesMap.forEach((el: ITaxonomy[]) => {
      taxonomies.push(...el);
    });
    return taxonomies;
  }

  public async all(): Promise<ITaxonomy[]> {
    const taxonomiesMap = await this.getTaxonomiesMapFromCache();
    return this.getTaxonomiesFromMap(taxonomiesMap);
  }

  public async getGroups(groups: TaxonomyGroup[]): Promise<ITaxonomy[]> {
    const taxonomiesMap = await this.getTaxonomiesMapFromCache();
    const taxonomies: ITaxonomy[] = [];
    groups.forEach(group => {
      taxonomies.push(...taxonomiesMap.get(group));
    });
    return taxonomies;
  }

  public async getGroup(group: TaxonomyGroup): Promise<ITaxonomy[]> {
    const taxonomiesMap = await this.getTaxonomiesMapFromCache();
    return taxonomiesMap.get(group) || [];
  }

  public async getGroupAndProperty(
    group: TaxonomyGroup,
    propertyKey: string,
    propertyValue: any
  ): Promise<ITaxonomy[]> {
    const taxonomies = await this.getGroup(group);
    return taxonomies.filter(el => el.properties[propertyKey] === propertyValue);
  }

  public async getTaxonomy(group: TaxonomyGroup, code: string): Promise<ITaxonomy> {
    const taxonomies = await this.getGroup(group);
    return taxonomies.find(el => el.code === code);
  }

  public async getTaxonomyValueString<T extends string>(group: TaxonomyGroup, code: string): Promise<T[]> {
    const taxonomy = await this.getTaxonomy(group, code);
    return taxonomy.valueString1.split(',') as T[];
  }

  public async translate(group: TaxonomyGroup, code: string, lang = 'fr'): Promise<string> {
    const taxonomy = await this.getTaxonomy(group, code);
    return taxonomy ? taxonomy.label[lang] : '';
  }

  public reset(): void {
    this.taxonomiesMap = null;
  }

  private shouldRefresh(): boolean {
    return (
      this.lastFindAllTime &&
      new Date().getTime() - this.lastFindAllTime > constants.taxonomy.REFRESH_RATE_MINUTES * MINUTE_MS
    );
  }
}
export const taxonomyService = new TaxonomyService();

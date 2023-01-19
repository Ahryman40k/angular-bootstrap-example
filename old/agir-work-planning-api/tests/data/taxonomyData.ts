import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten } from 'lodash';

export const codes = ['1', '2', '3'];
export const groups: TaxonomyGroup[] = [TaxonomyGroup.assetType, TaxonomyGroup.executor, TaxonomyGroup.requestor];
export const particularGroups = [TaxonomyGroup.assetType, TaxonomyGroup.requestor];
// method to get random group used to test
export const randomGroup = () => groups[Math.floor(Math.random() * groups.length)];
// method to get random code used to test
export const randomCode = () => codes[Math.floor(Math.random() * codes.length)];
// create 3 taxonomies for each group
// add property 'category' for all taxonomies to test getGroupAndProperty method
export const allTaxonomies: ITaxonomy[] = flatten(
  groups.map(group => {
    return codes.map(code => {
      return {
        code,
        group,
        label: { fr: code + group },
        properties: { category: 'category' }
      } as ITaxonomy;
    });
  })
);

export const createTaxonomiesMap = () => {
  const map = new Map<TaxonomyGroup, ITaxonomy[]>();
  groups.forEach(group => {
    map.set(
      group,
      allTaxonomies.filter(el => el.group === group)
    );
  });
  return map;
};
// taxonomies used to test if cache is refreshed or not
export const otherTaxonomies: ITaxonomy[] = [
  {
    group: TaxonomyGroup.assetType,
    code: 'code1',
    label: {}
  },
  {
    group: TaxonomyGroup.assetType,
    code: 'code2',
    label: {}
  }
];

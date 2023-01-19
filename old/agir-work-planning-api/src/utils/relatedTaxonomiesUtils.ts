import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';

export interface IRelatedTaxonomyOptions {
  originalCode: string;
  relatedToGroup: string;
  relatedToPropBy: string;
  relatedToGroupBy: string;
  relatedToProp: string;
}

export function getRelatedTaxonomies(taxonomies: ITaxonomy[], options: IRelatedTaxonomyOptions): ITaxonomy[] {
  const bridgeTaxonomies = taxonomies.filter(
    taxo =>
      taxo.group === options.relatedToGroupBy &&
      taxo[options.relatedToProp]
        .split(',')
        .map((y: string) => y.trim())
        .includes(options.originalCode)
  );
  let taxonomiesCodeToFind: string[] = bridgeTaxonomies.map(taxo => taxo[options.relatedToPropBy]);
  let tmpCodeToFind: string[] = [];
  for (const code of taxonomiesCodeToFind) {
    tmpCodeToFind = _.concat(
      tmpCodeToFind,
      code.split(',').map((x: string) => x.trim())
    );
  }
  taxonomiesCodeToFind = tmpCodeToFind;
  taxonomiesCodeToFind = taxonomiesCodeToFind.filter((item, index) => taxonomiesCodeToFind.indexOf(item) === index);
  return getTaxonomiesByCodes(taxonomies, taxonomiesCodeToFind, options.relatedToGroup);
}

export function getTaxonomiesByCodes(
  taxonomies: ITaxonomy[],
  taxonomyCodes: string[],
  relatedToGroup: string
): ITaxonomy[] {
  return taxonomies.filter(taxo => taxo.group === relatedToGroup && taxonomyCodes.includes(taxo.code));
}

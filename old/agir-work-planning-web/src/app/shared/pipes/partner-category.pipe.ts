import { Pipe, PipeTransform } from '@angular/core';

import { RtuProjectCategory } from '../models/rtu-project-category';

interface ICategoryDictionary {
  code: string;
  label: string;
}

const categoryDictionary: ICategoryDictionary[] = [
  {
    code: RtuProjectCategory.partner,
    label: 'Partenaire'
  },
  {
    code: RtuProjectCategory.borough,
    label: 'Arrondissement'
  },
  {
    code: RtuProjectCategory.city,
    label: 'Ville liée'
  }
];

@Pipe({ name: 'appPartnerCategory' })
export class PartnerCategoryPipe implements PipeTransform {
  public transform(category: string): string {
    if (!category) {
      return null;
    }
    return categoryDictionary.find(x => x.code === category).label;
  }
}

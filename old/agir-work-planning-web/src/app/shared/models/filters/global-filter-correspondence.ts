import {
  ILocalizedText,
  InterventionDecisionType,
  InterventionStatus,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { IGlobalFilter } from './global-filter';
import { IGlobalLabel } from './global-filter-label';

interface IGlobalFilterCorrespondence {
  key: keyof IGlobalFilter;
  taxonomyGroup?: TaxonomyGroup;
  customMapper?: (value: string[], taxonomies?: ITaxonomy[], filter?: IGlobalFilter) => IGlobalLabel[];
  template?: ILocalizedText;
}

export const globalFilterCorrespondences: IGlobalFilterCorrespondence[] = [
  {
    key: 'boroughs',
    taxonomyGroup: TaxonomyGroup.borough
  },
  {
    key: 'submissionNumber',
    template: {
      fr: '{value}',
      en: '{value}'
    }
  },
  {
    key: 'budgetFrom',
    template: {
      fr: 'Budget de {value} k$',
      en: 'Budget from {value} k$'
    }
  },
  {
    key: 'budgetTo',
    template: {
      fr: `Budget à {value} k$`,
      en: 'Budget to {value} k$'
    }
  },
  {
    key: 'decisionRequired',
    template: {
      fr: `Décision requise: {value}`,
      en: `Decision required: {value}`
    }
  },
  {
    key: 'interventionStatuses',
    customMapper: (values: string[] = [], taxonomies: ITaxonomy[], filter: IGlobalFilter) => {
      return values.map(item => {
        if (
          item === InterventionStatus.waiting &&
          filter.decisionTypeId?.includes(InterventionDecisionType.revisionRequest)
        ) {
          return {
            key: `interventionStatuses.${item},decisionTypeId.${InterventionDecisionType.revisionRequest}`,
            label: { en: 'En attente (suite à une révision)', fr: 'En attente (suite à une révision)' }
          };
        }
        return {
          key: `interventionStatuses.${item}`,
          label: taxonomies.find(t => t.group === TaxonomyGroup.interventionStatus && t.code === item)?.label
        };
      });
    }
  },
  {
    key: 'interventionTypes',
    taxonomyGroup: TaxonomyGroup.interventionType
  },
  {
    key: 'programBooks',
    template: {
      fr: '{value}',
      en: '{value}'
    }
  },
  {
    key: 'programTypes',
    taxonomyGroup: TaxonomyGroup.programType
  },
  {
    key: 'projectCategories',
    taxonomyGroup: TaxonomyGroup.projectCategory
  },
  {
    key: 'projectStatuses',
    taxonomyGroup: TaxonomyGroup.projectStatus
  },
  {
    key: 'rtuProjectStatuses',
    taxonomyGroup: TaxonomyGroup.rtuProjectStatus
  },
  {
    key: 'projectSubCategories',
    taxonomyGroup: TaxonomyGroup.projectSubCategory
  },
  {
    key: 'projectTypes',
    taxonomyGroup: TaxonomyGroup.projectType
  },
  {
    key: 'requestors',
    taxonomyGroup: TaxonomyGroup.requestor
  },
  {
    key: 'workTypes',
    taxonomyGroup: TaxonomyGroup.workType
  },
  {
    key: 'executors',
    taxonomyGroup: TaxonomyGroup.executor
  },
  {
    key: 'partnerId',
    taxonomyGroup: TaxonomyGroup.infoRtuPartner
  },
  {
    key: 'shownElements',
    template: {
      fr: '{value}',
      en: '{value}'
    }
  },
  {
    key: 'medals',
    taxonomyGroup: TaxonomyGroup.medalType
  }
];

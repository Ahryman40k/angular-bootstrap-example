import { GlobalFilterShownElement } from './global-filter-shown-element';

export interface IGlobalFilter {
  boroughs?: string[];
  budgetFrom?: number;
  budgetTo?: number;
  executors?: string[];
  interventionStatuses?: string[];
  decisionTypeId?: string[];
  interventionTypes?: string[];
  medals?: string[];
  programBooks?: string[];
  programTypes?: string[];
  projectCategories?: string[];
  projectStatuses?: string[];
  rtuProjectStatuses?: string[];
  projectSubCategories?: string[];
  projectTypes?: string[];
  requestors?: string[];
  submissionNumber?: string[];
  partners?: string[];
  shownElements?: GlobalFilterShownElement[];
  workTypes?: string[];
  // To keep track of the partner filter separately
  // It isn't used in the BE
  partnerId?: string[];
  decisionRequired?: boolean;
}

export const ALL_KEYS = ['boroughs', 'shownElements'];
export const INTERVENTIONS_PROJECTS_KEYS = [
  'budgetFrom',
  'budgetTo',
  'medals',
  'workTypes',
  'programTypes',
  'requestors',
  'executors',
  ...ALL_KEYS
];
export const PROJECTS_KEYS = [
  'projectTypes',
  'projectCategories',
  'projectSubCategories',
  'projectStatuses',
  'programBooks',
  'submissionNumber',
  ...INTERVENTIONS_PROJECTS_KEYS
];
export const INTERVENTIONS_KEYS = [
  'decisionTypeId',
  'interventionTypes',
  'interventionStatuses',
  'decisionRequired',
  ...INTERVENTIONS_PROJECTS_KEYS
];
export const RTU_PROJECTS_KEYS = ['rtuProjectStatuses', 'partners', 'partnerId', ...ALL_KEYS];

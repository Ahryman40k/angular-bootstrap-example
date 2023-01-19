import { AnnualProgramExpand } from '@villemontreal/agir-work-planning-lib/dist/src/annual-programs/annual-program-expand';
import { IFindOptions } from './findOptions';

export enum ANNUAL_PROGRAM_FIELDS {
  ID = 'id',
  AUDIT = 'audit',
  EXECUTOR_ID = 'executorId',
  YEAR = 'year',
  BUDGET_CAP = 'budgetCap',
  DESCRIPTION = 'description',
  PROGRAM_BOOK_ID = 'programBooks.id',
  PROGRAM_BOOK_NAME = 'programBooks.name',
  PROGRAM_BOOK_STATUS = 'programBooks.status',
  PROGRAM_BOOK_OBJECTIVES = 'programBooks.objectives',
  PROGRAM_BOOK_PROJECT_TYPES = 'programBooks.projectTypes',
  PROGRAM_BOOK_BOROUGH_IDS = 'programBooks.boroughIds',
  PROGRAM_BOOK_PROGRAM_TYPES = 'programBooks.programTypes',
  PROGRAM_BOOK_PRIORITYSCENARIOS_ORDERED_PROJECTS_PROJECTID = 'programBooks.priorityScenarios.orderedProjects.projectId',
  SHARED_ROLES = 'sharedRoles',
  STATUS = 'status'
}

export interface IAnnualProgramFindOptions extends IFindOptions<ANNUAL_PROGRAM_FIELDS, AnnualProgramExpand> {
  fromYear?: number;
  toYear?: number;
  executorId?: string;
  fields: ANNUAL_PROGRAM_FIELDS[];
  expand?: AnnualProgramExpand;
  limit?: number;
  offset?: number;
  orderBy?: string;
}

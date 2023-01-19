import { IColumn } from './column-config-interfaces';

export enum ProgramBookTableColumns {
  BOROUGH = 'borough',
  BUDGET = 'budget',
  CATEGORY = 'category',
  END_YEAR = 'end-year',
  EXECUTOR = 'executor',
  INITIAL_REQUESTOR = 'initial-requestor',
  LABEL = 'label',
  LENGTH = 'length',
  MEDALS = 'medals',
  NO_BIC_INFO_RTU = 'no-bic-info-rtu',
  PRIORITY_LEVEL = 'priority-level',
  PRIORITY_SERVICE = 'priority-service',
  PROGRAM = 'program',
  PROJECT_ID = 'project-id',
  PROJECT_TYPE = 'project-type',
  RANK = 'rank',
  ROAD_NETWORK_TYPE = 'road-network-type',
  START_YEAR = 'start-year',
  STREET_FROM = 'street-from',
  STREET_NAME = 'street-name',
  STREET_TO = 'street-to',
  SUB_CATEGORY = 'sub-category',
  SUBMISSION_NUMBER = 'submission-number'
}

export enum InterventionColumns {
  ID = 'id',
  INTERVENTION_NAME = 'interventionName',
  PROGRAM_ID = 'programId',
  DECESION_REQUIRED = 'decisionRequired',
  INTERVENTION_TYPE_ID = 'interventionTypeId',
  REQUESTOR_ID = 'requestorId',
  STREET_NAME = 'streetName',
  STREET_FROM = 'streetFrom',
  STREET_TO = 'streetTo',
  BOROUGH_ID = 'boroughId'
}

export enum ProjectsColumns {
  ID = 'id',
  PROJECT_NAME = 'projectName',
  PROJECT_TYPE_ID = 'projectTypeId',
  CATEGORY = 'category',
  STREET_NAME = 'streetName',
  STREET_FROM = 'streetFrom',
  STREET_TO = 'streetTo',
  BOROUGH_ID = 'boroughId',
  START_YEAR = 'startYear',
  STATUS = 'status',
  PROGRAM = 'program',
  REQUIREMENT_COUNT = 'requirementCount'
}

export enum ProgramBookTableColumnLabels {
  'borough' = 'Arrondissement',
  'budget' = 'Budget',
  'category' = 'Catégorie',
  'end-year' = 'Année de fin',
  'executor' = 'Exécutant',
  'initial-requestor' = 'Requérant initial',
  'label' = 'Libellé',
  'length' = 'Longueur',
  'medals' = 'Médaille',
  'no-bic-info-rtu' = 'No BIC - Info-RTU',
  'priority-level' = 'Niveau',
  'priority-service' = 'Priorités service',
  'program' = 'Programme',
  'project-id' = 'ID Projet',
  'project-type' = 'Type',
  'rank' = 'Rang',
  'road-network-type' = 'Type réseau',
  'start-year' = 'Année de début',
  'street-from' = 'Voie de',
  'street-name' = 'Voie',
  'street-to' = 'Voie À',
  'sub-category' = 'Sous-Catégorie',
  'submission-number' = 'Numéro de soumission'
}

export enum SubmittedInterventionColumnLabels {
  'id' = 'ID Objet',
  'interventionName' = 'Libellé',
  'programId' = 'Programme',
  'decisionRequired' = 'Décision',
  'interventionTypeId' = 'Type',
  'requestorId' = 'Requérant',
  'streetName' = 'Voie',
  'streetFrom' = 'Voie de',
  'streetTo' = 'Voie à',
  'boroughId' = 'Arrondissement'
}

export enum ProjectsToScheduleColumnLabels {
  'id' = 'ID Project',
  'projectName' = 'Libellé',
  'projectTypeId' = 'Type',
  'category' = 'Catégorie',
  'streetName' = 'Voie',
  'streetFrom' = 'Voie de',
  'streetTo' = 'Voie à',
  'boroughId' = 'Arrondissement',
  'startYear' = 'startYear',
  'status' = 'status',
  'program' = 'Programme',
  'requirementCount' = 'Exigences'
}
export const ALL_PROGRAM_BOOK_TABLE_COLUMNS: IColumn[] = [
  {
    columnName: ProgramBookTableColumns.RANK,
    displayOrder: 1,
    fieldName: 'rank'
  },
  {
    columnName: ProgramBookTableColumns.PRIORITY_LEVEL,
    displayOrder: 2,
    fieldName: 'priorityLevel'
  },
  {
    columnName: ProgramBookTableColumns.PROJECT_ID,
    displayOrder: 3,
    fieldName: 'projectId'
  },
  {
    columnName: ProgramBookTableColumns.LABEL,
    displayOrder: 4,
    fieldName: 'projectName'
  },
  {
    columnName: ProgramBookTableColumns.PROJECT_TYPE,
    displayOrder: 5,
    fieldName: 'projectTypeId'
  },
  {
    columnName: ProgramBookTableColumns.CATEGORY,
    displayOrder: 6,
    fieldName: 'category'
  },
  {
    columnName: ProgramBookTableColumns.BUDGET,
    displayOrder: 7,
    fieldName: 'globalBudget'
  },
  {
    columnName: ProgramBookTableColumns.BOROUGH,
    displayOrder: 8,
    fieldName: 'boroughId'
  },
  {
    columnName: ProgramBookTableColumns.END_YEAR,
    displayOrder: 9,
    fieldName: 'endYear'
  },
  {
    columnName: ProgramBookTableColumns.EXECUTOR,
    displayOrder: 10,
    fieldName: 'executorId'
  },
  {
    columnName: ProgramBookTableColumns.INITIAL_REQUESTOR,
    displayOrder: 11,
    fieldName: 'inChargeId'
  },

  {
    columnName: ProgramBookTableColumns.LENGTH,
    displayOrder: 12,
    fieldName: 'length'
  },
  {
    columnName: ProgramBookTableColumns.MEDALS,
    displayOrder: 13,
    fieldName: 'medalId'
  },
  {
    columnName: ProgramBookTableColumns.NO_BIC_INFO_RTU,
    displayOrder: 14,
    fieldName: 'externalReferenceIds'
  },
  {
    columnName: ProgramBookTableColumns.PRIORITY_SERVICE,
    displayOrder: 15,
    fieldName: 'servicePriorities'
  },
  {
    columnName: ProgramBookTableColumns.PROGRAM,
    displayOrder: 16,
    fieldName: 'programId'
  },
  {
    columnName: ProgramBookTableColumns.ROAD_NETWORK_TYPE,
    displayOrder: 17,
    fieldName: 'roadNetworkTypeId'
  },
  {
    columnName: ProgramBookTableColumns.START_YEAR,
    displayOrder: 18,
    fieldName: 'startYear'
  },
  {
    columnName: ProgramBookTableColumns.STREET_FROM,
    displayOrder: 19,
    fieldName: 'streetFrom'
  },
  {
    columnName: ProgramBookTableColumns.STREET_NAME,
    displayOrder: 20,
    fieldName: 'streetName'
  },
  {
    columnName: ProgramBookTableColumns.STREET_TO,
    displayOrder: 21,
    fieldName: 'streetTo'
  },
  {
    columnName: ProgramBookTableColumns.SUB_CATEGORY,
    displayOrder: 22,
    fieldName: 'subCategoryIds'
  },
  {
    columnName: ProgramBookTableColumns.SUBMISSION_NUMBER,
    displayOrder: 23,
    fieldName: 'submissionNumber'
  }
];
export const DEFAULT_PROGRAM_BOOK_TABLE_COLUMNS: IColumn[] = ALL_PROGRAM_BOOK_TABLE_COLUMNS.filter(column =>
  [
    ProgramBookTableColumns.RANK,
    ProgramBookTableColumns.PRIORITY_LEVEL,
    ProgramBookTableColumns.PROJECT_ID,
    ProgramBookTableColumns.LABEL,
    ProgramBookTableColumns.PROJECT_TYPE,
    ProgramBookTableColumns.CATEGORY,
    ProgramBookTableColumns.BUDGET,
    ProgramBookTableColumns.BOROUGH
  ].includes(column.columnName as ProgramBookTableColumns)
);

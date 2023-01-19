export enum TaxonomyTableColumnLabels {
  'consultation' = 'Consultation',
  'code' = "Code de l'élément",
  'labelfr' = 'Libellé français',
  'labelen' = 'Libellé anglais',
  'url' = 'URL',
  'category' = 'Catégorie',
  'requirementType' = "Type d'exigence",
  'submissionRequirementSubtype' = 'Exigence de conception connexe',
  'rtuDataName' = 'Nom Info-RTU',
  'rtuDataId' = 'ID Info-RTU',
  'rtuDataStatus' = 'Statut Info-RTU',
  'rtuDataPhase' = 'Phase Info-RTU',
  'rtuDataValue' = 'Code Info-RTU',
  'rtuDataDefinition' = 'Libellé Info-RTU',
  'acronymfr' = 'Acronyme français',
  'acronymen' = 'Acronyme anglais',
  'isInternal' = 'Interne',
  'geomaticKey' = 'Propriété géomatique',
  'assetKey' = 'Propriété AGIR',
  'unit' = 'Unité',
  'rrva' = 'RRVA'
}

export interface ITaxonomyGroupTableColumnOptions {
  [columnName: string]: ITaxonomyGroupTableOptions;
}

export interface ITaxonomyGroupTableOptions {
  shown: boolean;
  sortable: boolean;
  sorted?: string;
}

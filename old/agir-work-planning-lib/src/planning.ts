export interface IAdditionalCost {
  /**
   * taxonomy code corresponding to the group additionalCost
   *
   */
  type: 'professionalServices' | 'workExpenditures' | 'contingency' | 'others';
  amount: number; // amount
  /**
   * the external account reference (PTI program) of the additionnal costs
   *
   */
  accountId?: number;
}
export interface IAdditionalCostsTotalAmount {
  /**
   * taxonomy code corresponding to the group additionalCost
   *
   */
  type?: 'professionalServices' | 'workExpenditures' | 'contingency' | 'others';
  /**
   * calculated. the sum of that type of additional costs throughout the project
   *
   */
  amount?: number; // amount
  note?: string;
}
export type IAllowedMimeType =
  | 'application/pdf'
  | 'application/msword'
  | 'image/x-dwg'
  | 'application/octet-stream'
  | 'text/csv'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/gif'
  | 'image/tiff';
export interface IAnnualBudgetDistributionSummary {
  /**
   * calculated.
   *
   */
  totalAllowance?: number; // amount
  note?: string;
}
export interface IAnnualInterventionDistributionSummary {
  /**
   * the interventionId
   *
   */
  id?: string;
  /**
   * calculated.
   *
   */
  totalAllowance?: number; // amount
  /**
   * calculated. in km
   *
   */
  totalLength?: number;
  note?: string;
}
export interface IAnnualPeriodInterventions {
  interventionId?: string;
  year?: number;
  annualAllowance?: number;
  accountId?: number;
}
export interface IAnnualProjectDistributionSummary {
  /**
   * calculated. the sum of the interventions total budget and additional costs total budget.
   *
   */
  totalBudget?: number; // amount
  additionalCostTotals?: IAdditionalCostsTotalAmount[];
  /**
   * calculated. the sum of the additional costs total budget.
   *
   */
  totalAdditionalCosts?: number; // amount
  /**
   * calculated. the sum of the interventions total budget.
   *
   */
  totalInterventionBudgets?: number; // amount
  totalAnnualBudget?: IAnnualBudgetDistributionSummary;
}
export interface IApiError {
  code: string;
  message: string;
  target?: string;
  details?: IApiError[];
  innererror?: IApiInnerError;
}
export interface IApiInnerError {
  code: string;
  message: string;
  innererror?: IApiInnerError;
}
export interface IAsset {
  id?: IReferenceId; // ^[\.@!0-9a-fA-Z]*$
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  typeId: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  ownerId: string;
  length?: ILength;
  geometry?: IGeometry;
  diameter?: string;
  material?: string;
  /**
   * Suggested street name
   */
  suggestedStreetName?: string;
  /**
   * external resources
   */
  roadSections?: IFeatureCollection;
  /**
   * external resouces
   */
  workArea?: IFeature;
  properties?: any;
  externalReferenceIds?: IExternalReferenceId[];
  assetDesignData?: IAssetDesignData;
}
export interface IAssetDesignData {
  upstreamAssetType?: string;
  upstreamAssetId?: string;
  upstreamDepth?: string;
  downstreamAssetType?: string;
  downstreamAssetId?: string;
  downstreamDepth?: string;
  numberOfConnections?: number;
  deformation?: number;
  hasInfiltration?: boolean;
  infiltrationChaining?: string;
  infiltrationAssetId?: string;
  hasObstruction?: boolean;
  obstructionChaining?: string;
  obstructionAssetId?: string;
  comment?: string;
  audit: IAudit;
}
export interface IAssetLastIntervention {
  assetId?: string;
  assetExternalReferenceId?: IExternalReferenceId;
  intervention: ILastIntervention;
}
export type IAssetList = IAsset[];
export interface IAssetsLastInterventionSearchRequest {
  assetIds?: string[];
  assetExternalReferenceIds?: IExternalReferenceId[];
  planificationYear: number;
}
/**
 * The assets and the combined surface areas geometry.
 */
export interface IAssetsWorkArea {
  assets: IAssetList;
  workArea: IFeature;
}
export interface IAssetsWorkAreaSearchRequest {
  assets: {
    /**
     * The asset ID.
     */
    id: string;
    /**
     * The asset type. Must be a taxonomy code that belongs to group assetType.
     */
    type: string;
  }[];
  expand?: string[];
}
/**
 * Audit fields following vdm standard
 */
export interface IAudit {
  createdAt?: IDate; // date-time
  createdBy?: IAuthor;
  lastModifiedAt?: IDate; // date-time
  lastModifiedBy?: IAuthor;
  expiredAt?: IDate; // date-time
  expiredBy?: IAuthor;
}
export interface IAuthor {
  userName: string;
  displayName: string;
}
export interface IBaseIntervention {
  id?: string;
  /**
   * must be a taxonomy code that belongs to group executor
   */
  executorId: string;
  externalReferenceIds?: IExternalReferenceId[];
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  medalId?: string;
  importRevisionDate?: string;
}
export interface IBaseObjective {
  /**
   * The objective\'s name
   * example:
   * Budget de reconstruction des aqueducs
   */
  name: string;
  /**
   * The target type of objective
   * example:
   * bid
   */
  targetType: 'bid' | 'length' | 'budget';
  /**
   * The type of objective
   * example:
   * threshold
   */
  objectiveType: 'threshold' | 'performanceIndicator';
  /**
   * The requestor ID. Filters which projects will be part of the objective calculation.
   * example:
   * bell
   */
  requestorId?: string;
  /**
   * The asset type IDs. Filters which projects will be part of the objective calculation.
   * example:
   * fireHydrant,streetTree
   */
  assetTypeIds?: string[];
  /**
   * The work type IDs. Filters which projects will be part of the objective calculation.
   * example:
   * reconstruction,construction
   */
  workTypeIds?: string[];
  /**
   * The flag that indicate if the objective is a key objective for the program book.
   */
  pin?: boolean;
}
export interface IBaseOpportunityNotice {
  /**
   * the reference to the project
   */
  projectId: string;
  object: string;
  assets?: IAsset[];
  /**
   * requestorId must have taxonomy codes that belong to group requestor
   *
   */
  requestorId: string;
  contactInfo?: string;
  followUpMethod: string;
  maxIterations: number;
}
export interface IBaseProject {
  /**
   * The project identifier
   */
  id?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  boroughId?: string;
  /**
   * year the project ends
   * example:
   * 2022
   */
  endYear?: number;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  executorId?: string;
  externalReferenceIds?: IExternalReferenceId[];
  geometry?: IGeometry;
  globalBudget?: IBudget;
  importFlag?: string;
  /**
   * Someone in charge of this project. Corresponds to requestors taxonomies
   */
  inChargeId?: string;
  interventionIds?: string[];
  servicePriorities?: IServicePriority[];
  /**
   * description du projet
   */
  projectName?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  projectTypeId?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  riskId?: string;
  /**
   * year the project starts
   * example:
   * 2021
   */
  startYear?: number;
  /**
   * taxonomy code that belong to projectStatus group
   */
  status?: string;
  /**
   * Suggested street name
   */
  streetName?: string;
  /**
   * taxonomy code that belong to projectSubCategory group
   */
  subCategoryIds?: string[];
}
export interface IBicImportLog {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  audit: IAudit;
}
/**
 * project imported by BIC
 */
export interface IBicProject {
  /**
   * example:
   * 2020
   */
  ANNEE_ACTUELLE?: string;
  /**
   * example:
   * 2020
   */
  ANNEE_DEBUT: string;
  /**
   * example:
   * 2020
   */
  ANNEE_FIN: string;
  /**
   * example:
   * 2020
   */
  ANNEE_PROGRAMATION: number;
  /**
   * example:
   * 2019
   */
  ANNEE_REVISEE?: number;
  /**
   * example:
   * VM
   */
  ARRONDISSEMENT_AGIR: string;
  /**
   * example:
   * PARACHEVEMENT
   */
  CATEGORIE_PROJET?: string;
  /**
   * example:
   * PI
   */
  CLASSIFICATION?: string;
  /**
   * example:
   *
   * *2. Info Travaux *:
   * - ARROND: Travaux de saillies allongées bordant le théâtre; intégrés au projet
   */
  COMMENTAIRES_DI_BIC?: string;
  /**
   * example:
   * Conduits (5 sem.)
   */
  COMMENTAIRE_INTERVENTION?: string;
  /**
   * example:
   * Requérant: bell - Intervention: reconstruction/accessWell - Coord: AV - Année:
   */
  COMMENTAIRE_PROJET?: string;
  /**
   * example:
   * 2
   */
  COTE_GLOBALE?: number;
  /**
   * example:
   * 2
   */
  COTE_PRIORITE_GLOBAL?: number;
  /**
   * example:
   * Saillies
   */
  DESC_TYPE_TRAVAUX_TRC?: string;
  /**
   * example:
   * GAV
   */
  DIVISION_REQUERANT_INITIAL?: string;
  /**
   * example:
   * 3,600,000
   */
  ESTIMATION_REQUERANT?: string | number;
  /**
   * example:
   * 619491,5
   */
  ESTIMATION_BUDG_GLOBAL?: string;
  /**
   * example:
   * Report
   */
  ETAT_PROJET?: string;
  /**
   * example:
   * di
   */
  EXECUTANT_AGIR: string;
  /**
   * example:
   * 19
   */
  ID_ARRONDISSEMENT?: number;
  /**
   * example:
   * 9
   */
  ID_EXECUTANT?: string;
  /**
   * example:
   * 109139767550822007120143031960031106678
   */
  ID_PROJET?: string | number;
  /**
   * example:
   * 152693299256416066048342546752478294219
   */
  ID_TYPE_TRAVAUX_TRC?: string | number;
  /**
   * example:
   * 0.123
   */
  LONGUEUR_GLOBAL?: number;
  /**
   * example:
   * 0
   */
  LONGUEUR_INTERV_REQUERANT?: number;
  /**
   * example:
   * Argent -Mineur
   */
  MEDAILLE_AMENAGEMENT?: string;
  /**
   * example:
   * 41511
   */
  NO_PROJET?: string;
  /**
   * example:
   * 100000
   */
  NO_REFERENCE_REQ?: string;
  /**
   * example:
   * VILLE-MARIE
   */
  NOM_ARRONDISSEMENT?: string;
  /**
   * example:
   * Coupal (rue)
   */
  NOM_VOIE?: string;
  /**
   * example:
   * Programme ??
   */
  PROGRAMME?: string;
  /**
   * example:
   * ARR
   */
  PROJET_REQUERANT?: string;
  /**
   * example:
   * bell
   */
  PROPRIETAIRE_ACTIF?: string;
  /**
   * example:
   * 1
   */
  PRIORITE_REQ_AGIR?: string;
  /**
   * example:
   * borough
   */
  REQUERANT_AGIR: string;
  /**
   * example:
   * LY, KIM-HUOT
   */
  REQUERANT_INITIAL?: string;
  /**
   * example:
   * Risque - Autre: PE-911
   */
  RISQUE_AUTRE_COMMENT?: string;
  /**
   * example:
   * Risque - Projet enfouissement: PE-911z
   */
  RISQUE_ENFOUISS_COMMENT?: string;
  /**
   * example:
   * Risque - Acquisition de terrains / servitudes
   */
  RISQUE_ACQUIS_TERRAIN?: string;
  /**
   * example:
   *
   */
  RISQUE_ENTENTE?: string;
  /**
   * example:
   * Commentaire - Arrondissement: Pas de projet prévu
   */
  COMMENTAIRE_ARRONDISSEMENT?: string;
  /**
   * example:
   * MTQ - Info-RTU: 000000911
   */
  COMMENTAIRE_MTQ_INFO_RTU?: string;
  /**
   * example:
   * integrated
   */
  STATUT_INTERVENTION?: string;
  /**
   * example:
   * Programmé
   */
  STATUT_PROJET: string;
  /**
   * example:
   * pas_intervention
   */
  STATUT_SUIVI?: string;
  /**
   * example:
   * Station McGill
   */
  TITRE_PROJET?: string;
  /**
   * example:
   * amenagement
   */
  TYPE_ACTIF_AGIR?: string;
  /**
   * example:
   * opportunity
   */
  TYPE_INTERVENTION?: string;
  /**
   * example:
   * Intégré
   */
  TYPE_PROJET?: string;
  /**
   * example:
   * Local
   */
  TYPE_RESEAU?: string;
  /**
   * example:
   * amenagement
   */
  TYPE_TRAVAUX_AGIR?: string;
  /**
   * example:
   * Dufresne (rue)
   */
  VOIE_A?: string;
  /**
   * example:
   * Fullum (rue)
   */
  VOIE_DE?: string;
  /**
   * example:
   * Crestson (rue)
   */
  PROJET_NOM_VOIE?: string;
  /**
   * example:
   * Dufresne (rue)
   */
  PROJET_VOIE_A?: string;
  /**
   * example:
   * Fullum (rue)
   */
  PROJET_VOIE_DE?: string;
  /**
   * example:
   * Project information category comment
   */
  PROJET_COMMENTAIRE_INFO?: string;
  /**
   * example:
   * Project requestor category comment
   */
  PROJET_COMMENTAIRE_REQ?: string;
  /**
   * example:
   * Project historic category comment
   */
  PROJET_COMMENTAIRE_HISTO?: string;
  /**
   * example:
   * Project requirements
   */
  PROJET_EXIGENCE?: string;
  /**
   * example:
   * Project temporal constraint comment
   */
  PROJET_CONTRAINTE?: string;
  /**
   * example:
   * 2553279.25
   */
  BUDGET_ANNEE_1?: number;
  /**
   * example:
   * 11852753
   */
  BUDGET_ANNEE_2?: number;
  /**
   * example:
   * 11852753
   */
  BUDGET_ANNEE_3?: number;
  /**
   * example:
   * 283301
   */
  NO_SOUMISSION?: string;
}
export interface IBorough {
  id: string;
  name: string;
}
export interface IBudget {
  allowance?: number;
  burnedDown?: number;
  balance?: number;
}
/**
 * input for comment
 */
export interface IComment {
  /**
   * code of the taxonomy corresponding to the group comment
   */
  categoryId: string;
  /**
   * the body content of the comment
   * example:
   * This is a comment
   */
  text: string;
  isPublic?: boolean;
  /**
   * states if shareable and readable from the referenced project sheet
   *
   */
  isProjectVisible?: boolean;
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  audit: IAudit;
}
/**
 * a conflictualItem write - read -
 */
export interface IConflictualItem {
  id: string;
  type: IConflictualType;
}
/**
 * Is a enum of intervention or a project
 * example:
 * intervention
 */
export type IConflictualType = 'intervention' | 'project';
/**
 * A base 64 server timestamp_id continuation token for syncing. {timestamp}-{id}
 * example:
 * MjAyMC0wMy0wM1QxNjoyOTo0MS03YzQ3NjUxYy1jNDM3LTQ0MDAtOWQ0Yi0wNTU5YmFlNWY4ZDI=
 */
export type IContinuationToken = string;
/**
 * The count of items based on a key.
 */
export interface ICountBy {
  /**
   * The id of the count by
   * example:
   * MTL
   */
  id?: any;
  /**
   * The number of items
   * example:
   * 96
   */
  count?: number;
}
export interface ICreated {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
}
/**
 * a date used a timestamp, start and end dates
 * example:
 * 2019-05-13T08:42:34Z
 */
export type IDate = string; // date-time
/**
 * the list of decision for an intervention
 */
export type IDecisionList = IInterventionDecision[];
export interface IDiagnosticsInfo {
  name: string;
  description: string;
  version: string;
}
export interface IDrmProject {
  projectId: string;
  drmNumber: string;
}
/**
 * An enriched annual program
 */
export interface IEnrichedAnnualProgram {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * The identifier of the executor. Comes from taxonomies.
   * example:
   * di
   */
  executorId: string;
  /**
   * The annual program's year.
   * example:
   * 2021
   */
  year: number;
  /**
   * The annual program's description
   * example:
   * Programmation annuelle pour la Direction des Infrastructures
   */
  description?: string;
  /**
   * The maximum budget cap in thousands of dollars for a project to be in the program book.
   * example:
   * 2000
   */
  budgetCap: number;
  sharedRoles?: string[];
  programBooks?: IEnrichedProgramBook[];
  /**
   * The annual program's status.
   * example:
   * new
   */
  status: string;
  audit: IAudit;
  /**
   * Tells whether the user has limited access to this annual program. Usually true when the user can see a program book but not the annual program info. When true only the id, executorId and the year are returned.
   */
  limitedAccess?: boolean;
}
/**
 * the attached document and metadata
 *
 */
export interface IEnrichedDocument {
  /**
   * code of the taxonomy corresponding to the group document type (*'type de fichier' dans les maquettes)
   *
   */
  type?: string;
  file?: string; // binary
  /**
   * example:
   * carte intervention
   */
  documentName: string;
  /**
   * states if shareable and readable from the referenced project sheet
   *
   */
  isProjectVisible?: boolean;
  /**
   * example:
   * carte intervention v.3.4
   */
  notes?: string;
  /**
   * 1. a document attached by a requestor requires the validation of an AGIR planner 2. a document attached by a planner is automatically validated 3. the attachment of a document to a project is always performed by a planner,
   *    so the document is automatically validated on the POST /project/{id}/document
   *
   */
  validationStatus?: 'pending' | 'validated' | 'refused';
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  audit: IAudit;
  /**
   * example:
   * carte intervention v.3.4.png
   */
  fileName: string;
}
/**
 * an enriched intervention feature
 */
export interface IEnrichedIntervention {
  id?: string;
  /**
   * must be a taxonomy code that belongs to group executor
   */
  executorId: string;
  externalReferenceIds?: IExternalReferenceId[];
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  medalId?: string;
  importRevisionDate?: string;
  /**
   * Nom de l'intervention
   * example:
   * Réparation borne d'incendie 2029
   */
  interventionName: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)
   * example:
   * follow-up
   */
  interventionTypeId: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)
   * example:
   * construction
   */
  workTypeId: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  requestorId: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  boroughId: string;
  /**
   * reinforced (populated && || validated) by the state machine
   */
  status?: string;
  /**
   * year the intervention is done
   * example:
   * 2021
   */
  interventionYear: number;
  /**
   * year the intervention is planned
   * example:
   * 2021
   */
  planificationYear: number;
  /**
   * year the intervention is supposedly completed
   * example:
   * 2021
   */
  endYear?: number;
  /**
   * code de taxonomie appartenant au groupe programType
   */
  programId?: string;
  /**
   * the contact for the intervention (text field for v1), the user identity by default as of v2 ++
   */
  contact?: string;
  assets: IAsset[];
  interventionArea: IInterventionArea;
  roadSections?: IFeatureCollection;
  importFlag?: string;
  version?: number;
  estimate: IBudget;
  annualDistribution?: IInterventionAnnualDistribution;
  project?: IProject;
  documents?: IEnrichedDocument[];
  decisions?: IInterventionDecision[];
  decisionRequired?: boolean;
  audit: IAudit;
  /**
   * Suggested street name
   */
  streetName?: string;
  /**
   * From limit of the street name
   */
  streetFrom?: string;
  /**
   * To limit of the street name
   */
  streetTo?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  roadNetworkTypeId?: string;
  moreInformationAudit?: IAudit;
  comments?: IComment[];
  designData?: IDesignData;
}
/**
 * the list of enriched content of an historical intervention feature
 */
export type IEnrichedInterventionHistory = IEnrichedIntervention[];
export interface IEnrichedNote {
  text: string;
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  audit: IAudit;
}
/**
 * The enriched objective. Contains the complete objective information.
 */
export interface IEnrichedObjective {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * The objective\'s name
   * example:
   * Budget de reconstruction des aqueducs
   */
  name: string;
  /**
   * The target type of objective
   * example:
   * bid
   */
  targetType: 'bid' | 'length' | 'budget';
  /**
   * The type of objective
   * example:
   * threshold
   */
  objectiveType: 'threshold' | 'performanceIndicator';
  /**
   * The requestor ID. Filters which projects will be part of the objective calculation.
   * example:
   * bell
   */
  requestorId?: string;
  /**
   * The asset type IDs. Filters which projects will be part of the objective calculation.
   * example:
   * fireHydrant,streetTree
   */
  assetTypeIds?: string[];
  /**
   * The work type IDs. Filters which projects will be part of the objective calculation.
   * example:
   * reconstruction,construction
   */
  workTypeIds?: string[];
  /**
   * The flag that indicate if the objective is a key objective for the program book.
   */
  pin?: boolean;
  values: IObjectiveValues;
  audit: IAudit;
}
export interface IEnrichedOpportunityNotice {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * the reference to the project
   */
  projectId: string;
  object: string;
  assets?: IAsset[];
  /**
   * requestorId must have taxonomy codes that belong to group requestor
   *
   */
  requestorId: string;
  contactInfo?: string;
  followUpMethod: string;
  maxIterations: number;
  status: string;
  audit: IAudit;
  notes?: IEnrichedNote[];
  response?: IEnrichedOpportunityNoticeResponse;
}
/**
 * a paginated collection of enriched opportunity notice
 */
export interface IEnrichedOpportunityNoticePaginated {
  paging?: IPaging;
  items?: IEnrichedOpportunityNotice[];
}
export interface IEnrichedOpportunityNoticeResponse {
  requestorDecision?: 'yes' | 'no' | 'analyzing';
  requestorDecisionNote?: string;
  requestorDecisionDate?: IDate; // date-time
  planningDecision?: 'accepted' | 'rejected';
  planningDecisionNote?: string;
  audit: IAudit;
}
/**
 * a paginated collection of interventions
 */
export interface IEnrichedPaginatedInterventions {
  paging?: IPaging;
  items?: IEnrichedIntervention[];
}
/**
 * a paginated collection of program books
 */
export interface IEnrichedPaginatedProgramBooks {
  paging?: IPaging;
  items?: IEnrichedProgramBook[];
}
/**
 * a paginated collection of enriched projects
 */
export interface IEnrichedPaginatedProjects {
  paging?: IPaging;
  items?: IEnrichedProject[];
}
export interface IEnrichedPriorityLevel {
  /**
   * priority rank. 1 is defined by the system
   *
   * example:
   * 2
   */
  rank: number;
  criteria: IPriorityLevelCriteria;
  /**
   * The sort criterias to apply on the projects for this priority level.
   */
  sortCriterias: IPriorityLevelSortCriteria[];
  isSystemDefined?: boolean;
  /**
   * Count of projects that match the criteria
   *
   */
  projectCount?: number;
}
/**
 * The enriched program book
 */
export interface IEnrichedProgramBook {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  annualProgramId: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * The name of the program book
   * example:
   * Carnet PI
   */
  name: string;
  /**
   * An array of the possible project types for this book. Acceptable values come from taxonomies.
   * example:
   * integrated,nonIntegrated
   */
  projectTypes: string[];
  /**
   * The name of the person in charge of the program book. Free text field.
   * example:
   * Olivier Chevrel
   */
  inCharge?: string;
  /**
   * An array of the possible boroughs for this book. Values from taxonomies.
   * example:
   * AC,SO
   */
  boroughIds?: string[];
  /**
   * A roles array that can see the program book
   * example:
   * ADMIN,PILOT
   */
  sharedRoles?: string[];
  /**
   * The status of the program book. Value from taxonomies.
   * example:
   * new
   */
  status: string;
  /**
   * An array of the possible programs for this book. Values from the taxonomy group programType.
   * example:
   * sae,pcpr
   */
  programTypes?: string[];
  /**
   * The description of the program book
   */
  description?: string;
  audit: IAudit;
  annualProgram?: IEnrichedAnnualProgram;
  objectives?: IEnrichedObjective[];
  projects?: IEnrichedPaginatedProjects;
  removedProjects?: IEnrichedPaginatedProjects;
  /**
   * An array of removed projects ids for this book.
   */
  removedProjectsIds?: string[];
  priorityScenarios?: IPriorityScenario[];
  /**
   * Indicates whether an automatic loading is in progress or not.
   */
  isAutomaticLoadingInProgress?: boolean;
}
/**
 * an enriched project feature
 */
export interface IEnrichedProject {
  /**
   * The project identifier
   */
  id?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  boroughId?: string;
  /**
   * year the project ends
   * example:
   * 2022
   */
  endYear?: number;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  executorId?: string;
  externalReferenceIds?: IExternalReferenceId[];
  geometry?: IGeometry;
  globalBudget?: IBudget;
  importFlag?: string;
  /**
   * Someone in charge of this project. Corresponds to requestors taxonomies
   */
  inChargeId?: string;
  interventionIds?: string[];
  servicePriorities?: IServicePriority[];
  /**
   * description du projet
   */
  projectName?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  projectTypeId?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  riskId?: string;
  /**
   * year the project starts
   * example:
   * 2021
   */
  startYear?: number;
  /**
   * taxonomy code that belong to projectStatus group
   */
  status?: string;
  /**
   * Suggested street name
   */
  streetName?: string;
  /**
   * taxonomy code that belong to projectSubCategory group
   */
  subCategoryIds?: string[];
  audit?: IAudit;
  moreInformationAudit?: IAudit;
  annualDistribution?: IEnrichedProjectAnnualDistribution;
  /**
   * example:
   * Jean Girard
   */
  contact?: string;
  decisions?: IProjectDecision[];
  documents?: IEnrichedDocument[];
  geometryPin?: IPoint;
  interventions?: IEnrichedIntervention[];
  length?: ILength;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  medalId?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  roadNetworkTypeId?: string;
  /**
   * From limit of the street name
   */
  streetFrom?: string;
  /**
   * To limit of the street name
   */
  streetTo?: string;
  /**
   * There is at least one opportunity notice created
   */
  isOpportunityAnalysis?: boolean;
  /**
   * The DRM number
   */
  drmNumber?: string;
  /**
   * The submission number
   */
  submissionNumber?: string;
  rtuExport?: IRtuExport;
  comments?: IComment[];
}
export interface IEnrichedProjectAnnualDistribution {
  distributionSummary?: IAnnualProjectDistributionSummary;
  annualPeriods?: IEnrichedProjectAnnualPeriod[];
}
export interface IEnrichedProjectAnnualPeriod {
  /**
   * calulated. must range between [0, (project.endYear - project.startYear)] years starts at index 0
   *
   * example:
   * 0
   */
  rank?: number;
  /**
   * calculated. the year of the annual period. allows searches and validations
   *
   * example:
   * 2022
   */
  year?: number;
  /**
   * the project must share the year with the programBook. example - a project planned between 2021 and 2023 have 3 annuals periods of three different years (2021, 2022, 2023) attached to their respective programBooks
   *
   */
  programBookId?: string;
  programBook?: IEnrichedProgramBook;
  /**
   * code of the taxonomy corresponding to the group annual period status (subset of project taxonomy statuses)
   *
   */
  status?: string;
  /**
   * calculated. code of the taxonomy corresponding to the projectCategory for that year
   *
   */
  categoryId?: string;
  /**
   * calculated. the sum of the annual project budget. write only for a non-geolocalized project
   *
   */
  annualBudget?: number; // amount
  additionalCosts?: IAdditionalCost[];
  /**
   * calculated. the sum of the additional costs for the year period.
   *
   */
  additionalCostsTotalBudget?: number; // amount
  /**
   * the list of interventions integrated in the project and programmed in the annualPeriod
   *
   */
  interventionIds?: string[];
  /**
   * calculated. the sum of the interventions costs for the year period.
   *
   */
  interventionsTotalBudget?: number; // amount
  /**
   * input for a non-geolocated project.
   *
   */
  annualAllowance?: number; // amount
  /**
   * the account external reference number (PTI program) for a non-geolocalized project
   *
   */
  accountId?: number;
}
export interface IEnrichedUserPreference {
  /**
   * The unique key of the user's preference
   */
  key: string;
  /**
   * Username
   */
  userId: string;
  /**
   * Can be anything: string, number, array, object, etc.
   */
  value: any;
  audit: IAudit;
}
export interface IErrorResponse {
  error: IApiError;
}
/**
 * an external intervention or project reference
 */
export interface IExternalReferenceId {
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  type: string;
  /**
   * the external id value
   */
  value: string;
}
/**
 * GeoJSon Feature
 */
export interface IFeature {
  type: 'Feature';
  id?: string | number;
  geometry: IGeometry;
  properties: any;
}
/**
 * GeoJSon Feature collection
 */
export interface IFeatureCollection {
  type: 'FeatureCollection';
  features: IFeature[];
}
export interface IGdaPrivileges {
  domain: string;
  application: string;
  role: string;
  permissions: string[];
  /**
   * A set of description
   */
  restrictions: {
    [name: string]: string | string[];
  };
}
/**
 * The report returned from the generateReport function
 */
export interface IGenerationReport {
  /**
   * The total amount of projects
   */
  totalProjects?: number;
  /**
   * The amount of successful generations
   */
  totalGenerations?: number;
}
/**
 * GeoJSon geometry object
 */
export interface IGeometry {
  type: IGeometryType;
  coordinates: IPoint | IMultiPoint | ILineString | IMultiLineString | IPolygon | IMultiPolygon;
}
/**
 * The type of the feature's geometry
 */
export type IGeometryType = 'Polygon' | 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'MultiPolygon';
/**
 * history for intervention and project
 */
export interface IHistory {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * This is type of the element the constraint is affected
   */
  objectTypeId: 'project' | 'intervention';
  referenceId: string;
  actionId: 'create' | 'update' | 'delete';
  /**
   * This is type of modification like constraint
   */
  categoryId?: string;
  summary: IHistorySummary;
  audit?: IAudit;
}
/**
 * An history for a modification on a intervention or a project
 */
export interface IHistorySummary {
  statusFrom?: string;
  statusTo?: string;
  comments?: string;
}
export interface IImportProjectRequest {
  bicProjects?: IBicProject[];
  features?: IFeature[];
}
export interface IInputDrmProject {
  projectIds: string[];
  isCommonDrmNumber: boolean;
}
/**
 * a number of day
 * example:
 * 365
 */
export type IInterval = string; // day-time
/**
 * the ventilation of the intervention within its related project
 *
 */
export interface IInterventionAnnualDistribution {
  distributionSummary?: IAnnualInterventionDistributionSummary;
  annualPeriods?: IInterventionAnnualPeriod[];
}
export interface IInterventionAnnualPeriod {
  /**
   * calulated. must range between [0, (project.endYear - project.startYear)] years starts at index 0
   *
   * example:
   * 0
   */
  rank?: number;
  /**
   * example:
   * 2022
   */
  year?: number;
  annualAllowance?: number; // amount
  annualLength?: number;
  /**
   * the account external reference number (PTI program)
   *
   */
  accountId?: number;
}
export interface IInterventionArea {
  isEdited?: boolean;
  geometry: IGeometry;
  geometryPin?: IPoint;
}
export interface IDesignData {
  // Type of the upstream asset. Must be a taxonomy code that belongs to the group assetType.
  upstreamAssetType?: string;
  // ID of the upstream asset.
  upstreamAssetId?: string;
  // Type of the downstream asset. Must be a taxonomy code that belongs to the group assetType.
  downstreamAssetType?: string;
  // ID of the downstream asset.
  downstreamAssetId?: string;
  comment?: string;
  contractRange?: string;
  audit: IAudit;
}
/**
 * The intervention count by request object.
 */
export interface IInterventionCountBySearchRequest {
  /**
   * The intervention ID to filter on.
   * example:
   * I4234
   */
  id?: IStringOrStringArray;
  /**
   * Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The program book ID to filter on.
   * example:
   * 5e6086dfc9be6a133486df67
   */
  programBookId?: IUuidOrUuidArray;
  /**
   * The program ID.
   * example:
   * prcpr
   */
  programId?: IStringOrStringArray;
  /**
   * The intervention type ID.
   * example:
   * initialNeed
   */
  interventionTypeId?: IStringOrStringArray;
  /**
   * The work type ID.
   * example:
   * reconstruction
   */
  workTypeId?: IStringOrStringArray;
  /**
   * The requestor ID.
   * example:
   * bell
   */
  requestorId?: IStringOrStringArray;
  /**
   * The borough ID.
   * example:
   * VRD
   */
  boroughId?: IStringOrStringArray;
  /**
   * The intervention status.
   * example:
   * planned
   */
  status?: IStringOrStringArray;
  /**
   * The intervention year to search.
   */
  interventionYear?: number;
  /**
   * The intervention year to search from.
   */
  fromInterventionYear?: number;
  /**
   * The intervention year to search to.
   */
  toInterventionYear?: number;
  /**
   * The planification year to search.
   */
  planificationYear?: number;
  /**
   * The planification year to search from.
   */
  fromPlanificationYear?: number;
  /**
   * The planification year to search to.
   */
  toPlanificationYear?: number;
  /**
   * The estimate to search.
   */
  estimate?: number;
  /**
   * The estimate to search from.
   */
  fromEstimate?: number;
  /**
   * The estimate to search to.
   */
  toEstimate?: number;
  /**
   * The asset ID.
   * example:
   * R134
   */
  assetId?: IStringOrStringArray;
  /**
   * The asset type ID.
   * example:
   * fireHydrant
   */
  assetTypeId?: IStringOrStringArray;
  /**
   * The asset owner ID.
   * example:
   * borough
   */
  assetOwnerId?: IStringOrStringArray;
  /**
   * The bbox for spatial search. A comma separated list of coordinates.
   * example:
   * -73.69024,45.494472,-73.531264,45.53972
   */
  interventionAreaBbox?: ISearchBbox;
  /**
   * The only possible value is 'null'. If null is specified, it will return interventions without projects.
   * example:
   * null
   */
  project?: string;
  /**
   * The executor ID.
   */
  executorId?: IStringOrStringArray;
  /**
   * The medal ID.
   */
  medalId?: IStringOrStringArray;
  decisionRequired?: boolean;
  /**
   * The object key to count the interventions by.
   */
  countBy: string;
  intersectGeometry?: IGeometry;
}
/**
 * The interventions extraction search request.
 */
export interface IInterventionExtractSearchRequest {
  /**
   * The planification year to search.
   */
  planificationYear: number;
  /**
   * Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The program ID.
   */
  programId?: string[];
  /**
   * The intervention type ID.
   */
  interventionTypeId?: string[];
  /**
   * The work type ID.
   */
  workTypeId?: string[];
  /**
   * The requestor ID.
   */
  requestorId?: string[];
  /**
   * The borough ID.
   */
  boroughId?: string[];
  /**
   * The decision typeId.
   */
  decisionTypeId?: string[];
  /**
   * The intervention status.
   */
  status?: string[];
  /**
   * The estimate to search from.
   */
  fromEstimate?: number;
  /**
   * The estimate to search to.
   */
  toEstimate?: number;
  /**
   * The executor ID.
   */
  executorId?: string[];
  /**
   * The medal ID.
   */
  medalId?: string[];
  /**
   * If a decision is required.
   */
  decisionRequired?: boolean;
  /**
   * The asset type ID.
   */
  assetTypeId?: string[];
  /**
   * Comma separated list or array of strings of fields/attributes to return.
   */
  fields: string[];
}

/**
 * The project search request object sent as a parameter.
 */
export interface IProjectExtractSearchRequest {
  /**
   * Search criteria used for the project ID, project's name, project's DRM number and project's submission number. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The program book ID to filter on.
   */
  programBookId?: IUuid[];
  /**
   * The project type ID.
   */
  projectTypeId?: string[];
  /**
   * The executor ID.
   */
  executorId?: string[];
  /**
   * The project category ID.
   */
  categoryId?: string[];
  /**
   * The project sub-category ID.
   */
  subCategoryId?: string[];
  /**
   * The borough ID.
   */
  boroughId?: string[];
  /**
   *  The status of the project.
   */
  status?: string[];
  /**
   *  The year to search.
   */
  year: number;
  /**
   *  The budget to search from.
   */
  fromBudget?: number;
  /**
   *  The budget to search to.
   */
  toBudget?: number;
  /**
   *  The workType ID.
   */
  workTypeId?: string[];
  /**
   *  The medal ID.
   */
  medalId?: string[];
  /**
   *  Code(s) of the taxonomy corresponding to the group programType
   */
  interventionProgramId?: string[];
  /**
   * Code(s) of the taxonomy corresponding to the group assetType.
   */
  interventionAssetTypeId?: IStringOrStringArray;
  /**
   *  The submission number.
   */
  submissionNumber?: string[];
  /**
   *  Boolean whether the request should only return geolocated or non-geolocated projects.
   */
  isGeolocated?: boolean;
  /**
   *  Comma separated list or array of strings of fields/attributes to return.
   */
  fields: string[];
}

/**
 * a decision attached to an intervention or project
 */
export interface IInterventionDecision {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
  previousPlanificationYear?: number;
  /**
   * code of the taxonomy corresponding to the group intervention decision type
   */
  typeId: string;
  /**
   * project year and/or intervention year change
   * example:
   * 2021
   */
  targetYear?: number;
  /**
   * the body content of the rational
   * example:
   * Replanned in 2025 for a good reason
   */
  text: string;
  /**
   * code of the taxonomy corresponding to the group refusalReason
   */
  refusalReasonId?: string;
  audit?: IAudit;
}
/**
 * The intervention search request object sent as a parameter.
 */
export interface IInterventionPaginatedSearchRequest {
  /**
   * The intervention ID to filter on.
   * example:
   * I4234
   */
  id?: IStringOrStringArray;
  /**
   * Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The program book ID to filter on.
   * example:
   * 5e6086dfc9be6a133486df67
   */
  programBookId?: IUuidOrUuidArray;
  /**
   * The program ID.
   * example:
   * prcpr
   */
  programId?: IStringOrStringArray;
  /**
   * The intervention type ID.
   * example:
   * initialNeed
   */
  interventionTypeId?: IStringOrStringArray;
  /**
   * The work type ID.
   * example:
   * reconstruction
   */
  workTypeId?: IStringOrStringArray;
  /**
   * The requestor ID.
   * example:
   * bell
   */
  requestorId?: IStringOrStringArray;
  /**
   * The borough ID.
   * example:
   * VRD
   */
  boroughId?: IStringOrStringArray;
  /**
   * The decisionTypeId (decisions.typeId).
   * values from InterventionDecisionType
   * example:
   * revisionRequest
   */
  decisionTypeId?: IStringOrStringArray;
  /**
   * The intervention status.
   * example:
   * planned
   */
  status?: IStringOrStringArray;
  /**
   * The intervention year to search.
   */
  interventionYear?: number;
  /**
   * The intervention year to search from.
   */
  fromInterventionYear?: number;
  /**
   * The intervention year to search to.
   */
  toInterventionYear?: number;
  /**
   * The planification year to search.
   */
  planificationYear?: number;
  /**
   * The planification year to search from.
   */
  fromPlanificationYear?: number;
  /**
   * The planification year to search to.
   */
  toPlanificationYear?: number;
  /**
   * The estimate to search.
   */
  estimate?: number;
  /**
   * The estimate to search from.
   */
  fromEstimate?: number;
  /**
   * The estimate to search to.
   */
  toEstimate?: number;
  /**
   * The asset ID.
   * example:
   * R134
   */
  assetId?: IStringOrStringArray;
  /**
   * The asset type ID.
   * example:
   * fireHydrant
   */
  assetTypeId?: IStringOrStringArray;
  /**
   * The asset owner ID.
   * example:
   * borough
   */
  assetOwnerId?: IStringOrStringArray;
  /**
   * The bbox for spatial search. A comma separated list of coordinates.
   * example:
   * -73.69024,45.494472,-73.531264,45.53972
   */
  interventionAreaBbox?: ISearchBbox;
  /**
   * The only possible value is 'null'. If null is specified, it will return interventions without projects.
   * example:
   * null
   */
  project?: string;
  /**
   * The executor ID.
   */
  executorId?: IStringOrStringArray;
  /**
   * The medal ID.
   */
  medalId?: IStringOrStringArray;
  decisionRequired?: boolean;
  /**
   * The number of items to return
   */
  limit?: number;
  /**
   * The result offset for pagination.
   */
  offset?: number;
  /**
   * Sort results, for example:
   * -estimate,priority
   *
   */
  orderBy?: string;
  /**
   * The expand parameters for more information to be brought back.
   * example:
   * project
   */
  expand?: IStringOrStringArray;
  /**
   * Comma separated list or array of strings of fields/attributes to return
   * example:
   * interventionTypeId,boroughId
   */
  fields?: IStringOrStringArray;
  intersectGeometry?: IGeometry;
}
/**
 * The intervention search request.
 */
export interface IInterventionSearchRequest {
  /**
   * The intervention ID to filter on.
   * example:
   * I4234
   */
  id?: IStringOrStringArray;
  /**
   * Search criteria used for the intervention ID and intervention's name. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The program book ID to filter on.
   * example:
   * 5e6086dfc9be6a133486df67
   */
  programBookId?: IUuidOrUuidArray;
  /**
   * The program ID.
   * example:
   * prcpr
   */
  programId?: IStringOrStringArray;
  /**
   * The intervention type ID.
   * example:
   * initialNeed
   */
  interventionTypeId?: IStringOrStringArray;
  /**
   * The work type ID.
   * example:
   * reconstruction
   */
  workTypeId?: IStringOrStringArray;
  /**
   * The requestor ID.
   * example:
   * bell
   */
  requestorId?: IStringOrStringArray;
  /**
   * The borough ID.
   * example:
   * VRD
   */
  boroughId?: IStringOrStringArray;
  /**
   * The decisionTypeId (decisions.typeId).
   * values from InterventionDecisionType
   * example:
   * revisionRequest
   */
  decisionTypeId?: IStringOrStringArray;
  /**
   * The intervention status.
   * example:
   * planned
   */
  status?: IStringOrStringArray;
  /**
   * The intervention year to search.
   */
  interventionYear?: number;
  /**
   * The intervention year to search from.
   */
  fromInterventionYear?: number;
  /**
   * The intervention year to search to.
   */
  toInterventionYear?: number;
  /**
   * The planification year to search.
   */
  planificationYear?: number;
  /**
   * The planification year to search from.
   */
  fromPlanificationYear?: number;
  /**
   * The planification year to search to.
   */
  toPlanificationYear?: number;
  /**
   * The estimate to search.
   */
  estimate?: number;
  /**
   * The estimate to search from.
   */
  fromEstimate?: number;
  /**
   * The estimate to search to.
   */
  toEstimate?: number;
  /**
   * The asset ID.
   * example:
   * R134
   */
  assetId?: IStringOrStringArray;
  /**
   * The asset type ID.
   * example:
   * fireHydrant
   */
  assetTypeId?: IStringOrStringArray;
  /**
   * The asset owner ID.
   * example:
   * borough
   */
  assetOwnerId?: IStringOrStringArray;
  /**
   * The bbox for spatial search. A comma separated list of coordinates.
   * example:
   * -73.69024,45.494472,-73.531264,45.53972
   */
  interventionAreaBbox?: ISearchBbox;
  /**
   * The only possible value is 'null'. If null is specified, it will return interventions without projects.
   * example:
   * null
   */
  project?: string;
  /**
   * The executor ID.
   */
  executorId?: IStringOrStringArray;
  /**
   * The medal ID.
   */
  medalId?: IStringOrStringArray;
  decisionRequired?: boolean;
  intersectGeometry?: IGeometry;
}
export interface ILastIntervention {
  id: string;
  planificationYear: number;
}
export interface ILength {
  value?: number;
  unit?: 'm' | 'ft';
}
export type ILineString = IPoint3D[];
export interface ILocalizedText {
  fr?: string;
  en?: string;
}
export type IMultiLineString = ILineString[];
export type IMultiPoint = IPoint[];
export type IMultiPolygon = IPolygon[];
/**
 * a NEXO import file
 */
export interface INexoImportFile {
  id: string;
  name: string;
  contentType: string;
  /**
   * must be a taxonomy code that belongs to group nexoFileType
   */
  type: string;
  /**
   * must be a taxonomy code that belongs to group nexoImportStatus
   */
  status: string;
  numberOfItems?: number;
  errorDescription?: string;
  projects?: INexoLogProject[];
  interventions?: INexoLogIntervention[];
}
/**
 * a NEXO import log
 */
export interface INexoImportLog {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  audit: IAudit;
  /**
   * must be a taxonomy code that belongs to group nexoImportStatus
   */
  status: string;
  files: INexoImportFile[];
}
export interface INexoLogIntervention {
  lineNumber: number;
  id: string;
  /**
   * must be a taxonomy code that belongs to group nexoImportStatus
   */
  importStatus: string;
  /**
   * must be a taxonomy code that belongs to group modificationType
   */
  modificationType?: string;
  description?: string;
}
export interface INexoLogProject {
  id: string;
  /**
   * must be a taxonomy code that belongs to group nexoImportStatus
   */
  importStatus: string;
  /**
   * must be a taxonomy code that belongs to group modificationType
   */
  modificationType?: string;
  description?: string;
}
export interface IObjective {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  organizationId?: string;
  length?: number;
  types?: string[];
  budget?: number;
  year?: number;
  audit?: IAudit;
}
export interface IObjectiveCalculation {
  objectiveId: IUuid; // ^[\.@!0-9a-fA-Z]*$
  objectiveSum: number;
  objectivePercent: number;
}
/**
 * The objective values. Contains the reference and the calclated values.
 */
export interface IObjectiveValues {
  /**
   * The calculated value. This is the current actual value of the objective.
   * example:
   * 10
   */
  calculated: number;
  /**
   * The reference value. This is the target value of the objective.
   * example:
   * 29
   */
  reference: number;
}
export interface IOrderedProject {
  /**
   * example:
   * P00001
   */
  projectId?: string;
  /**
   * level rank, must be 1 or higher
   *
   * example:
   * 1
   */
  levelRank?: number;
  /**
   * initial rank, must be 1 or higher
   *
   * example:
   * 1
   */
  initialRank?: number;
  /**
   * project rank, start at 1
   *
   * example:
   * 1
   */
  rank?: number;
  /**
   * Manually ordered rank indicator
   *
   */
  isManuallyOrdered?: boolean;
  /**
   * note to justified the rank change
   *
   */
  note?: string;
  audit?: IAudit;
  objectivesCalculation?: IObjectiveCalculation[];
}
/**
 * The ordered project search request object sent as a parameter.
 */
export interface IOrderedProjectsPaginatedSearchRequest {
  /**
   * The number of items to return
   */
  projectLimit?: number;
  /**
   * The result offset for pagination.
   */
  projectOffset?: number;
  /**
   * Sort results, for example:
   * -initialRank
   *
   */
  projectOrderBy?: string;
}
/**
 * a paginated collection of import logs
 */
export interface IPaginatedBicImportLogs {
  paging?: IPaging;
  items?: IBicImportLog[];
}
/**
 * a paginated collection of enriched projects
 */
export interface IPaginatedOrderedProjects {
  paging?: IPaging;
  items?: IOrderedProject[];
}
/**
 * a paginated collection of RTU projects
 */
export interface IPaginatedRtuProjects {
  paging?: IPaging;
  items?: IRtuProject[];
}
export interface IPaging {
  offset?: number;
  limit?: number;
  totalCount?: number;
}
/**
 * An enriched annual program
 */
export interface IPlainAnnualProgram {
  /**
   * The identifier of the executor. Comes from taxonomies.
   * example:
   * di
   */
  executorId: string;
  /**
   * The annual program's year.
   * example:
   * 2021
   */
  year: number;
  /**
   * The annual program's description
   * example:
   * Programmation annuelle pour la Direction des Infrastructures
   */
  description?: string;
  /**
   * The maximum budget cap in thousands of dollars for a project to be in the program book.
   * example:
   * 2000
   */
  budgetCap: number;
  sharedRoles?: string[];
  /**
   * The annual program's status.
   * example:
   * new
   */
  status?: string;
}
/**
 * input for comment
 */
export interface IPlainComment {
  /**
   * code of the taxonomy corresponding to the group comment
   */
  categoryId: string;
  /**
   * the body content of the comment
   * example:
   * This is a comment
   */
  text: string;
  isPublic?: boolean;
  /**
   * states if shareable and readable from the referenced project sheet
   *
   */
  isProjectVisible?: boolean;
}
/**
 * the attached document and metadata
 *
 */
export interface IPlainDocument {
  /**
   * code of the taxonomy corresponding to the group document type (*'type de fichier' dans les maquettes)
   *
   */
  type?: string;
  file?: string; // binary
  /**
   * example:
   * carte intervention
   */
  documentName: string;
  /**
   * states if shareable and readable from the referenced project sheet
   *
   */
  isProjectVisible?: boolean;
  /**
   * example:
   * carte intervention v.3.4
   */
  notes?: string;
  /**
   * 1. a document attached by a requestor requires the validation of an AGIR planner 2. a document attached by a planner is automatically validated 3. the attachment of a document to a project is always performed by a planner,
   *    so the document is automatically validated on the POST /project/{id}/document
   *
   */
  validationStatus?: 'pending' | 'validated' | 'refused';
}
/**
 * a plain intervention feature write - for taxonomyCode read -
 */
export interface IPlainIntervention {
  id?: string;
  /**
   * must be a taxonomy code that belongs to group executor
   */
  executorId: string;
  externalReferenceIds?: IExternalReferenceId[];
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  medalId?: string;
  importRevisionDate?: string;
  /**
   * Nom de l'intervention
   * example:
   * Réparation borne d'incendie 2029
   */
  interventionName: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO (follow-up, intervention)
   * example:
   * follow-up
   */
  interventionTypeId: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO (construction or rehabilitation)
   * example:
   * construction
   */
  workTypeId: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  requestorId: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  boroughId: string;
  /**
   * reinforced (populated && || validated) by the state machine
   */
  status?: string;
  /**
   * year the intervention is done
   * example:
   * 2021
   */
  interventionYear: number;
  /**
   * year the intervention is planned
   * example:
   * 2021
   */
  planificationYear: number;
  /**
   * year the intervention is supposedly completed
   * example:
   * 2021
   */
  endYear?: number;
  /**
   * the initial work estimate in dollars
   * example:
   * 100000
   */
  estimate: number;
  /**
   * code de taxonomie appartenant au groupe programType
   */
  programId?: string;
  /**
   * the contact for the intervention (text field for v1), the user identity by default as of v2 ++
   */
  contact?: string;
  assets: IAsset[];
  interventionArea: IInterventionArea;
  roadSections?: IFeatureCollection;
  importFlag?: string;
  decisionRequired?: boolean;
  audit?: IAudit;
}
/**
 * a NEXO import file
 */
export interface IPlainNexoImportFile {
  file: string; // binary
  /**
   * must be a taxonomy code that belongs to group nexoFileType
   */
  fileType: string;
}
export interface IPlainNote {
  text: string;
}
/**
 * The plain objective. Used to create or update objectives.
 */
export interface IPlainObjective {
  /**
   * The objective\'s name
   * example:
   * Budget de reconstruction des aqueducs
   */
  name: string;
  /**
   * The target type of objective
   * example:
   * bid
   */
  targetType: 'bid' | 'length' | 'budget';
  /**
   * The type of objective
   * example:
   * threshold
   */
  objectiveType: 'threshold' | 'performanceIndicator';
  /**
   * The requestor ID. Filters which projects will be part of the objective calculation.
   * example:
   * bell
   */
  requestorId?: string;
  /**
   * The asset type IDs. Filters which projects will be part of the objective calculation.
   * example:
   * fireHydrant,streetTree
   */
  assetTypeIds?: string[];
  /**
   * The work type IDs. Filters which projects will be part of the objective calculation.
   * example:
   * reconstruction,construction
   */
  workTypeIds?: string[];
  /**
   * The flag that indicate if the objective is a key objective for the program book.
   */
  pin?: boolean;
  /**
   * The reference value. This is the target value of the objective.
   * example:
   * 29
   */
  referenceValue: number;
}
/**
 * The opportunity notice. Used to create or update opportunity notice.
 */
export interface IPlainOpportunityNotice {
  /**
   * the reference to the project
   */
  projectId: string;
  object: string;
  assets?: IAsset[];
  /**
   * requestorId must have taxonomy codes that belong to group requestor
   *
   */
  requestorId: string;
  contactInfo?: string;
  followUpMethod: string;
  maxIterations: number;
  notes?: IPlainNote[];
  response?: IPlainOpportunityNoticeResponse;
}
export interface IPlainOpportunityNoticeResponse {
  requestorDecision?: 'yes' | 'no' | 'analyzing';
  requestorDecisionNote?: string;
  requestorDecisionDate?: IDate; // date-time
  planningDecision?: 'accepted' | 'rejected';
  planningDecisionNote?: string;
}
/**
 * a paginated collection of interventions
 */
export interface IPlainPaginatedInterventions {
  paging?: IPaging;
  items?: IPlainIntervention[];
}
/**
 * a paginated collection of plain projects
 */
export interface IPlainPaginatedProjects {
  paging?: IPaging;
  items?: IPlainProject[];
}
export interface IPlainPriorityLevel {
  /**
   * priority rank. 1 is defined by the system
   *
   * example:
   * 2
   */
  rank: number;
  criteria: IPriorityLevelCriteria;
  /**
   * The sort criterias to apply on the projects for this priority level.
   */
  sortCriterias: IPriorityLevelSortCriteria[];
}
/**
 * The plain version program book
 */
export interface IPlainProgramBook {
  /**
   * The name of the program book
   * example:
   * Carnet PI
   */
  name: string;
  /**
   * An array of the possible project types for this book. Acceptable values come from taxonomies.
   * example:
   * integrated,nonIntegrated
   */
  projectTypes: string[];
  /**
   * The name of the person in charge of the program book. Free text field.
   * example:
   * Olivier Chevrel
   */
  inCharge?: string;
  /**
   * An array of the possible boroughs for this book. Values from taxonomies.
   * example:
   * AC,SO
   */
  boroughIds?: string[];
  /**
   * A roles array that can see the program book
   * example:
   * ADMIN,PILOT
   */
  sharedRoles?: string[];
  /**
   * The status of the program book. Value from taxonomies.
   * example:
   * new
   */
  status?: string;
  /**
   * An array of the possible programs for this book. Values from the taxonomy group programType.
   * example:
   * sae,pcpr
   */
  programTypes?: string[];
  /**
   * The description of the program book
   */
  description?: string;
}
/**
 * a plain project feature
 */
export interface IPlainProject {
  /**
   * The project identifier
   */
  id?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  boroughId: string;
  /**
   * year the project ends
   * example:
   * 2022
   */
  endYear: number;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  executorId: string;
  externalReferenceIds?: IExternalReferenceId[];
  geometry?: IGeometry;
  globalBudget?: IBudget;
  importFlag?: string;
  /**
   * Someone in charge of this project. Corresponds to requestors taxonomies
   */
  inChargeId?: string;
  interventionIds?: string[];
  servicePriorities?: IServicePriority[];
  /**
   * description du projet
   */
  projectName?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  projectTypeId?: string;
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  riskId?: string;
  /**
   * year the project starts
   * example:
   * 2021
   */
  startYear: number;
  /**
   * taxonomy code that belong to projectStatus group
   */
  status?: string;
  /**
   * Suggested street name
   */
  streetName?: string;
  /**
   * taxonomy code that belong to projectSubCategory group
   */
  subCategoryIds?: string[];
  annualPeriods?: IPlainProjectAnnualPeriod[];
  annualProjectDistributionSummary?: IPlainProjectAnnualDistributionSummary;
}
export interface IPlainProjectAnnualDistribution {
  annualProjectDistributionSummary?: IPlainProjectAnnualDistributionSummary;
  annualPeriods?: IPlainProjectAnnualPeriod[];
}
export interface IPlainProjectAnnualDistributionSummary {
  additionalCostsNotes?: IAdditionalCostsTotalAmount[];
  totalAnnualBudgetNote?: string;
}
export interface IPlainProjectAnnualPeriod {
  additionalCosts?: IAdditionalCost[];
  annualPeriodInterventions?: IAnnualPeriodInterventions[];
  /**
   * input for a non-geolocated project.
   *
   */
  annualAllowance?: number; // amount
  /**
   * the account external reference number (PTI program) for a non-geolocalized project
   *
   */
  accountId?: number;
  /**
   * calculated. the year of the annual period. allows searches and validations
   *
   * example:
   * 2022
   */
  year?: number;
}
/**
 * A constraint or technical requirement.
 */
export interface IPlainRequirement {
  /**
   * The requirement type. Must be a taxonomy code that belongs to the group requirementType.
   */
  typeId: string;
  /**
   * The requirement subtype. Must be a taxonomy code that belongs to the group requirementSubtype.
   */
  subtypeId: string;
  /**
   * The requirement description.
   */
  text: string;
  /**
   * Items of the requirement. Must contain at least one item and at most two items.
   */
  items: IRequirementItem[];
}
export interface IPlainUserPreference {
  /**
   * Can be anything: string, number, array, object, etc.
   */
  value: any;
}
export type IPoint = IPoint3D;
/**
 * Point in 3D space
 */
export type IPoint3D = number[];
export type IPolygon = IPoint3D[][];
export interface IPriority {
  id?: number;
  weights?: IPriorityWeight[];
  audit?: IAudit;
}
/**
 * priority level criteria
 *
 */
export interface IPriorityLevelCriteria {
  projectCategory?: IProjectCategoryCriteria[];
  /**
   * workTypeId must have taxonomy codes that belong to group workType
   *
   */
  workTypeId?: string[];
  /**
   * requestorId must have taxonomy codes that belong to group requestor
   *
   */
  requestorId?: string[];
  /**
   * assetTypeId must have taxonomy codes that belong to group assetType
   *
   */
  assetTypeId?: string[];
  /**
   * interventionType must have taxonomy codes that belong to the group interventionType
   */
  interventionType?: string[];
  servicePriorities?: IServicePriority[];
}
/**
 * a sort criteria of a priority level
 */
export interface IPriorityLevelSortCriteria {
  /**
   * The name of the sort criteria
   * example:
   * roadNetworkType
   */
  name: string;
  /**
   * service must be a taxonomy code that belongs to group service
   * example:
   * se
   */
  service?: string;
  /**
   * The rank of the sort criteria
   * example:
   * 1
   */
  rank: number;
}
export interface IPriorityScenario {
  id?: string;
  name?: string;
  priorityLevels?: IEnrichedPriorityLevel[];
  orderedProjects?: IPaginatedOrderedProjects;
  isOutdated?: boolean;
  status?: string;
  audit?: IAudit;
}
export interface IPriorityWeight {
  id?: number;
  /**
   * example:
   * 100
   */
  code?: number;
  /**
   * example:
   * 1
   */
  value?: number;
}
export interface IProgressHistoryItem {
  /**
   * Must be a taxonomy code that belongs to group submissionProgressStatus.
   */
  progressStatus: string;
  createdAt: IDate; // date-time
  createdBy: IAuthor;
}
export interface IStatusHistoryItem {
  status: string;
  comment: string;
  createdAt: IDate; // date-time
  createdBy: IAuthor;
}
/**
 * the project integration
 */
export interface IProject {
  id?: IReferenceId; // ^[\.@!0-9a-fA-Z]*$
  /**
   * code de taxonomie appartenant au groupe GROUPE_TAXO
   */
  typeId?: string;
}
export interface IProjectCategory {
  year: number; // ^\d{4}$
  /**
   * code de taxonomie appartenant au groupe projectCategory
   */
  categoryId: string;
}
export interface IProjectCategoryCriteria {
  /**
   * category must have taxonomy code that belongs to the group projectCategory
   */
  category: string;
  /**
   * subCategory must have taxonomy code that belongs to the groupe projectSubCategory
   */
  subCategory?: string;
}
/**
 * The project count by request object.
 */
export interface IProjectCountBySearchRequest {
  /**
   * Search criteria used for the project ID, project's name, project's DRM number and project's submission number. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The project ID.
   * example:
   * P15234, ['P00001', 'P00002']
   */
  id?: IStringOrStringArray;
  /**
   * The program book ID to filter on.
   * example:
   * 5e6086dfc9be6a133486df67
   */
  programBookId?: IUuidOrUuidArray;
  /**
   * The project type ID.
   */
  projectTypeId?: string | string[];
  /**
   * The executor ID.
   */
  executorId?: IStringOrStringArray;
  fromYear?: number; // ^\d{4}$
  /**
   * The project category ID.
   */
  categoryId?: IStringOrStringArray;
  /**
   * The project sub-category ID.
   */
  subCategoryId?: IStringOrStringArray;
  /**
   * The borough ID.
   * example:
   * VRD
   */
  boroughId?: IStringOrStringArray;
  /**
   * The status of the project.
   */
  status?: string | string[];
  /**
   * The start year to search from.
   */
  startYear?: number;
  /**
   * The year to search from.
   */
  fromStartYear?: number;
  /**
   * The year to search to.
   */
  toStartYear?: number;
  /**
   * The end year to search from.
   */
  endYear?: number;
  /**
   * The year to search from.
   */
  fromEndYear?: number;
  /**
   * The year to search to.
   */
  toEndYear?: number;
  /**
   * The bbox for spatial search. A comma separated list of coordinates.
   */
  bbox?: string;
  /**
   * The budget to search from.
   */
  fromBudget?: number;
  /**
   * The budget to search.
   */
  budget?: number;
  /**
   * The budget to search to.
   */
  toBudget?: number;
  /**
   * code of the taxonomy corresponding to the group requestor
   */
  inChargeId?: IStringOrStringArray;
  /**
   * The workType ID.
   * example:
   * rehabilitation
   */
  workTypeId?: IStringOrStringArray;
  /**
   * Boolean whether the request should only return non-geolocated projects
   */
  isGeolocated?: boolean;
  /**
   * The medal ID.
   */
  medalId?: IStringOrStringArray;
  /**
   * Code(s) of the taxonomy corresponding to the group programType
   */
  interventionProgramId?: IStringOrStringArray;
  /**
   * Code(s) of the taxonomy corresponding to the group assetType.
   */
  interventionAssetTypeId?: IStringOrStringArray;
  /**
   * The submission number.
   */
  submissionNumber?: IStringOrStringArray;
  /**
   * Unwanted ids
   */
  excludeIds?: IStringOrStringArray;
  intersectGeometry?: IGeometry;
  /**
   * The object key to count the projects by.
   */
  countBy: string;
}
/**
 * a decision attached to an intervention or project
 */
export interface IProjectDecision {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * code of the taxonomy corresponding to the group project decision type
   */
  typeId: string;
  /**
   * project year and/or intervention year change
   * example:
   * 2021
   */
  startYear?: number;
  /**
   * project year and/or intervention year change
   * example:
   * 2022
   */
  endYear?: number;
  /**
   * example:
   * 2020
   */
  previousStartYear?: number;
  /**
   * example:
   * 2021
   */
  previousEndYear?: number;
  /**
   * example:
   * 2021
   */
  annualPeriodYear?: number;
  /**
   * the body content of the rational
   * example:
   * Replanned in 2025 for some good reason
   */
  text: string;
  audit?: IAudit;
}
export interface IProjectIdRequest {
  projectId: string;
}
/**
 * The project search request object sent as a parameter.
 */
export interface IProjectPaginatedSearchRequest {
  /**
   * Search criteria used for the project ID, project's name, project's DRM number and project's submission number. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The project ID.
   * example:
   * P15234, ['P00001', 'P00002']
   */
  id?: IStringOrStringArray;
  /**
   * The program book ID to filter on.
   * example:
   * 5e6086dfc9be6a133486df67
   */
  programBookId?: IUuidOrUuidArray;
  /**
   * The project type ID.
   */
  projectTypeId?: string | string[];
  /**
   * The executor ID.
   */
  executorId?: IStringOrStringArray;
  fromYear?: number; // ^\d{4}$
  /**
   * The project category ID.
   */
  categoryId?: IStringOrStringArray;
  /**
   * The project sub-category ID.
   */
  subCategoryId?: IStringOrStringArray;
  /**
   * The borough ID.
   * example:
   * VRD
   */
  boroughId?: IStringOrStringArray;
  /**
   * The status of the project.
   */
  status?: string | string[];
  /**
   * The start year to search from.
   */
  startYear?: number;
  /**
   * The year to search from.
   */
  fromStartYear?: number;
  /**
   * The year to search to.
   */
  toStartYear?: number;
  /**
   * The end year to search from.
   */
  endYear?: number;
  /**
   * The year to search from.
   */
  fromEndYear?: number;
  /**
   * The year to search to.
   */
  toEndYear?: number;
  /**
   * The bbox for spatial search. A comma separated list of coordinates.
   */
  bbox?: string;
  /**
   * The budget to search from.
   */
  fromBudget?: number;
  /**
   * The budget to search.
   */
  budget?: number;
  /**
   * The budget to search to.
   */
  toBudget?: number;
  /**
   * code of the taxonomy corresponding to the group requestor
   */
  inChargeId?: IStringOrStringArray;
  /**
   * The workType ID.
   * example:
   * rehabilitation
   */
  workTypeId?: IStringOrStringArray;
  /**
   * Boolean whether the request should only return non-geolocated projects
   */
  isGeolocated?: boolean;
  /**
   * The medal ID.
   */
  medalId?: IStringOrStringArray;
  /**
   * Code(s) of the taxonomy corresponding to the group programType
   */
  interventionProgramId?: IStringOrStringArray;
  /**
   * Code(s) of the taxonomy corresponding to the group assetType.
   */
  interventionAssetTypeId?: IStringOrStringArray;
  /**
   * The submission number.
   */
  submissionNumber?: IStringOrStringArray;
  /**
   * Unwanted ids
   */
  excludeIds?: IStringOrStringArray;
  intersectGeometry?: IGeometry;
  /**
   * The number of items to return
   */
  limit?: number;
  /**
   * The result offset for pagination.
   */
  offset?: number;
  /**
   * The expand parameters for more information to be brought back.
   */
  expand?: string | string[];
  /**
   * Comma separated list or array of strings of fields/attributes to return
   */
  fields?: string | string[];
  /**
   * Sort results, for example:
   * -estimate,priority
   *
   */
  orderBy?: string;
}
export interface IProjectRank {
  /**
   * new rank, must be 1 or higher
   *
   * example:
   * 1
   */
  newRank?: number;
  /**
   * manually ordered rank indicator
   *
   * example:
   * true
   */
  isManuallyOrdered?: boolean;
  note?: string;
}
/**
 * The project search request object sent as a parameter.
 */
export interface IProjectSearchRequest {
  /**
   * Search criteria used for the project ID, project's name, project's DRM number and project's submission number. Checks if it contains the search criteria.
   */
  q?: string;
  /**
   * The project ID.
   * example:
   * P15234, ['P00001', 'P00002']
   */
  id?: IStringOrStringArray;
  /**
   * The program book ID to filter on.
   * example:
   * 5e6086dfc9be6a133486df67
   */
  programBookId?: IUuidOrUuidArray;
  /**
   * The project type ID.
   */
  projectTypeId?: string | string[];
  /**
   * The executor ID.
   */
  executorId?: IStringOrStringArray;
  fromYear?: number; // ^\d{4}$
  /**
   * The project category ID.
   */
  categoryId?: IStringOrStringArray;
  /**
   * The project sub-category ID.
   */
  subCategoryId?: IStringOrStringArray;
  /**
   * The borough ID.
   * example:
   * VRD
   */
  boroughId?: IStringOrStringArray;
  /**
   * The status of the project.
   */
  status?: string | string[];
  /**
   * The start year to search from.
   */
  startYear?: number;
  /**
   * The year to search from.
   */
  fromStartYear?: number;
  /**
   * The year to search to.
   */
  toStartYear?: number;
  /**
   * The end year to search from.
   */
  endYear?: number;
  /**
   * The year to search from.
   */
  fromEndYear?: number;
  /**
   * The year to search to.
   */
  toEndYear?: number;
  /**
   * The bbox for spatial search. A comma separated list of coordinates.
   */
  bbox?: string;
  /**
   * The budget to search from.
   */
  fromBudget?: number;
  /**
   * The budget to search.
   */
  budget?: number;
  /**
   * The budget to search to.
   */
  toBudget?: number;
  /**
   * code of the taxonomy corresponding to the group requestor
   */
  inChargeId?: IStringOrStringArray;
  /**
   * The workType ID.
   * example:
   * rehabilitation
   */
  workTypeId?: IStringOrStringArray;
  /**
   * Boolean whether the request should only return non-geolocated projects
   */
  isGeolocated?: boolean;
  /**
   * The medal ID.
   */
  medalId?: IStringOrStringArray;
  /**
   * Code(s) of the taxonomy corresponding to the group programType
   */
  interventionProgramId?: IStringOrStringArray;
  /**
   * Code(s) of the taxonomy corresponding to the group assetType.
   */
  interventionAssetTypeId?: IStringOrStringArray;
  /**
   * The submission number.
   */
  submissionNumber?: IStringOrStringArray;
  /**
   * Unwanted ids
   */
  excludeIds?: IStringOrStringArray;
  intersectGeometry?: IGeometry;
}
/**
 * The external reference id of the object
 * example:
 * 28.12
 */
export type IReferenceId = string; // ^[\.@!0-9a-fA-Z]*$
/**
 * The enriched requirement
 */
export interface IRequirement {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  audit: IAudit;
  /**
   * The requirement type. Must be a taxonomy code that belongs to the group requirementType.
   */
  typeId: string;
  /**
   * The requirement subtype. Must be a taxonomy code that belongs to the group requirementSubtype.
   */
  subtypeId: string;
  /**
   * The requirement description.
   */
  text: string;
  /**
   * Items of the requirement. Must contain at least one item and at most two items.
   */
  items: IRequirementItem[];
}
/**
 * A requirement item.
 */
export interface IRequirementItem {
  /**
   * The identifier of the requirement item.
   */
  id: string;
  /**
   * The requirement item type. Must be a taxonomy code that belongs to the group requirementTargetType.
   */
  type: string;
}

/**
 * The Requirement search request object sent as a parameter.
 */
export interface IRequirementSearchRequest {
  /**
   * The number of items to return
   */
  limit: number;
  /**
   * The identifier of the requirement item.
   */
  itemId: string | string[];
  /**
   * The requirement item type. Must be a taxonomy code that belongs to the group requirementTargetType.
   */
  itemType: string;
}

export interface IRtuExport {
  status?: string;
  exportAt?: IDate; // date-time
}
export interface IRtuExportLog {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  status: string;
  startDateTime: IDate; // date-time
  endDateTime?: IDate; // date-time
  errorDescription?: string;
  projects?: {
    id: string;
    status: string;
    projectName: string;
    streetName: string;
    streetFrom: string;
    streetTo: string;
    errorDescriptions?: string[];
  }[];
  audit: IAudit;
}
export interface IRtuImportLog {
  id: IUuid; // ^[\.@!0-9a-fA-Z]*$
  startDateTime: IDate; // date-time
  endDateTime: IDate; // date-time
  status: string;
  errorDescription?: string;
  failedProjects?: {
    projectId: string;
    projectNoReference: string;
    projectName: string;
    streetName: string;
    streetFrom: string;
    streetTo: string;
    errorDescriptions: string[];
  }[];
  audit: IAudit;
}
export interface IRtuProject {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  partnerId: string;
  noReference: string;
  geometryPin: IPoint;
  geometry?: IGeometry;
  status: string;
  type: string;
  phase: string;
  dateStart: IDate; // date-time
  dateEnd: IDate; // date-time
  dateEntry: IDate; // date-time
  dateModification?: IDate; // date-time
  cancellationReason?: string;
  productionPb?: string;
  conflict?: string;
  duration?: string;
  localization?: string;
  streetName?: string;
  streetFron?: string;
  streetTo?: string;
  contact: IRtuProjectContact;
  audit: IAudit;
}
export interface IRtuProjectContact {
  id: string;
  officeId: string;
  num: string;
  prefix: string;
  name: string;
  email: string;
  phone: string;
  title?: string;
  phoneExtensionNumber?: string;
  cell?: string;
  fax?: string;
  typeNotfc?: string;
  paget?: string;
  profile?: string;
  globalRole?: string;
  idInterim?: string;
  inAutoNotification?: string;
  inDiffusion?: string;
  areaName?: string;
  role?: string;
  partnerType?: string;
  partnerId?: string;
}
/**
 * The RTU project search request.
 */
export interface IRtuProjectSearchRequest {
  /**
   * The bbox for spatial search. A comma separated list of coordinates.
   */
  bbox?: string;
  /**
   * The area ID.
   */
  areaId?: IStringOrStringArray;
  /**
   * The partner ID.
   */
  partnerId?: IStringOrStringArray;
  /**
   * The status.
   */
  status?: IStringOrStringArray;
  /**
   * The phase.
   */
  phase?: IStringOrStringArray;
  /**
   * Lower bound of the start date of the project.
   */
  fromDateStart?: IDate /* date-time */;
  /**
   * Upper bound of the start date of the project.
   */
  toDateStart?: IDate /* date-time */;
  /**
   * Lower bound of the end date of the project.
   */
  fromDateEnd?: IDate /* date-time */;
  /**
   * Upper bound of the end date of the project.
   */
  toDateEnd?: IDate /* date-time */;
  intersectGeometry?: IGeometry;
  /**
   * The number of items to return.
   */
  limit?: number;
  /**
   * The result offset for pagination.
   */
  offset?: number;
  /**
   * Sort results.
   */
  orderBy?: string;
  /**
   * Comma separated list or array of strings of fields/attributes to return.
   */
  fields?: string | string[];
}
export interface IRule {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * code of the taxonomy corresponding to the group rule type
   */
  typeId?: string;
  startDate: IDate; // date-time
  endDate: IDate; // date-time
  geometry: IGeometry;
}
/**
 * Describes asset search parameters
 */
export interface ISearchAssetsRequest {
  assetTypes?: string[];
  advancedIntersect?: boolean;
  geometry?: IGeometry;
  /**
   * Search criteria used for the asset ID
   */
  id?: string;
}
/**
 * The bbox for spatial search. A comma separated list of coordinates.
 * example:
 * -73.69024,45.494472,-73.531264,45.53972
 */
export type ISearchBbox = string;
export interface IServicePriority {
  /**
   * must have taxonomy code that belongs to the group service
   */
  service: string;
  /**
   * must have taxonomy code that belongs to the group priorityType
   */
  priorityId: string;
}
/**
 * a shape file for import of interventions and projects
 */
export interface IShpProperty {
  ID: IUuid; // ^[\.@!0-9a-fA-Z]*$
  /**
   * Reference number
   */
  NUM_REF: string;
  /**
   * Name of file
   */
  NOM: string;
  /**
   * Description of file
   */
  DESCR: string;
  PARTENAIRE: string;
  STATUT: string;
  TYPE: string;
  PHASE: string;
  /**
   * Realisation probability
   */
  PROB_REALI: string;
  /**
   * Intervention
   */
  INTERVNT: string;
  DT_SAISI: string;
  DT_DEBUT: string;
  DT_FIN: string;
  LOCALIS: string;
  /**
   * Project id
   */
  projectId?: string;
}
export type IStringOrStringArray = string | string[];
/**
 * A submission.
 */
export interface ISubmission {
  /**
   * Unique identifier of the submission. Must have 6 numeric characters.
   * example:
   * 564201
   */
  submissionNumber: string;
  /**
   * The DRM number associated with the submission. Must have 4 numeric characters.
   * example:
   * 5642
   */
  drmNumber: string;
  /**
   * Submission status. Must be a taxonomy code that belongs to group submissionStatus.
   */
  status: string;
  /**
   * Submission progress status. Must be a taxonomy code that belongs to group submissionProgressStatus.
   */
  progressStatus: string;
  /**
   * History of progress status changes.
   */
  progressHistory?: IProgressHistoryItem[];
  /**
   * History of status changes.
   */
  statusHistory?: IStatusHistoryItem[];
  audit: IAudit;
  /**
   * Identifier of the program book in which the submission is located.
   */
  programBookId: string;
  /**
   * Identifiers of projects belonging to the submission.
   */
  projectIds: string[];
  /**
   * list of documents.
   */
  documents?: IEnrichedDocument[];
  /**
   * list of requirements.
   */
  requirements?: ISubmissionRequirement[];
}
export interface ISubmissionCreateRequest {
  /**
   * Identifier of the program book in which the submission is located.
   */
  programBookId: string;
  /**
   * Identifiers of projects belonging to the submission.
   */
  projectIds: string[];
}
/**
 * A constraint or technical requirement.
 */
export interface ISubmissionRequirement {
  /**
   * The requirement Identifiers.
   */
  id?: string;
  /**
   * The requirement mention. Must be a taxonomy code that belongs to the group submissionRequirementMention.
   */
  mentionId: string;
  /**
   * The requirement type. Must be a taxonomy code that belongs to the group submissionRequirementType .
   */
  typeId: string;
  /**
   * The requirement subtype. Must be a taxonomy code that belongs to the group submissionRequirementSubtype.
   */
  subtypeId: string;
  /**
   * The requirement description.
   */
  text: string;
  /**
   * Items of the requirement. Must contain at least one item and at most two items.
   */
  isDeprecated: boolean;
  /**
   * Identifiers of projects belonging to the submission. indicates that this requirement is specific to one or more projects.
   */
  projectIds?: string[];
  /**
   * Identifiers the planning requirement from which this requirement originated.
   */
  planningRequirementId?: string;
  audit: IAudit;
}

/**
 * A constraint or technical requirement Request.
 */
export interface ISubmissionRequirementRequest {
  /**
   * The requirement subtype. Must be a taxonomy code that belongs to the group submissionRequirementSubtype.
   */
  subtypeId: string;
  /**
   * The requirement description.
   */
  text: string;
  /**
   * Identifiers of projects belonging to the submission.
   */
  projectIds?: string[];
  /**
   * Identifiers of projects belonging to the submission.
   */
  planningRequirementId?: string;
}
export interface ISubmissionPatchRequest {
  /**
   * Submission status. Must be a taxonomy code that belongs to group submissionStatus.
   */
  status?: string;
  /**
   * Submission progress status. Must be a taxonomy code that belongs to group submissionProgressStatus.
   */
  progressStatus?: string;
  /**
   * Date on which the progress status change occurred
   * example:
   * 2019-05-13T08:42:34Z
   */
  progressStatusChangeDate?: string; // date-time
  /**
   * Comment about the submission.
   */
  comment?: string;
}
/**
 * The submissions search request.
 */
export interface ISubmissionsSearchRequest {
  submissionNumber?: string[];
  drmNumber?: string[];
  programBookId?: string[];
  projectIds?: string[];
  status?: string[];
  progressStatus?: string[];
  /**
   * The number of items to return.
   */
  limit?: number;
  /**
   * The result offset for pagination.
   */
  offset?: number;
  /**
   * Sort results.
   */
  orderBy?: string;
  /**
   * Array of strings of fields/attributes to return.
   */
  fields?: string[];
}
/**
 * the taxonomy object
 */
export interface ITaxonomy {
  id?: IUuid; // ^[\.@!0-9a-fA-Z]*$
  group: string;
  code: string; // ^\S+$
  label: ILocalizedText;
  properties?: any;
  description?: ILocalizedText;
  isActive?: boolean;
  displayOrder?: number;
  valueString1?: string;
  valueString2?: string;
  valueBoolean1?: boolean;
}
export type ITaxonomyList = ITaxonomy[];
/**
 * the uri of a document
 * example:
 * https://storage.ville.montreal.qc.ca/store/doc/id
 */
export type IUri = string; // ^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?
/**
 * The user
 */
export interface IUser {
  accessToken: string;
  iss: string;
  exp: number;
  iat: number;
  keyId: number;
  displayName: string;
  aud: string;
  name: string;
  sub: string;
  inum: string;
  email: string;
  userName: string;
  givenName: string;
  familyName: string;
  userType: string;
  mtlIdentityId?: string;
  customData?: any;
  privileges?: IGdaPrivileges[];
}
/**
 * The id of the object
 * example:
 * 2819c223-7f76-453a-919d-413861904646
 */
export type IUuid = string; // ^[\.@!0-9a-fA-Z]*$
export type IUuidOrUuidArray = IUuid /* ^[\.@!0-9a-fA-Z]*$ */ | IUuid /* ^[\.@!0-9a-fA-Z]*$ */[];

export enum ErrorCodes {
  // ===================================================
  // GENERAL
  // ===================================================

  /**
   * AlreadyExists
   * When element already exists
   */
  AlreadyExists = 'AlreadyExists',
  /**
   * InvalidInput
   * When object doesn't fit open-api definition
   */
  InvalidInput = 'InvalidInput',
  /**
   * MissingValue
   * When object fit the open-api definition but a value is missing
   */
  MissingValue = 'MissingValue',
  /**
   * SequenceBreak
   * When a serie of elements are not in its attempted order or element(s) are missing in the sequence.
   */
  SequenceBreak = 'SequenceBreak',
  /**
   * Taxonomy
   * When taxonomy is different from any taxonomies within taxonomy group
   */
  Taxonomy = 'Taxonomy',
  /**
   * Duplicate
   * When rules defined that the object must be unique
   */
  Duplicate = 'Duplicate',
  /**
   * BoroughUniqueMTL
   * If multiple borough choice and selected MTL. Only MTL can be chosen.
   */
  BoroughUniqueMTL = 'BoroughUniqueMTL',
  /**
   * InvalidStatus
   * If the object status is invalid.
   */
  InvalidStatus = 'InvalidStatus',
  /**
   * Used when an invalid status transition occurs.
   * Usually used in a state machine.
   */
  InvalidStatusTransition = 'InvalidStatusTransition',
  /**
   * InvalidId
   * Id doesn't match with the object id definition
   */
  InvalidId = 'InvalidId',
  /**
   * InvalidTaxonomiesRelation
   * Those two types can't be combinate
   */
  InvalidTaxonomiesRelation = 'InvalidTaxonomiesRelation',

  // ===================================================
  // ANNUAL PROGRAM
  // ===================================================
  /**
   * AnnualProgramTargetYear
   * When year is lower than present year
   */
  AnnualProgramTargetYear = 'AnnualProgramTargetYear',
  /**
   * AnnualProgramHasProjectsAssigned
   * It's impossible to change year and executor properties when project are assigned to the annual program
   */
  AnnualProgramHasProjectsAssigned = 'AnnualProgramHasProjectsAssigned',
  /**
   * AnnualProgramSharedRole
   * Impossible shared roles
   */
  AnnualProgramSharedRole = 'AnnualProgramSharedRole',
  // ===================================================
  // PROGRAM BOOK
  // ===================================================
  /**
   * ProgramBookHasProject
   * Program book must not contain project
   */
  ProgramBookHasProject = 'ProgramBookHasProject',
  /**
   * ProgramBookProjectTypes
   * Each project's projectTypeId must be include in program book's projectTypes
   */
  ProgramBookProjectTypes = 'ProgramBookProjectTypes',
  /**
   * ProgramBookProjectYear
   * Each project's projectTypeId must be include in program book's projectTypes
   */
  ProgramBookProjectYear = 'ProgramBookProjectYear',
  /**
   * ProgramBookBoroughs
   * Each project's borough must be include in program book's boroughIds
   */
  ProgramBookBoroughs = 'ProgramBookBoroughs',
  /**
   * ProgramBookSharedRole
   * Impossible shared roles
   */
  ProgramBookSharedRole = 'ProgramBookSharedRole',
  /**
   * ProgramBookIsAutomaticLoadingInProgress
   * A program book is no longer accessible for modification during an automatic loading.
   */
  ProgramBookIsAutomaticLoadingInProgress = 'ProgramBookIsAutomaticLoadingInProgress',
  /**
   * ProgramBookNotSharedEntirely
   * ProgramBook in status submittedFinal,  shared roles are different from the taxonomy (group: shareableRole, code:programBook)
   */
  ProgramBookNotSharedEntirely = 'ProgramBookNotSharedEntirely',

  // ===================================================
  // PROJECT
  // ===================================================
  /**
   * ProjectServicePriority
   * project has issue with its project service priority
   */
  ProjectServicePriority = 'ProjectServicePriority',
  /**
   * ProjectStatus
   * project status does not permit that operation
   */
  ProjectStatus = 'ProjectStatus',
  /**
   * ProjectStartYear
   * project start date
   */
  ProjectStartYear = 'ProjectStartYear',
  /**
   * ProjectEndYear
   * project end date
   */
  ProjectEndYear = 'ProjectEndYear',
  /**
   * ProjectDecisionProgramBook
   * project start date must be lower than all intervention
   */
  ProjectDecisionProgramBook = 'ProjectDecisionProgramBook',
  /**
   * ProjectGeometry
   * project has issue with its geometry
   */
  ProjectGeometry = 'ProjectGeometry',
  /**
   * ProjectIntervention
   * project has issue with its interventions
   */
  ProjectIntervention = 'ProjectIntervention',
  /**
   * ProjectRequirement
   * project has issue with its requirements
   */
  ProjectRequirement = 'ProjectRequirement',
  /**
   * ProjectName
   * project has issue with its project name
   */
  ProjectName = 'ProjectName',
  /**
   * ProjectBudget
   * project has issue with its project budget
   */
  ProjectBudget = 'ProjectBudget',
  /**
   * ProjectAnnualPeriods
   * project has issue with its project annual periods
   */
  ProjectAnnualPeriods = 'ProjectAnnualPeriods',
  /**
   * ProjectPriority
   * project has issue with its project annual periods
   */
  ProjectPriority = 'ProjectPriority',
  /**
   * ProjectMissingDrmNumber
   * project must have a DrmNumber
   */
  ProjectNoDrmNumber = 'ProjectNoDrmNumber',
  // ===================================================
  // INTERVENTION
  // ===================================================
  /**
   * InterventionEstimate
   * intervention has issue with its intervention estimate
   */
  InterventionEstimate = 'InterventionEstimate',
  /**
   * BusinessRule
   * issue with a business rule
   */
  BusinessRule = 'BusinessRule',
  /**
   * ObjectivesKeyCount
   * objective issue with its key objective count
   */
  ObjectivesKeyCount = 'ObjectivesKeyCount',

  /**
   * InterventionAsset
   * Asset is not inside intervention geometry
   */
  InterventionAsset = 'InterventionAsset',
  // ===================================================
  // DOCUMENT
  // ===================================================
  /**
   * Extensions
   * file extension is invalid
   */
  Extensions = 'Extensions',
  /**
   * FileByteWeight
   * file byte weight
   */
  FileByteWeight = 'FileByteWeight',
  /**
   * InterventionDocumentType
   * intervention document type is mandatory
   */
  InterventionDocumentType = 'InterventionDocumentType',
  /**
   * DocumentFileData
   * document file data is mandatory on creation
   */
  DocumentFileData = 'DocumentFileData',
  // ===================================================
  // OPPORTUNITY NOTICE
  // ===================================================
  /**
   * OpportunityNotice
   * Opportunity notice as another opportunity notice open for the asset
   */
  OpportunityNoticeAsset = 'OpportunityNoticeAsset',
  /**
   * OpportunityNoticeProjectId
   * Opportunity notice must not be transfered to another project
   */
  OpportunityNoticeProjectId = 'OpportunityNoticeProjectId',
  /**
   * OpportunityNoticeProjectType
   * Project must have integrated type to have an opportunity notice
   */
  OpportunityNoticeProjectStartYear = 'OpportunityNoticeProjectStartYear',
  /**
   * OpportunityNoticeProjectType
   * Project must have integrated type to have an opportunity notice
   */
  OpportunityNoticeProjectType = 'OpportunityNoticeProjectType',
  /**
   * OpportunityNoticeResponseDecisionNote
   * Opportunity notice with a response no must not have a decision note
   */
  OpportunityNoticeResponseDecisionNote = 'OpportunityNoticeResponseDecisionNote',
  /**
   * OpportunityNoticeResponseRequestorDecision
   * Opportunity notice with a final response must not change
   */
  OpportunityNoticeResponseRequestorDecision = 'OpportunityNoticeResponseRequestorDecision'
}

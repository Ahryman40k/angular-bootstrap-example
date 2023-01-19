/**
 * Enum of all permissions of the application
 */
export enum Permission {
  ACCESS_MANAGEMENT_ACCESS = 'ACCESS_MANAGEMENT:ACCESS',
  ANNUAL_PROGRAM_READ = 'ANNUAL_PROGRAM:READ',
  ANNUAL_PROGRAM_READ_ALL = 'ANNUAL_PROGRAM:READ:ALL',
  ANNUAL_PROGRAM_WRITE = 'ANNUAL_PROGRAM:WRITE',
  ASSET_READ = 'ASSET:READ',
  ASSET_SEARCH = 'ASSET:SEARCH',
  COMPARISON_READ = 'COMPARISON:READ',
  IMPORT_WRITE = 'IMPORT:WRITE',
  INFO_RTU_IMPORT_EXPORT_WRITE = 'INFO_RTU_IMPORT_EXPORT:WRITE',
  INTERVENTION_ANNUAL_DISTRIBUTION_READ = 'INTERVENTION:ANNUAL_DISTRIBUTION:READ',
  INTERVENTION_BUDGET_READ = 'INTERVENTION:BUDGET:READ',
  INTERVENTION_COMMENT_READ = 'INTERVENTION:COMMENT:READ',
  INTERVENTION_COMMENT_READ_PRIVATE = 'INTERVENTION:COMMENT:READ:PRIVATE',
  INTERVENTION_COMMENT_WRITE = 'INTERVENTION:COMMENT:WRITE',
  INTERVENTION_DECISION_READ = 'INTERVENTION:DECISION:READ',
  INTERVENTION_DECISION_ACCEPTED_REFUSED_CREATE = 'INTERVENTION:DECISION:ACCEPTED_REFUSED:CREATE',
  INTERVENTION_DECISION_CANCELED_CREATE = 'INTERVENTION:DECISION:CANCELED:CREATE',
  INTERVENTION_DECISION_REVISION_REQUEST_CREATE = 'INTERVENTION:DECISION:REVISION_REQUEST:CREATE',
  INTERVENTION_DECISION_RETURNED_CREATE = 'INTERVENTION:DECISION:RETURNED:CREATE',
  INTERVENTION_DECISION_WRITE = 'INTERVENTION:DECISION:CREATE',
  INTERVENTION_DOCUMENT_READ = 'INTERVENTION:DOCUMENT:READ',
  INTERVENTION_DOCUMENT_WRITE = 'INTERVENTION:DOCUMENT:WRITE',
  INTERVENTION_EXTRACT = 'INTERVENTION:EXTRACT',
  INTERVENTION_INITIAL_YEAR_READ = 'INTERVENTION:INITIAL_YEAR:READ',
  INTERVENTION_MORE_INFORMATION_READ = 'INTERVENTION:MORE_INFORMATION:READ',
  INTERVENTION_READ = 'INTERVENTION:READ',
  INTERVENTION_DELETE = 'INTERVENTION:DELETE',
  INTERVENTION_READ_ALL = 'INTERVENTION:READ:ALL',
  INTERVENTION_REQUESTOR_CONTACT_READ = 'INTERVENTION:REQUESTOR_CONTACT:READ',
  INTERVENTION_WRITE = 'INTERVENTION:WRITE',
  INTERVENTION_ZONE_READ = 'INTERVENTION_ZONE:READ',
  NEXO_IMPORT_LOG_READ = 'NEXO_IMPORT_LOG:READ',
  NEXO_IMPORT_LOG_WRITE = 'NEXO_IMPORT_LOG:WRITE',
  OPPORTUNITY_NOTICE_READ = 'OPPORTUNITY_NOTICE:READ',
  OPPORTUNITY_NOTICE_WRITE = 'OPPORTUNITY_NOTICE:WRITE',
  PARTNER_PROJECT_READ = 'PARTNER_PROJECT:READ',
  PROGRAM_BOOK_LOAD = 'PROGRAM_BOOK:LOAD',
  PROGRAM_BOOK_OBJECTIVE_FAVORITE = 'PROGRAM_BOOK:OBJECTIVE:FAVORITE',
  PROGRAM_BOOK_OBJECTIVE_READ = 'PROGRAM_BOOK:OBJECTIVE:READ',
  PROGRAM_BOOK_OBJECTIVE_WRITE = 'PROGRAM_BOOK:OBJECTIVE:WRITE',
  PROGRAM_BOOK_PRIORITY_SCENARIOS_READ = 'PROGRAM_BOOK:PRIORITY_SCENARIOS:READ',
  PROGRAM_BOOK_PRIORITY_SCENARIOS_WRITE = 'PROGRAM_BOOK:PRIORITY_SCENARIOS:WRITE',
  PROGRAM_BOOK_PROGRAM = 'PROGRAM_BOOK:PROGRAM',
  PROGRAM_BOOK_READ = 'PROGRAM_BOOK:READ',
  PROGRAM_BOOK_READ_ALL = 'PROGRAM_BOOK:READ:ALL',
  PROGRAM_BOOK_READ_NEW = 'PROGRAM_BOOK:READ:NEW',
  PROGRAM_BOOK_SUBMISSIONS_READ = 'PROGRAM_BOOK:SUBMISSIONS:READ',
  PROGRAM_BOOK_WRITE = 'PROGRAM_BOOK:WRITE',
  PROJECT_ANNUAL_DISTRIBUTION_READ = 'PROJECT:ANNUAL_DISTRIBUTION:READ',
  PROJECT_BUDGET_READ = 'PROJECT:BUDGET:READ',
  PROJECT_COMMENT_READ = 'PROJECT:COMMENT:READ',
  PROJECT_COMMENT_READ_PRIVATE = 'PROJECT:COMMENT:READ:PRIVATE',
  PROJECT_COMMENT_WRITE = 'PROJECT:COMMENT:WRITE',
  PROJECT_COMMENT_WRITE_PRIVATE = 'PROJECT:COMMENT:WRITE:PRIVATE',
  PROJECT_DECISION_CANCELED_CREATE = 'PROJECT:DECISION:CANCELED:CREATE',
  PROJECT_DECISION_REPLANNED_CREATE = 'PROJECT:DECISION:REPLANNED:CREATE',
  PROJECT_DECISION_POSTPONED_CREATE = 'PROJECT:DECISION:POSTPONED:CREATE',
  PROJECT_DECISION_REMOVE_FROM_PROGRAM_BOOK_CREATE = 'PROJECT:DECISION:REMOVE_FROM_PROGRAM_BOOK:CREATE',
  PROJECT_DECISION_READ = 'PROJECT:DECISION:READ',
  PROJECT_DECISION_WRITE = 'PROJECT:DECISION:CREATE',
  PROJECT_DOCUMENT_READ = 'PROJECT:DOCUMENT:READ',
  PROJECT_DOCUMENT_WRITE = 'PROJECT:DOCUMENT:WRITE',
  PROJECT_DRM_WRITE = 'PROJECT:DRM:WRITE',
  PROJECT_EXTRACT = 'PROJECT:EXTRACT',
  PROJECT_INTERVENTIONS_READ = 'PROJECT:INTERVENTIONS:READ',
  PROJECT_MORE_INFORMATION_READ = 'PROJECT:MORE_INFORMATION:READ',
  PROJECT_READ = 'PROJECT:READ',
  PROJECT_READ_ALL = 'PROJECT:READ:ALL',
  PROJECT_WITH_POSTPONED_DECISION_READ = 'PROJECT:WITH_POSTPONED_DECISION:READ',
  PROJECT_WRITE = 'PROJECT:WRITE',
  PROJECT_ZONE_READ = 'PROJECT_ZONE:READ',
  REQUIREMENT_READ = 'REQUIREMENT:READ',
  REQUIREMENT_WRITE = 'REQUIREMENT:WRITE',
  ROAD_SECTION_ACTIVITY_READ = 'ROAD_SECTION_ACTIVITY:READ',
  RTU_EXPORT_LOG_READ = 'RTU_EXPORT_LOG:READ',
  RTU_IMPORT_LOG_READ = 'RTU_IMPORT_LOG:READ',
  RTU_PROJECT_READ = 'RTU_PROJECT:READ',
  SUBMISSION_DOCUMENT_READ = 'SUBMISSION:DOCUMENT:READ',
  SUBMISSION_DOCUMENT_WRITE = 'SUBMISSION:DOCUMENT:WRITE',
  SUBMISSION_WRITE = 'SUBMISSION:WRITE',
  SUBMISSION_READ = 'SUBMISSION:READ',
  SUBMISSION_STATUS_WRITE = 'SUBMISSION:STATUS:WRITE',
  SUBMISSION_REQUIREMENT_WRITE = 'SUBMISSION:REQUIREMENT:WRITE',
  SUBMISSION_PROGRESS_STATUS_WRITE = 'SUBMISSION:PROGRESS_STATUS:WRITE',
  TAXONOMY_WRITE = 'TAXONOMY:WRITE',
  WORK_AREA_READ = 'WORK_AREA:READ'
}

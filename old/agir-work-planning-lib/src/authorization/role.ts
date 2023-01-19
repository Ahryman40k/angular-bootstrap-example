/**
 * Enum of all roles of the application
 */
export enum Role {
  EXECUTOR = 'EXECUTOR',
  EXTERNAL_GUEST = 'EXTERNAL-GUEST',
  INTERNAL_GUEST_RESTRICTED = 'INTERNAL-GUEST-RESTRICTED',
  INTERNAL_GUEST_STANDARD = 'INTERNAL-GUEST-STANDARD',
  PARTNER_PROJECT_CONSULTATION = 'PARTNER_PROJECT_CONSULTATION',
  PILOT = 'PILOT',
  PLANIFICATION_ADMIN = 'PLANIFICATION_ADMIN',
  PLANNER = 'PLANNER',
  PLANNER_SE = 'PLANNER_SE',
  REQUESTOR = 'REQUESTOR',
  REQUESTOR_EXECUTOR = 'REQUESTOR_EXECUTOR'
}

/**
 * Enum of all shareable roles of the application
 */
export enum ShareableRole {
  annualProgram = 'annualProgram',
  programBook = 'programBook'
}

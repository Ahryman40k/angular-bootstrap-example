import { IUser, Permission, Role, User } from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';

import { IGdaPrivileges } from '../../src/models/gda';
import { getGdaProvisioning } from '../../src/utils/gdaUtils';

function getPrivilege(role: Role): IGdaPrivileges {
  const gdaProvisioning = getGdaProvisioning();
  const gdaRole = gdaProvisioning.roles.find(x => x.code === role);

  const privileges: IGdaPrivileges = {
    application: gdaProvisioning.application.code,
    domain: gdaProvisioning.domain.code,
    permissions: [],
    role,
    restrictions: null
  };

  if (gdaRole) {
    privileges.permissions = gdaRole.permissions;
  }

  return privileges;
}

export function getAllOtherRoles(roles: User[]): User[] {
  const allRoles = normalizeUsernames(Object.values(userMocks));
  return _.differenceBy(allRoles, roles, 'userName');
}

export function normalizeUsernames(roles: User[]): User[] {
  return roles.map(role => {
    role.userName = role.userName.toLowerCase();
    return role;
  });
}

const baseUser: IUser = {
  inum: '',
  accessToken: '',
  iss: '',
  exp: 0,
  iat: 0,
  keyId: 0,
  displayName: '',
  aud: '',
  name: '',
  sub: '',
  email: '',
  userName: '',
  givenName: '',
  familyName: '',
  userType: '',
  customData: []
};

const admin = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Admini McAdminface',
    name: 'Admini McAdminface',
    userName: 'xadmin',
    givenName: 'Admini',
    familyName: 'McAdminface',
    customData: [getPrivilege(Role.PLANIFICATION_ADMIN), getPrivilege(Role.PARTNER_PROJECT_CONSULTATION)]
  })
);

const externalGuest = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'ExternalGuesti McexternalGuestface',
    name: 'ExternalGuesti McexternalGuestface',
    userName: 'xexternalguest',
    givenName: 'ExternalGuesti',
    familyName: 'McexternalGuestface',
    customData: [getPrivilege(Role.EXTERNAL_GUEST)]
  })
);

const executor = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Executori McExecutorface',
    name: 'Executori McExecutorface',
    userName: 'xExecutor',
    givenName: 'Executori',
    familyName: 'McExecutorface',
    customData: [getPrivilege(Role.EXECUTOR)]
  })
);

const internalGuestStandard = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'InternalGuestStandardi McInternalGuestStandardface',
    name: 'InternalGuestStandardi McInternalGuestStandardface',
    userName: 'xinternalgueststandard',
    givenName: 'InternalGuestStandardi',
    familyName: 'McInternalGuestStandardface',
    customData: [getPrivilege(Role.INTERNAL_GUEST_STANDARD)]
  })
);

const internalGuestRestricted = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'InternalGuestRestrictedi McinternalGuestRestrictedface',
    name: 'InternalGuestRestrictedi McinternalGuestRestrictedface',
    userName: 'xinternalguestrestricted',
    givenName: 'InternalGuestRestrictedi',
    familyName: 'McinternalGuestRestrictedface',
    customData: [getPrivilege(Role.INTERNAL_GUEST_RESTRICTED)]
  })
);

const pilot = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Piloti McPilotface',
    name: 'Piloti McPilotface',
    userName: 'xpilot',
    givenName: 'Piloti',
    familyName: 'McPilotface',
    customData: [getPrivilege(Role.PILOT), getPrivilege(Role.PARTNER_PROJECT_CONSULTATION)]
  })
);

const planner = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Planifi McPlanface',
    name: 'Planifi McPlanface',
    userName: 'xplanner',
    givenName: 'Planifi',
    familyName: 'McPlanface',
    customData: [getPrivilege(Role.PLANNER)]
  })
);

const plannerSe = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Planifi McPlanSe',
    name: 'Planifi McPlanSE',
    userName: 'xplannerse',
    givenName: 'PlanifiSe',
    familyName: 'McPlanSe',
    customData: [getPrivilege(Role.PLANNER_SE)]
  })
);

const requestor = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Requestori McRequestorface',
    name: 'Requestori McRequestorface',
    userName: 'xrequestor',
    givenName: 'Requestori',
    familyName: 'McRequestorface',
    customData: [getPrivilege(Role.REQUESTOR)]
  })
);

const partnerProjectConsultation = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'ProjectVieweri McProjectViewerface',
    name: 'ProjectVieweri McProjectViewerface',
    userName: 'xprojectviewer',
    givenName: 'ProjectVieweri',
    familyName: 'McProjectViewerface',
    customData: [getPrivilege(Role.PARTNER_PROJECT_CONSULTATION)]
  })
);

const noAccess = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Noaccess McNoaccessface',
    name: 'Noaccess McNoaccessface',
    userName: 'xnoaccess',
    givenName: 'Noaccess',
    familyName: 'McNoaccessface',
    customData: []
  })
);

export const userMocks = {
  admin,
  executor,
  externalGuest,
  internalGuestRestricted,
  internalGuestStandard,
  noAccess,
  pilot,
  planner,
  plannerSe,
  requestor,
  partnerProjectConsultation
};

// --------------------------- Custom user mocks for specific test cases --------------------------- //

// User limited on intervention fields during extraction
const privilegesForLimitedInterventionsExtractionFields = getPrivilege(Role.PLANIFICATION_ADMIN);
privilegesForLimitedInterventionsExtractionFields.permissions = privilegesForLimitedInterventionsExtractionFields.permissions.filter(
  permission =>
    ![
      Permission.INTERVENTION_BUDGET_READ,
      Permission.INTERVENTION_INITIAL_YEAR_READ,
      Permission.INTERVENTION_REQUESTOR_CONTACT_READ
    ].includes(permission)
);
const restrictedOnInterventionsExtractionFields = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'Limited interventions extractor',
    name: 'Limited interventions extractor',
    userName: 'xLimitedInterventionsExtractor',
    givenName: 'LimitedInterventionsExtractor',
    familyName: 'McLimitedInterventionsExtractor',
    customData: [privilegesForLimitedInterventionsExtractionFields]
  })
);

// User limited on project fields during extraction
const privilegesForLimitedProjectsExtractionFields = getPrivilege(Role.PLANIFICATION_ADMIN);
privilegesForLimitedProjectsExtractionFields.permissions = privilegesForLimitedProjectsExtractionFields.permissions.filter(
  permission => ![Permission.PROJECT_BUDGET_READ, Permission.PROJECT_INTERVENTIONS_READ].includes(permission)
);
const restrictedOnProjectsExtractionFields = new User(
  Object.assign(_.clone(baseUser), {
    displayName: 'All but project_read_all',
    name: 'All but project_read_all',
    userName: 'xAllButProjectReadAll',
    givenName: 'AllButProjectReadAll',
    familyName: 'McAllButProjectReadAll',
    customData: [privilegesForLimitedProjectsExtractionFields]
  })
);

export const customUserMocks = {
  restrictedOnInterventionsExtractionFields,
  restrictedOnProjectsExtractionFields
};

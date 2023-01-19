import { Permission, Role } from '@villemontreal/agir-work-planning-lib';

export interface IGdaPrivileges {
  domain: string;
  application: string;
  role: Role;
  permissions: Permission[];
  restrictions: IRestrictionsSet;
}

/**
 * A set of restrictions.
 */
export interface IRestrictionsSet {
  [key: string]: string | string[];
}

export interface IGdaProvisioningRequestBody {
  admin: string;
  domain: IGdaProvisionDomain;
  application: IGdaProvisionApplication;
  permissions: IGdaProvisionPermission[];
  roles: IGdaProvisionRole[];
  assignments: IGdaProvisionAssignment[];
}

export interface IGdaProvisioningResponseBody {
  admin: IGdaAssignment;
  domain: IGdaDomain;
  application: IGdaApplication;
  permissions: IGdaPermission[];
  roles: IGdaRole[];
  assignments: IGdaAssignment[];
}

export interface IGdaProvisionDomain {
  code: string;
  name?: string;
  description?: string;
}
export interface IGdaDomain extends IGdaProvisionDomain {
  id: number;
}

export interface IGdaProvisionApplication {
  code: string;
  name: string;
  description: string;
  contexts: string[] | number[];
}

export interface IGdaApplication extends IGdaProvisionApplication {
  id: number;
  domainId?: number;
  contexts: number[];
}

export interface IGdaProvisionPermission {
  code: Permission;
  description: string;
}

export interface IGdaPermission extends IGdaProvisionPermission {
  id: number;
  applicationId: number;
}

export interface IGdaProvisionRole {
  name: string;
  code: string;
  description?: string;
  permissions: Permission[];
}

export interface IGdaRole extends IGdaProvisionRole {
  id: number;
  applicationId: number;
}

export interface IGdaProvisionAssignment {
  user: string;
  role: string;
  restrictions: [Map<string, string>]; // { "BOROUGH": "LSL" }
}

export interface IGdaAssignment {
  roleId: number;
  profileId: number;
  contexts: [IGdaContextBinding];
  expiryDate?: Date;
}

export interface IGdaContextBinding {
  id: number;
  value: string;
}

export interface IGdaContext {
  id: number;
  code: string;
  name: string;
  values: { [key: string]: string };
}

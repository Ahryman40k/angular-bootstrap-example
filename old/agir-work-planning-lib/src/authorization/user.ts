import { flatten, uniq } from 'lodash';

import { constants } from '../config/constants';
import { IGdaPrivileges, IUser } from '../planning';
import { Permission } from './permission';
import { Role } from './role';

export class User implements IUser {
  public inum: string;
  public mtlIdentityId?: string;
  public accessToken: string;
  public iss: string;
  public exp: number;
  public iat: number;
  public keyId: number;
  public displayName: string;
  public aud: string;
  public name: string;
  public email: string;
  public sub: string;
  public userName: string;
  public givenName: string;
  public familyName: string;
  public userType: string;
  public accessTokenIssuer: string;
  public customData: any[];

  public readonly privileges: IGdaPrivileges[];

  public readonly permissions: Permission[];
  public readonly roles: Role[];

  public get isAdmin(): boolean {
    return this.hasRole(Role.PLANIFICATION_ADMIN);
  }

  public get isPlanner(): boolean {
    return this.hasRole(Role.PLANNER);
  }

  public get isPilot(): boolean {
    return this.hasRole(Role.PILOT);
  }

  public get isRequestor(): boolean {
    return this.hasRole(Role.REQUESTOR);
  }

  constructor(user: IUser) {
    Object.assign(this, user);
    if (this.customData) {
      this.privileges = this.customData.filter(x => x.application === constants.GDA.APPLICATION_CODE_AGIR_PLANING);
      this.permissions = uniq(flatten(this.privileges.map(x => x.permissions))) as Permission[];
      this.roles = uniq(this.privileges.map(x => x.role)) as Role[];
    }
  }

  /**
   * Returns whether the user has the permission or not.
   * @param permission The application permission
   */
  public hasPermission(permission: Permission): boolean {
    if (!this.permissions) {
      return false;
    }
    return this.permissions.some(p => p === permission);
  }

  /**
   * Returns whether the user has the role or not.
   * @param role The application role
   */
  public hasRole(role: Role): boolean {
    if (!this.roles) {
      return false;
    }
    return this.roles.some(r => r === role);
  }
}

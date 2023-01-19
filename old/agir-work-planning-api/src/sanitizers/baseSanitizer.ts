import { User } from '@villemontreal/agir-work-planning-lib/dist/src';

import { userService } from '../services/userService';

export abstract class BaseSanitizer<T> {
  protected user: User;
  // remove these properties from intervention response if user is not satisfying restriction based on restrictionTypes
  protected readonly restrictedProperties: (keyof T)[] = [];
  protected validateRestrictions(object: T): boolean {
    return true;
  }

  public abstract sanitize(item: T): T;

  public sanitizeArray(list: T[]): T[] {
    for (const item of list) {
      this.sanitize(item);
    }

    return list;
  }

  /**
   * Delete forbidden properties
   * @param object
   */
  protected filterPropertiesByPermission(object: T, readPermissionList: any[]): void {
    this.user = userService.currentUser;
    for (const readPermission of readPermissionList) {
      if (!this.user.hasPermission(readPermission.permission)) {
        delete object[readPermission.property];
      }
    }
  }
  /**
   * Delete forbidden properties base on user restrictions
   * @param object
   */
  protected sanitizeByUserRestrictions(object: T): void {
    for (const property of this.restrictedProperties) {
      if (!this.validateRestrictions(object)) {
        delete object[property];
      }
    }
  }
}

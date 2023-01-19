import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { UserService } from '../user/user.service';

@Pipe({ name: 'appPermission', pure: false })
export class PermissionsPipe implements PipeTransform {
  constructor(private readonly userService: UserService, private readonly _ref: ChangeDetectorRef) {}
  public transform(permission: Permission): boolean {
    if (!permission) {
      return true;
    }
    if (!Object.values(Permission).includes(permission)) {
      throw new Error(`Invalid permission ${permission}`);
    }

    if (this.userService.currentUser) {
      return this.userService.currentUser.hasPermission(permission);
    }

    void this.userService.getCurrentUser().then(() => this._ref.markForCheck());
    return false;
  }
}

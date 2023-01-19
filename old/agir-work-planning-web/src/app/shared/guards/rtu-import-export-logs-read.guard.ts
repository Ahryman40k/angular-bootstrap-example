import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';

import { UserService } from '../user/user.service';

/**
 * Guard to ensure user have permission to edit taxonomies.
 */
@Injectable({
  providedIn: 'root'
})
export class RtuImportExportLogReadGuard implements CanActivate, CanLoad {
  constructor(private readonly userService: UserService, private readonly router: Router) {}

  private async hasRtuImportExportLogReadPermission(): Promise<boolean> {
    if (await this.userService.hasPermissions(Permission.RTU_IMPORT_LOG_READ, Permission.RTU_EXPORT_LOG_READ)) {
      return true;
    }
    await this.router.navigateByUrl('/unauthorized');
    return false;
  }

  public canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.hasRtuImportExportLogReadPermission();
  }

  public canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return this.hasRtuImportExportLogReadPermission();
  }
}

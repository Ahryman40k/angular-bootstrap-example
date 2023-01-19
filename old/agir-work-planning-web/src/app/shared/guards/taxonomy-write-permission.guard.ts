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
export class TaxonomyWriteGuard implements CanActivate, CanLoad {
  constructor(private readonly userService: UserService, private readonly router: Router) {}

  private async hasTaxonomyWritePermission(): Promise<boolean> {
    if (await this.userService.hasPermission(Permission.TAXONOMY_WRITE)) {
      return true;
    }
    await this.router.navigateByUrl('/unauthorized');
    return false;
  }

  public canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.hasTaxonomyWritePermission();
  }

  public canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return this.hasTaxonomyWritePermission();
  }
}

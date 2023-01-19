import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../user/user.service';

/**
 * Guard to ensure user have at minimum one permission.
 */
@Injectable({
  providedIn: 'root'
})
export class AnyPermissionGuard implements CanActivate, CanLoad {
  constructor(private readonly userService: UserService, private readonly router: Router) {}

  private async hasAnyPermission(): Promise<boolean> {
    if (await this.userService.hasAnyPermission()) {
      return true;
    }
    await this.router.navigateByUrl('/unauthorized');
    return false;
  }

  public canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.hasAnyPermission();
  }

  public canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return this.hasAnyPermission();
  }
}

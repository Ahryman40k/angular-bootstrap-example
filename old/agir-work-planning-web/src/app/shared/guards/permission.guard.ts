import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(public userService: UserService, public router: Router) {}

  public canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const permission: Permission = route.data.permission;
    if (!permission) {
      throw new Error('A permission is required in the route data to use this guard.');
    }
    return from(this.userService.getCurrentUser()).pipe(
      map(u => u.hasPermission(permission)),
      tap(access => {
        if (!access) {
          void this.router.navigateByUrl('/not-found');
        }
      })
    );
  }
}

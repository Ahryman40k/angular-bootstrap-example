import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser, Permission, User } from '@villemontreal/agir-work-planning-lib';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { get, mergeWith } from 'lodash';
import { map, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { arrayUtils } from '../arrays/array.utils';
import { IRestriction } from './user-restrictions.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserPromise: Promise<User>;
  private _currentUser: User;

  /**
   * Gets current user
   * We recommend to use this only in a HTML file
   */
  public get currentUser(): User {
    return this._currentUser;
  }

  /**
   * Gets user restrictions
   */
  public get restrictions(): IRestriction {
    let restrictions: IRestriction = {};
    for (const data of this.currentUser?.customData || []) {
      restrictions = mergeWith(restrictions, get(data, 'restrictions', {}), arrayUtils.mergeArrays);
    }
    return restrictions;
  }

  constructor(private readonly http: HttpClient, private readonly authenticationService: MtlAuthenticationService) {
    this.initAuthentication();
  }

  private initAuthentication(): void {
    if (!environment.authentificationConfig.activation) {
      return;
    }
    void this.getCurrentUser();
  }

  public async getCurrentUser(): Promise<User> {
    if (this.currentUser) {
      return Promise.resolve(this.currentUser);
    }

    if (!this.authenticationService.isAuthorized()) {
      await this.authenticationService
        .onAuthorizedChanged()
        .pipe(take(1))
        .toPromise();
    }

    if (this.currentUserPromise) {
      return this.currentUserPromise;
    }
    this.currentUserPromise = this.http
      .get<IUser>(environment.apis.planning.me)
      .pipe(
        map(u => new User(u)),
        tap(u => (this._currentUser = u))
      )
      .toPromise();
    return this.currentUserPromise;
  }

  public async hasPermission(permission: Permission): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user.hasPermission(permission);
  }

  public async hasPermissions(...permissions: Permission[]): Promise<boolean> {
    const user = await this.getCurrentUser();
    for (const permission of permissions) {
      if (!user.hasPermission(permission)) {
        return false;
      }
    }
    return true;
  }

  public async hasAnyPermission(): Promise<boolean> {
    const user = await this.getCurrentUser();
    const allPermissions = Object.values(Permission);
    for (const permission of allPermissions) {
      if (user.hasPermission(permission)) {
        return true;
      }
    }
    return false;
  }
}

import { Injectable } from '@angular/core';

import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class UserLocalStorageService {
  constructor(private readonly userService: UserService) {}

  public async set(key: string, value: any): Promise<void> {
    const user = await this.userService.getCurrentUser();
    localStorage.setItem(`${user.userName}-${key}`, JSON.stringify(value));
  }

  public async get<T>(key: string): Promise<T> {
    const user = await this.userService.getCurrentUser();
    const json = localStorage.getItem(`${user.userName}-${key}`);
    return !json ? null : JSON.parse(json);
  }
}

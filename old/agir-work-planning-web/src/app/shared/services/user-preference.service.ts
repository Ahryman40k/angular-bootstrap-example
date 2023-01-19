import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEnrichedUserPreference } from '@villemontreal/agir-work-planning-lib';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IKeyValue } from 'src/app/map/config/layers/utils';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserPreferenceService {
  private readonly cachedPreferences: IKeyValue<Observable<any>> = {};

  constructor(private readonly http: HttpClient) {}

  public async set(key: string, value: any): Promise<void> {
    await this.http
      .put<any>(`${environment.apis.planning.me}/preferences/${key}`, { value })
      .toPromise();
    this.clearCache(key);
  }

  public get<T>(key: string): Observable<T> {
    if (!this.cachedPreferences[key]) {
      this.cachedPreferences[key] = this.http
        .get<IEnrichedUserPreference[]>(`${environment.apis.planning.me}/preferences`)
        .pipe(map(userPreferences => userPreferences.find(u => u.key === key)?.value as T));
    }
    return this.cachedPreferences[key];
  }

  private clearCache(key: string): void {
    this.cachedPreferences[key] = undefined;
  }
}

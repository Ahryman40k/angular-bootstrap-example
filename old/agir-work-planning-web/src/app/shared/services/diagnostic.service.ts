import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IDiagnosticsInfo } from '@villemontreal/agir-work-planning-lib/dist/src';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {
  constructor(private readonly http: HttpClient) {}

  public getInfo(): Observable<IDiagnosticsInfo> {
    return this.http.get<IDiagnosticsInfo>(`${environment.apis.planning.info}`);
  }
}

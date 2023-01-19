import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { buildHttpParams } from '../http/params-builder';
import { IPaginatedResults } from '../models/paginated-results';
import { RtuTransmissionFields } from '../models/rtu-transmissions/rtu-transmissions-table';

@Injectable({
  providedIn: 'root'
})
export class RtuImportLogService {
  constructor(private readonly http: HttpClient) {}

  public getImportLogs(orderBy: string[], limit: number, offset: number): Observable<IPaginatedResults<IRtuImportLog>> {
    const params = {
      orderBy: orderBy.length ? orderBy : [`-${RtuTransmissionFields.startDateTime}`],
      limit,
      offset,
      fields: [
        RtuTransmissionFields.startDateTime,
        RtuTransmissionFields.endDateTime,
        RtuTransmissionFields.status,
        RtuTransmissionFields.errorDetail
      ]
    };
    const httpParams = buildHttpParams(params);
    return this.http.get<IPaginatedResults<IRtuImportLog>>(`${environment.apis.planning.rtuImportLogs}`, {
      params: httpParams
    });
  }

  public getImportLog(id: string): Observable<IRtuImportLog> {
    return this.http.get<IRtuImportLog>(`${environment.apis.planning.rtuImportLogs}/${id}`);
  }
}

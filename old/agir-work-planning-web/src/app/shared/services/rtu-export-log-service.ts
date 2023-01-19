import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { buildHttpParams } from '../http/params-builder';
import { IPaginatedResults } from '../models/paginated-results';
import { RtuTransmissionFields } from '../models/rtu-transmissions/rtu-transmissions-table';

@Injectable({
  providedIn: 'root'
})
export class RtuExportLogService {
  constructor(private readonly http: HttpClient) {}

  public getExportLogs(orderBy: string[], limit: number, offset: number): Observable<IPaginatedResults<IRtuExportLog>> {
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
    return this.http.get<IPaginatedResults<IRtuExportLog>>(`${environment.apis.planning.rtuExportLogs}`, {
      params: httpParams
    });
  }

  public getExportLog(id: string): Observable<IRtuExportLog> {
    return this.http.get<IRtuExportLog>(`${environment.apis.planning.rtuExportLogs}/${id}`);
  }
}

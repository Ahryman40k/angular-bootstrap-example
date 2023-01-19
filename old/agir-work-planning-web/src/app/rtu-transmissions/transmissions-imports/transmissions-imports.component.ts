import { Component } from '@angular/core';
import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { RtuTransmissionStatus } from 'src/app/shared/models/rtu-transmissions/rtu-transmission-status';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { RtuImportLogService } from 'src/app/shared/services/rtu-import-log-service';

@Component({
  selector: 'app-transmissions-imports',
  templateUrl: './transmissions-imports.component.html',
  styleUrls: ['./transmissions-imports.component.css']
})
export class TransmissionsImportsComponent {
  constructor(private readonly rtuImportLogService: RtuImportLogService) {}

  public getRtuImportLogs = (
    orderBy: string[],
    pagination: IPagination
  ): Observable<IPaginatedResults<IRtuImportLog>> => {
    return this.rtuImportLogService.getImportLogs(orderBy, pagination.limit, pagination.offset);
  };

  public showDetails = (transmission: IRtuImportLog): boolean => {
    return transmission.status === RtuTransmissionStatus.failure;
  };
}

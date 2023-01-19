import { Component } from '@angular/core';
import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { RtuExportLogService } from 'src/app/shared/services/rtu-export-log-service';

@Component({
  selector: 'app-transmissions-exports',
  templateUrl: './transmissions-exports.component.html',
  styleUrls: ['./transmissions-exports.component.css']
})
export class TransmissionsExportsComponent {
  constructor(private readonly rtuExportLogService: RtuExportLogService) {}

  public getRtuExportLogs = (
    orderBy: string[],
    pagination: IPagination
  ): Observable<IPaginatedResults<IRtuExportLog>> => {
    return this.rtuExportLogService.getExportLogs(orderBy, pagination.limit, pagination.offset);
  };

  public showDetails = (transmission: IRtuExportLog): boolean => {
    return true;
  };
}

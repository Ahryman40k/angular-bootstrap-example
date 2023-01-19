import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { map } from 'rxjs/operators';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { RtuImportLogService } from 'src/app/shared/services/rtu-import-log-service';

@Component({
  selector: 'app-transmissions-import-details',
  templateUrl: './transmissions-import-details.component.html',
  styleUrls: ['./transmissions-import-details.component.scss']
})
export class TransmissionsImportDetailsComponent implements OnInit {
  public importLog: IRtuImportLog;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly rtuImportLogService: RtuImportLogService
  ) {}

  public ngOnInit(): void {
    this.activatedRoute.params.pipe(map(p => p.id as string)).subscribe(async id => {
      await this.loadImportLog(id);
    });
  }

  public sortColumn(direction: SortDirection): void {
    this.importLog.failedProjects = orderBy(this.importLog.failedProjects, 'projectId', [direction]);
  }

  private async loadImportLog(id: string): Promise<void> {
    this.importLog = await this.rtuImportLogService.getImportLog(id).toPromise();
  }
}

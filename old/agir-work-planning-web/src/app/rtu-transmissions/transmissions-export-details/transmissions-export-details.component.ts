import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { map } from 'rxjs/operators';
import { SortingStatus } from 'src/app/shared/directives/sort.directive';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import {
  IRtuTransmissionsTableColumnOptions,
  RtuTransmissionFields,
  RtuTransmissionsTableColumnLabels
} from 'src/app/shared/models/rtu-transmissions/rtu-transmissions-table';
import { IColumnConfig } from 'src/app/shared/models/table/column-config-interfaces';
import { RtuExportLogService } from 'src/app/shared/services/rtu-export-log-service';

@Component({
  selector: 'app-transmissions-export-details',
  templateUrl: './transmissions-export-details.component.html',
  styleUrls: ['./transmissions-export-details.component.scss']
})
export class TransmissionsExportDetailsComponent implements OnInit {
  public exportLog: IRtuExportLog;
  public RtuTransmissionsTableColumnLabels = RtuTransmissionsTableColumnLabels;

  public columnConfig: IColumnConfig = {
    columns: [
      {
        columnName: RtuTransmissionFields.id,
        displayOrder: 0
      },
      {
        columnName: RtuTransmissionFields.status,
        displayOrder: 1
      },
      {
        columnName: RtuTransmissionFields.projectName,
        displayOrder: 2
      },
      {
        columnName: RtuTransmissionFields.streetName,
        displayOrder: 3
      },
      {
        columnName: RtuTransmissionFields.streetFrom,
        displayOrder: 4
      },
      {
        columnName: RtuTransmissionFields.streetTo,
        displayOrder: 5
      }
    ],
    hiddenColumns: []
  };

  public columnOptions: IRtuTransmissionsTableColumnOptions = {
    [RtuTransmissionFields.id]: {
      shown: true,
      sortable: SortingStatus.active
    },
    [RtuTransmissionFields.status]: {
      shown: true,
      sortable: SortingStatus.active
    },
    [RtuTransmissionFields.projectName]: {
      shown: true,
      sortable: false
    },
    [RtuTransmissionFields.streetName]: {
      shown: true,
      sortable: false
    },
    [RtuTransmissionFields.streetFrom]: {
      shown: true,
      sortable: false
    },
    [RtuTransmissionFields.streetTo]: {
      shown: true,
      sortable: false
    }
  };

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly rtuExportLogService: RtuExportLogService
  ) {}

  public ngOnInit(): void {
    this.activatedRoute.params.pipe(map(p => p.id as string)).subscribe(async id => {
      await this.loadExportLog(id);
    });
  }

  public sortColumn(column: string, direction: SortDirection): void {
    if (this.columnOptions[column].sortable) {
      this.columnConfig.columns.forEach(item => {
        if (this.columnOptions[item.columnName].sortable) {
          this.columnOptions[item.columnName].sortable = SortingStatus.inactive;
        }
      });

      this.columnOptions[column].sorted = direction;
      this.columnOptions[column].sortable = SortingStatus.active;
      this.exportLog.projects = orderBy(this.exportLog.projects, column, [direction]);
    }
  }

  private async loadExportLog(id: string): Promise<void> {
    this.exportLog = await this.rtuExportLogService.getExportLog(id).toPromise();
  }
}

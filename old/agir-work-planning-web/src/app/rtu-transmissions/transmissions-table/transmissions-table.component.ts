import { Component, Input, NgZone, OnInit } from '@angular/core';
import { IRtuExportLog, IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { SortingStatus } from 'src/app/shared/directives/sort.directive';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { RtuTransmissionStatus } from 'src/app/shared/models/rtu-transmissions/rtu-transmission-status';
import {
  IRtuTransmissionsTableColumnOptions,
  RtuTransmissionFields,
  RtuTransmissionsTableColumnLabels
} from 'src/app/shared/models/rtu-transmissions/rtu-transmissions-table';
import { IColumnConfig } from 'src/app/shared/models/table/column-config-interfaces';
import { IPagination } from 'src/app/shared/models/table/pagination';

@Component({
  selector: 'app-transmissions-table',
  templateUrl: './transmissions-table.component.html',
  styleUrls: ['./transmissions-table.component.scss']
})
export class TransmissionsTableComponent extends BaseComponent implements OnInit {
  @Input() public fetchTransmissions: (
    orderBy: string[],
    pagination: IPagination
  ) => Observable<IPaginatedResults<IRtuImportLog | IRtuExportLog>>;
  @Input() public showDetails: (transmission: IRtuImportLog | IRtuExportLog) => boolean;

  private readonly INITIAL_PAGE = 1;
  private readonly PAGE_SIZE = 10;

  private readonly pageChangeSubject = new Subject();

  public RtuTransmissionsTableColumnLabels = RtuTransmissionsTableColumnLabels;
  public RtuTransmissionStatus = RtuTransmissionStatus;

  public columnConfig: IColumnConfig = {
    columns: [
      {
        columnName: RtuTransmissionFields.startDateTime,
        displayOrder: 0
      },
      {
        columnName: RtuTransmissionFields.endDateTime,
        displayOrder: 1
      },
      {
        columnName: RtuTransmissionFields.status,
        displayOrder: 2
      },
      {
        columnName: 'actions',
        displayOrder: 3
      },
      {
        columnName: RtuTransmissionFields.errorDetail,
        displayOrder: 4
      }
    ],
    hiddenColumns: []
  };

  public columnOptions: IRtuTransmissionsTableColumnOptions = {
    [RtuTransmissionFields.startDateTime]: {
      shown: true,
      sortable: SortingStatus.active,
      sorted: SortDirection.desc
    },
    [RtuTransmissionFields.endDateTime]: {
      shown: true,
      sortable: SortingStatus.active
    },
    [RtuTransmissionFields.status]: {
      shown: true,
      sortable: SortingStatus.active
    },
    actions: {
      shown: true,
      sortable: false
    },
    [RtuTransmissionFields.errorDetail]: {
      shown: true,
      sortable: false
    }
  };

  public transmissions: IRtuExportLog[] | IRtuImportLog[];

  public pagination: IPagination = {
    currentPage: this.INITIAL_PAGE,
    limit: this.PAGE_SIZE,
    offset: 0,
    pageSize: this.PAGE_SIZE,
    totalCount: 0
  };

  public isInitializingTable = false;
  public isLastPage = false;

  constructor(public zone: NgZone) {
    super();
  }

  public ngOnInit(): void {
    this.onChangePage(this.INITIAL_PAGE);
  }

  public onChangePage(pageNumber: number): void {
    this.isInitializingTable = true;
    this.pageChangeSubject.next();
    this.updatePaginationProperties(pageNumber);
    this.getTransmissions();
  }

  public sortColumn(column: string, direction: SortDirection): void {
    if (this.columnOptions[column].sortable) {
      this.columnConfig.columns.forEach(item => {
        this.columnOptions[item.columnName].sorted = null;
      });

      this.columnOptions[column].sorted = direction;
      this.isInitializingTable = true;
      this.getTransmissions();
    }
  }

  public getOrderByParams(): string[] {
    return this.columnConfig.columns
      .filter(column => this.columnOptions[column.columnName].sortable && this.columnOptions[column.columnName].sorted)
      .map(column =>
        this.columnOptions[column.columnName].sorted === SortDirection.asc ? column.columnName : `-${column.columnName}`
      );
  }

  public getTransmissions(): void {
    this.fetchTransmissions(this.getOrderByParams(), this.pagination)
      .pipe(takeUntil(this.destroy$))
      .subscribe(transmissions => {
        this.zone.run(() => {
          this.isInitializingTable = false;
          this.transmissions = transmissions.items;
          this.pagination.totalCount = transmissions.paging.totalCount;
        });
      });
  }

  private updatePaginationProperties(pageNumber: number): void {
    const offset = this.pagination.pageSize * (this.pagination.currentPage - 1);
    this.pagination.currentPage = pageNumber;
    this.pagination.offset = offset;
    this.pagination.limit = this.PAGE_SIZE;
  }
}

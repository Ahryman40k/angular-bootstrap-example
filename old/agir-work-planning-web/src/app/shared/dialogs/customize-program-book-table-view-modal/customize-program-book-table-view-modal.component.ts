import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep, sortBy } from 'lodash';

import { BaseComponent } from '../../components/base/base.component';
import {
  ALL_PROGRAM_BOOK_TABLE_COLUMNS,
  DEFAULT_PROGRAM_BOOK_TABLE_COLUMNS,
  ProgramBookTableColumnLabels,
  ProgramBookTableColumns
} from '../../models/table/column-config-enums';
import { IColumn } from '../../models/table/column-config-interfaces';

@Component({
  selector: 'app-customize-program-book-table-view-modal',
  templateUrl: './customize-program-book-table-view-modal.component.html',
  styleUrls: ['./customize-program-book-table-view-modal.component.scss']
})
export class CustomizeProgramBookTableViewModalComponent extends BaseComponent {
  public readonly ProgramBookTableColumnLabels = ProgramBookTableColumnLabels;
  public selectedColumns: IColumn[] = [];
  public unselectedColumns: IColumn[] = [];
  constructor(private readonly activeModal: NgbActiveModal) {
    super();
  }

  public initialize(columnsFromUserPreferences: IColumn[]): void {
    const columns = columnsFromUserPreferences || DEFAULT_PROGRAM_BOOK_TABLE_COLUMNS;
    this.selectedColumns = cloneDeep(columns);
    this.unselectedColumns = this.getUnselectedColumns(columns);
  }

  public saveTableView(): void {
    this.activeModal.close(this.selectedColumns);
  }

  public resetTableView(): void {
    this.selectedColumns = cloneDeep(DEFAULT_PROGRAM_BOOK_TABLE_COLUMNS);
    this.unselectedColumns = this.getUnselectedColumns(this.selectedColumns);
  }

  public cancel(): void {
    this.activeModal.close();
  }

  public moveColumFromUnselectedToSelected(column: IColumn): void {
    const index = this.unselectedColumns.findIndex(cn => cn.columnName === column.columnName);
    this.unselectedColumns.splice(index, 1);
    const displayOrders = this.selectedColumns.map(e => e.displayOrder);
    const maxDisplayedOrder = Math.max(...displayOrders);
    this.selectedColumns.push({
      columnName: column.columnName,
      displayOrder: maxDisplayedOrder + 1,
      fieldName: column.fieldName
    });
  }

  public moveColumnFromSelectedToUnselected(columnName: ProgramBookTableColumns): void {
    const index = this.selectedColumns.findIndex(column => column.columnName === columnName);
    const removedColumns = this.selectedColumns.splice(index, 1);
    this.unselectedColumns.push(removedColumns[0]);
    this.unselectedColumns = sortBy(this.unselectedColumns, cn => this.ProgramBookTableColumnLabels[cn.columnName]);
  }

  private getUnselectedColumns(selectedColumns: IColumn[]): IColumn[] {
    // Remove program from available column on programmed projects tab screen
    let columns = ALL_PROGRAM_BOOK_TABLE_COLUMNS.filter(val => val.columnName !== ProgramBookTableColumns.PROGRAM);
    selectedColumns.forEach(selectedColumn => {
      const index = columns.findIndex(column => column.columnName === selectedColumn.columnName);
      columns.splice(index, 1);
    });
    columns = sortBy(columns, e => this.ProgramBookTableColumnLabels[e.columnName]);

    return columns;
  }
}

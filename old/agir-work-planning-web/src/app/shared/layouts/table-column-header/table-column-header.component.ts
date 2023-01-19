import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';

import { IAppSort } from '../../directives/sort.directive';

@Component({
  selector: 'app-table-column-header',
  templateUrl: 'table-column-header.component.html',
  styleUrls: ['./table-column-header.component.scss']
})
export class TableColumnHeaderComponent {
  @HostBinding('class.table-header-cell') public get bindClass(): boolean {
    return true;
  }
  @Input() public set columnClass(columnClass: string) {
    this._columnClass = `col-${columnClass}`;
  }
  public get columnClass(): string {
    return this._columnClass;
  }

  @Input() public direction: string;

  @Input() public set condition(condition: boolean) {
    this._condition = isNil(condition) ? true : condition;
  }

  public get condition(): boolean {
    return this._condition;
  }
  @Input() public permission: Permission;
  @Input() public columnLabel: string;
  @Input() public sorting: boolean;

  @Output() public sortChange = new EventEmitter<IAppSort>();

  private _columnClass: string;
  private _condition: boolean;

  public handleSortChange(event: IAppSort): void {
    this.sortChange.next(event);
  }
}

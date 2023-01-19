import { ComponentPortal } from '@angular/cdk/portal';
import { Component, Injector, Input } from '@angular/core';
import { Permission, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';

import { ReturnCategory } from '../../models/projects/return-category';
import { IOptions } from '../../models/table/column-config-interfaces';
import { COLUMN_DATA } from '../../tokens/tokens';

@Component({
  selector: 'app-table-column-item',
  templateUrl: 'table-column-item.component.html',
  styleUrls: ['./table-column-item.component.scss']
})
export class TableColumnItemComponent {
  @Input() public set columnClass(columnClass: string) {
    this._columnClass = `col-${columnClass}`;
  }

  public get columnClass(): string {
    return this._columnClass;
  }

  @Input() public set condition(condition: boolean) {
    this._condition = isNil(condition) ? true : condition;
  }

  public get condition(): boolean {
    return this._condition;
  }

  public get isText(): boolean {
    return !this.isBadge && !this.link && !this.annualProgramYear;
  }
  @Input() public annualProgramYear: number;
  @Input() public innerClass: string;
  @Input() public isBadge: boolean;
  @Input() public isOpened: boolean;
  @Input() public link: string;
  @Input() public permission: Permission;
  @Input() public taxonomyGroup: TaxonomyGroup;
  @Input() public value: any;
  @Input() public options: IOptions = {};

  public ReturnCategory = ReturnCategory;

  private _columnClass: string;
  private _condition: boolean;

  constructor(private readonly injector: Injector) {}

  public get componentPortal(): ComponentPortal<any> {
    return new ComponentPortal(this.options.component, null, this.createInjector());
  }

  public createInjector(): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [{ provide: COLUMN_DATA, useValue: this.options.columnData }]
    });
  }
}

import { animate, state, style, transition, trigger } from '@angular/animations';
import { ComponentPortal } from '@angular/cdk/portal';
import { Component, Injector, Input, Type, ViewEncapsulation } from '@angular/core';
import { Permission } from '@villemontreal/agir-work-planning-lib';
import { get } from 'lodash';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';
import { BaseComponent } from '../../base/base.component';
import { VdmDataSource } from '../datasource/vdm-datasource';

export interface IVdmColumn<T> {
  label: string;
  property: string;
  format?: (data: T) => string | null;
  component?: Type<any>;
  sortAsc?: boolean;
  sticky?: boolean;
  fields: string[];
  permission?: Permission;
  sortedByDefault?: boolean;
  augmented?: any;
}

@Component({
  selector: 'vdm-table',
  templateUrl: './vdm-table.component.html',
  styleUrls: ['./vdm-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
  encapsulation: ViewEncapsulation.None
})
export class VdmTableComponent extends BaseComponent {
  public expandedElement;
  get displayedColumns() {
    return this.datasource.displayedColumns;
  }
  get columns(): IVdmColumn<any>[] {
    return this.datasource.columns;
  }

  @Input() public datasource: VdmDataSource<any, any>;
  @Input() public isProjectsList: boolean;

  private readonly columnComponents = new Map();

  constructor(private readonly injector: Injector) {
    super();
  }

  public createComponentDetail(data: any, columns: IVdmColumn<any>[], propery: string): ComponentPortal<any> {
    const column = columns.find(c => c.property === propery);
    const augmented = column.augmented !== undefined ? column.augmented(data) : null;
    const dataByColumn = { ...data, column: column.property, augmented };
    if (!this.columnComponents.has(dataByColumn) && column.component) {
      this.columnComponents.set(
        dataByColumn,
        new ComponentPortal(column.component, null, this.createInjector(dataByColumn))
      );
    }
    return this.columnComponents.get(dataByColumn);
  }

  public createComponent(data: any, column: IVdmColumn<any>, augmented: any): ComponentPortal<any> {
    // all columns have the same data, so we add column property to identify column component
    const dataByColumn = { ...data, column: column.property, augmented };
    if (!this.columnComponents.has(dataByColumn) && column.component) {
      this.columnComponents.set(
        dataByColumn,
        new ComponentPortal(column.component, null, this.createInjector(dataByColumn))
      );
    }
    return this.columnComponents.get(dataByColumn);
  }

  public valueOrDefault(data: string) {
    if (data && data.length > 0) {
      return data;
    }
    return 'N/D';
  }

  public createInjector(data: any): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [{ provide: COLUMN_DATA, useValue: data }]
    });
  }

  public trackBy(_index: number, data: any) {
    return data.id;
  }
  public get(data: any, key: string): string {
    return get(data, key);
  }

  public sort(column: IVdmColumn<any>) {
    column.sortAsc = !column.sortAsc;
    this.datasource.sortedColumnSubject.next(column);
  }
  public onPageChanged(pageIndex: number) {
    this.datasource.paginationSubject.next({ ...this.datasource.pagination, pageIndex });
  }
}

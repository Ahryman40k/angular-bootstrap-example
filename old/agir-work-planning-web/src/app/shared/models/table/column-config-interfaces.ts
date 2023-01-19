import { Type } from '@angular/core';
import { Permission, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';

import { SortingStatus } from '../../directives/sort.directive';

export interface IColumnConfig {
  columns: IColumn[];
  hiddenColumns: string[];
}

export interface IColumn {
  columnName: string;
  displayOrder: number;
  className?: string;
  fieldName?: string;
  condition?: boolean;
  sorting?: SortingStatus;
}
export interface IColumnOptions {
  [columnName: string]: IOptions;
}

export interface IOptions {
  annualProgramYear?: number;
  condition?: boolean;
  innerClass?: string;
  isBadge?: boolean;
  isCategory?: boolean;
  link?: string;
  permission?: Permission;
  taxonomyGroup?: TaxonomyGroup;
  value?: any;
  iconClass?: string;
  iconTooltip?: string;
  component?: Type<any>;
  // data to inject into Component
  columnData?: any;
}

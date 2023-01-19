import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { SortComponent } from '../sort/sort.component';

export type SortDirection = 'asc' | 'desc';

export interface ISortValue {
  key: string;
  direction: SortDirection;
}

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => UnidirectionalSortComponent),
  multi: true
};

@Component({
  selector: 'app-unidirectional-sort',
  templateUrl: './unidirectional-sort.component.html',
  styleUrls: ['./unidirectional-sort.component.scss'],
  providers: [valueAccessorProvider]
})
export class UnidirectionalSortComponent extends SortComponent {
  @Input() public ngSelectClass: string;
}

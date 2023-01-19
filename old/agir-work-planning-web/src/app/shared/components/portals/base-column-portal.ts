import { Inject } from '@angular/core';
import { COLUMN_DATA } from '../../tokens/tokens';

export class BaseComponentPortal<T> {
  constructor(@Inject(COLUMN_DATA) public data: T) {}
}

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FilterItemLayoutComponent } from '../filter-item-layout/filter-item-layout.component';
const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SubmissionNumberFilterItemLayoutComponent),
  multi: true
};

@Component({
  selector: 'app-submission-number-filter-item-layout',
  templateUrl: './submission-number-filter-item-layout.component.html',
  providers: [valueAccessorProvider]
})
export class SubmissionNumberFilterItemLayoutComponent extends FilterItemLayoutComponent {}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-work-type-filter',
  templateUrl: './work-type-filter.component.html',
  styleUrls: ['./work-type-filter.component.scss']
})
export class WorkTypeFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;

  public workTypes$ = this.taxonomiesService.group(TaxonomyGroup.workType).pipe(takeUntil(this.destroy$));

  constructor(
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.form = this.fb.group({
      workTypes: [this.globalFilterService.filter.workTypes]
    });
    this.form.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(formValue => this.globalFilterService.patch(formValue));
  }
}

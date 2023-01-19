import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-label-filter',
  templateUrl: './label-filter.component.html',
  styleUrls: ['./label-filter.component.scss']
})
export class LabelFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public projectCategories$ = this.taxonomiesService
    .group(TaxonomyGroup.projectCategory)
    .pipe(takeUntil(this.destroy$));
  public projectSubCategories$ = this.taxonomiesService
    .group(TaxonomyGroup.projectSubCategory)
    .pipe(takeUntil(this.destroy$));

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly fb: FormBuilder,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      projectCategories: [this.globalFilterService.filter.projectCategories],
      projectSubCategories: [this.globalFilterService.filter.projectSubCategories]
    });
    this.form.valueChanges.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(formValue => {
      Object.keys(formValue).forEach(key => formValue[key] === null && delete formValue[key]);
      this.globalFilterService.patch(formValue);
    });
  }
}

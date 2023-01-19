import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { Observable } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../../../shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from '../../../../shared/services/filters/global-filter.service';
import { TaxonomiesService } from '../../../../shared/services/taxonomies.service';

@Component({
  selector: 'app-medal-filter',
  templateUrl: 'medal-filter.component.html'
})
export class MedalFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public medals$: Observable<ITaxonomy[]>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initForm();
    this.initFormChanges();
    this.initMedals();
  }

  private initForm(): void {
    this.form = this.fb.group({
      medals: [this.globalFilterService.filter.medals]
    });
  }

  private initFormChanges(): void {
    this.form.valueChanges.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE), takeUntil(this.destroy$)).subscribe(formValue => {
      this.globalFilterService.patch(formValue);
    });
  }

  private initMedals(): void {
    this.medals$ = this.taxonomiesService.group(TaxonomyGroup.medalType).pipe(
      takeUntil(this.destroy$),
      map(medals => orderBy(medals, m => m.displayOrder, 'desc'))
    );
  }
}

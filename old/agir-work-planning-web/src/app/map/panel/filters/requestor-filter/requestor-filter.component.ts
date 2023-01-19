import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from '../../../../shared/services/filters/global-filter.service';

@Component({
  selector: 'app-requestor-filter',
  templateUrl: './requestor-filter.component.html',
  styleUrls: ['./requestor-filter.component.scss']
})
export class RequestorFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public requestors$ = this.taxonomiesService.group(TaxonomyGroup.requestor).pipe(takeUntil(this.destroy$));

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
      requestors: [this.globalFilterService.filter.requestors]
    });
    this.form.valueChanges.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(formValue => {
      this.globalFilterService.patch(formValue);
    });
  }
}

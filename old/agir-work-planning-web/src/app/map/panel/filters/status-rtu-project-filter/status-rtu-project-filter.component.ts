import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { debounceTime } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IGlobalFilter } from 'src/app/shared/models/filters/global-filter';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-status-rtu-project-filter',
  templateUrl: './status-rtu-project-filter.component.html',
  styleUrls: ['./status-rtu-project-filter.component.scss']
})
export class StatusRtuProjectFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public rtuProjectStatuses$ = this.taxonomiesService.group(TaxonomyGroup.rtuProjectStatus);

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly fb: FormBuilder,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.form = this.fb.group({
      rtuProjectStatuses: [this.globalFilterService.filter.rtuProjectStatuses]
    });
    this.form.valueChanges.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe((formValue: IGlobalFilter) => {
      this.globalFilterService.patch(formValue);
    });
  }
}

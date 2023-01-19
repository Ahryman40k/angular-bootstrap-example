import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { debounceTime, map, take, takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../../../shared/components/base/base.component';
import { RtuProjectCategory } from '../../../../shared/models/rtu-project-category';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from '../../../../shared/services/filters/global-filter.service';
import { IRtuPartnerByCategory, RtuProjectService } from '../../../../shared/services/rtu-project.service';
import { TaxonomiesService } from '../../../../shared/services/taxonomies.service';

@Component({
  selector: 'app-rtu-project-filter',
  templateUrl: './rtu-project-filter.component.html',
  styleUrls: ['./rtu-project-filter.component.scss']
})
export class RtuProjectFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public partners$ = this.taxonomiesService.group(TaxonomyGroup.infoRtuPartner).pipe(
    takeUntil(this.destroy$),
    map(t => t.filter(p => p.properties?.category === RtuProjectCategory.partner))
  );

  private rtuPartnerByCategory: IRtuPartnerByCategory;

  constructor(
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly rtuProjectService: RtuProjectService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initTaxonomies();
    this.form = this.fb.group({
      partnerId: [this.globalFilterService.filter.partnerId]
    });
    this.form.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(formValue => this.globalFilterService.patch(formValue));
  }

  private initTaxonomies(): void {
    this.taxonomiesService
      .group(TaxonomyGroup.infoRtuPartner)
      .pipe(take(1))
      .subscribe(x => (this.rtuPartnerByCategory = this.rtuProjectService.getPartnerIdsByCategory(x)));
  }
}

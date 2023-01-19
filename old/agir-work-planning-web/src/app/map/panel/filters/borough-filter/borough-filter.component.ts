import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BoroughCode, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

import { BoroughService } from '../../../../shared/services/borough.service';

@Component({
  selector: 'app-borough-filter',
  templateUrl: './borough-filter.component.html',
  styleUrls: ['./borough-filter.component.scss']
})
export class BoroughFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public boroughs$: Observable<ITaxonomy[]>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly boroughService: BoroughService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initForm();
    this.initFormChanges();
    this.initBoroughs();
  }

  private initForm(): void {
    this.form = this.fb.group({
      boroughs: [this.globalFilterService.filter.boroughs]
    });
  }

  private initFormChanges(): void {
    this.form.valueChanges.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(formValue => {
      this.globalFilterService.patch(formValue);
      void this.boroughService.zoomMapOnBoroughs();
    });
  }

  private initBoroughs(): void {
    this.boroughs$ = this.taxonomiesService.group(TaxonomyGroup.borough).pipe(
      takeUntil(this.destroy$),
      map(boroughs => boroughs.filter(b => b.code !== BoroughCode.MTL))
    );
  }
}

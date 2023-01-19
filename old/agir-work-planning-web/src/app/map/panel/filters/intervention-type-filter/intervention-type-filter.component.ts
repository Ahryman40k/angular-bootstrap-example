import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ITaxonomyList, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-intervention-type-filter',
  templateUrl: './intervention-type-filter.component.html'
})
export class InterventionTypeFilterComponent extends BaseComponent implements OnInit {
  public interventionTypes$: Observable<ITaxonomyList>;
  public interventionTypesControl = new FormControl(this.globalFilterService.filter.interventionTypes);

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initForm();
    this.interventionTypes$ = this.taxonomiesService.group(TaxonomyGroup.interventionType).pipe(
      takeUntil(this.destroy$),
      map(taxos => taxos.filter(x => x.code !== 'followup'))
    ); // TODO: Remove the filter when followup is made
  }

  private initForm(): void {
    this.interventionTypesControl.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(controlValue => this.globalFilterService.patch({ interventionTypes: controlValue }));
  }
}

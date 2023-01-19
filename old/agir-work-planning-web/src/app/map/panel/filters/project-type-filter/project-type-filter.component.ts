import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ITaxonomyList, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-project-type-filter',
  templateUrl: './project-type-filter.component.html'
})
export class ProjectTypeFilterComponent extends BaseComponent implements OnInit {
  public projectTypes$: Observable<ITaxonomyList>;
  public projectTypesControl = new FormControl(this.globalFilterService.filter.projectTypes);

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initForm();
    this.projectTypes$ = this.taxonomiesService.group(TaxonomyGroup.projectType).pipe(takeUntil(this.destroy$));
  }

  private initForm(): void {
    this.projectTypesControl.valueChanges.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(controlValue => {
      this.globalFilterService.patch({ projectTypes: controlValue });
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ITaxonomyList, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-program-type-filter',
  templateUrl: './program-type-filter.component.html'
})
export class ProgramTypeFilterComponent extends BaseComponent implements OnInit {
  public programTypes$: Observable<ITaxonomyList>;
  public programTypesControl = new FormControl(this.globalFilterService.filter.programTypes);

  constructor(
    private readonly globalFilterService: GlobalFilterService,
    private readonly taxonomiesService: TaxonomiesService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initForm();
    this.initProgramTypes();
  }

  private initForm(): void {
    this.programTypesControl.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE), takeUntil(this.destroy$))
      .subscribe(controlValue => {
        this.globalFilterService.patch({ programTypes: controlValue });
      });
  }

  private initProgramTypes(): void {
    this.programTypes$ = this.taxonomiesService.group(TaxonomyGroup.programType).pipe(takeUntil(this.destroy$));
  }
}

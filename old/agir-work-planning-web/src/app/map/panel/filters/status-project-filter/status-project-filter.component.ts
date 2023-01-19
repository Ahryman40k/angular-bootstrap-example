import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { ConfigurationTaxonomy } from 'src/app/shared/models/taxonomies/configuration-taxonomy';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-status-project-filter',
  templateUrl: './status-project-filter.component.html',
  styleUrls: ['./status-project-filter.component.scss']
})
export class StatusProjectFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public projectStatuses$ = this.taxonomiesService.group(TaxonomyGroup.projectStatus).pipe(
    switchMap(x => this.getFilterConfigCorrespondances(x)),
    takeUntil(this.destroy$)
  );

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
      projectStatuses: [this.globalFilterService.filter.projectStatuses]
    });
    this.form.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(formValue => this.globalFilterService.patch(formValue));
  }

  private getFilterConfigCorrespondances(projectStatusTaxonomies: ITaxonomy[]): Observable<ITaxonomy[]> {
    return this.taxonomiesService.code(TaxonomyGroup.configuration, ConfigurationTaxonomy.filterConfig).pipe(
      map(filterStatus => filterStatus.properties.projectStatuses as string[]),
      map(statuses => projectStatusTaxonomies.filter(projectStatus => statuses.includes(projectStatus.code)))
    );
  }
}

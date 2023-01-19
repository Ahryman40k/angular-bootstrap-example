import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  InterventionDecisionType,
  InterventionStatus,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { concat } from 'lodash';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IGlobalFilter } from 'src/app/shared/models/filters/global-filter';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-status-intervention-filter',
  templateUrl: './status-intervention-filter.component.html',
  styleUrls: ['./status-intervention-filter.component.scss']
})
export class StatusInterventionFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public formWaiting: FormGroup;

  public interventionStatuses$ = this.taxonomiesService.group(TaxonomyGroup.interventionStatus).pipe(
    map(el => el.filter(status => status.code !== InterventionStatus.waiting)),
    takeUntil(this.destroy$)
  );

  public waitingStatuses$ = this.taxonomiesService.group(TaxonomyGroup.interventionStatus).pipe(
    map(taxo => {
      const decisionTypeItem: ITaxonomy[] = [
        {
          code: InterventionDecisionType.revisionRequest,
          group: null,
          label: { fr: 'En attente (suite à une révision)' }
        }
      ];
      const waitingStatuses = taxo
        .filter(status => status.code === InterventionStatus.waiting)
        .map(x => {
          return {
            ...x,
            label: { fr: 'Tout afficher' }
          } as ITaxonomy;
        });

      return concat(waitingStatuses, decisionTypeItem);
    }),
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
      interventionStatuses: [this.interventionStatuses.filter(el => el !== InterventionStatus.waiting)]
    });
    this.form.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(() => this.globalFilterService.patch(this.interventionStatusesFilter));
    this.formWaiting = this.fb.group({
      interventionStatuses: [
        this.decisionTypeId.length
          ? this.decisionTypeId
          : this.interventionStatuses.includes(InterventionStatus.waiting)
          ? [InterventionStatus.waiting]
          : []
      ]
    });
    this.formWaiting.valueChanges.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(() => {
      this.globalFilterService.patch(this.interventionStatusesFilter);
    });
  }

  private get decisionTypeId(): string[] {
    return this.globalFilterService.filter.decisionTypeId || [];
  }
  private get interventionStatuses(): string[] {
    return this.globalFilterService.filter.interventionStatuses || [];
  }

  private get waitingStatuses(): string[] {
    return (this.formWaiting.controls.interventionStatuses.value as string[]) || [];
  }
  private get nonWaitingStatuses(): string[] {
    return (this.form.controls.interventionStatuses.value as string[]) || [];
  }
  private get interventionStatusesFilter(): IGlobalFilter {
    const interventionStatuses = this.waitingStatuses.length
      ? concat(this.nonWaitingStatuses, InterventionStatus.waiting)
      : this.nonWaitingStatuses;
    const decisionTypeId = this.waitingStatuses.includes(InterventionDecisionType.revisionRequest)
      ? [InterventionDecisionType.revisionRequest]
      : undefined;
    return {
      interventionStatuses: interventionStatuses?.length ? interventionStatuses : undefined,
      decisionTypeId: decisionTypeId?.length ? decisionTypeId : undefined
    };
  }
}

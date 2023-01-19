import { ChangeDetectionStrategy, Component, OnInit, Type } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AdditionalCostType,
  IAdditionalCost,
  IAdditionalCostsTotalAmount,
  IEnrichedIntervention,
  IEnrichedProject
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, flatten, orderBy } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { UpdateAnnualBudgetModalComponent } from 'src/app/shared/forms/annual-distribution/update-annual-budget-modal/update-annual-budget-modal.component';
import { UpdateInterventionAnnualDistributionModalComponent } from 'src/app/shared/forms/annual-distribution/update-intervention-annual-distribution-modal/update-intervention-annual-distribution-modal.component';
import { UpdateProjectAdditionalCostsComponent } from 'src/app/shared/forms/annual-distribution/update-project-additional-costs/update-project-additional-costs.component';
import { ISortValue } from 'src/app/shared/forms/sort/sort.component';
import { AnnualPeriodFilterKey, IAnnualPeriodFilter } from 'src/app/shared/models/annual-period/annual-period-filter';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ObjectTypeService } from 'src/app/shared/services/object-type.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';

import { IAnnualPeriodInterventionListItem } from '../annual-period-intervention-list-item';
import { BaseAnnualPeriodsComponent } from '../base-annual-periods-component';

interface IAdditionalCostListItem {
  type: AdditionalCostType;
  annualCosts: IAdditionalCost[];
  total: IAdditionalCostsTotalAmount;
}

@Component({
  selector: 'app-project-annual-periods',
  templateUrl: './project-annual-periods.component.html',
  styleUrls: ['./project-annual-periods.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectAnnualPeriodsComponent extends BaseAnnualPeriodsComponent implements OnInit {
  public filters: IAnnualPeriodFilter[];
  public sortFormControl: FormControl;
  public interventions$: Observable<IAnnualPeriodInterventionListItem[]>;
  public additionalCostItems$: Observable<IAdditionalCostListItem[]>;

  private readonly sortDefaultValue: ISortValue = { key: AnnualPeriodFilterKey.id, direction: 'desc' };

  constructor(
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    projectService: ProjectService,
    private readonly dialogsService: DialogsService,
    private readonly objectTypeService: ObjectTypeService,
    public interventionService: InterventionService
  ) {
    super(windowService, activatedRoute, projectService);
  }

  public ngOnInit(): void {
    this.filters = this.getFilters();
    this.sortFormControl = new FormControl(this.sortDefaultValue);
    this.initObservables();
  }

  public async editAnnualBudget(): Promise<void> {
    await this.openModal(UpdateAnnualBudgetModalComponent, this.project);
  }

  public async editIntervention(intervention: IEnrichedIntervention): Promise<void> {
    await this.openModal(UpdateInterventionAnnualDistributionModalComponent, intervention);
  }

  public getRestrictionsItemsForIntervention(intervention: IEnrichedIntervention): IRestrictionItem[] {
    return [{ entity: intervention, entityType: 'INTERVENTION' }];
  }

  public async editAdditionalCosts(): Promise<void> {
    await this.openModal(UpdateProjectAdditionalCostsComponent, this.project);
  }

  private async openModal<T>(component: Type<T>, object: IEnrichedIntervention | IEnrichedProject): Promise<void> {
    const modal = this.dialogsService.showModal(component);
    const objectType = this.objectTypeService.getObjectTypeFromModel(object);
    modal.componentInstance[objectType] = object;

    const result = await modal.result;
    if (!result) {
      return;
    }

    await this.windowService.refresh();
  }

  private initObservables(): void {
    const project$ = this.windowService.createObjectsObservable(this.destroy$).pipe(
      map(([project, _intervention]) => project),
      shareReplay()
    );
    this.initAdditionalCosts(project$);
    this.initInterventions(project$);
  }

  private initAdditionalCosts(project$: Observable<IEnrichedProject>): void {
    this.additionalCostItems$ = project$.pipe(
      map(project => {
        const additionalCosts: IAdditionalCostListItem[] = [];
        for (const additionalCostTotal of project.annualDistribution.distributionSummary.additionalCostTotals) {
          additionalCosts.push({
            type: additionalCostTotal.type as AdditionalCostType,
            total: additionalCostTotal,
            annualCosts: flatten(
              project.annualDistribution.annualPeriods.map(ap =>
                ap.additionalCosts.filter(ac => ac.type === additionalCostTotal.type)
              )
            )
          });
        }
        return additionalCosts;
      })
    );
  }

  private initInterventions(project$: Observable<IEnrichedProject>): void {
    this.interventions$ = combineLatest(
      project$,
      this.sortFormControl.valueChanges.pipe(startWith(this.sortDefaultValue))
    ).pipe(
      map(([project, sortValue]) => {
        if (!project?.interventions?.length) {
          return [];
        }

        let interventionListItems = cloneDeep(project.interventions) as IAnnualPeriodInterventionListItem[];
        interventionListItems = orderBy(interventionListItems, sortValue.key, sortValue.direction);
        for (const interventionListItem of interventionListItems) {
          this.enrichAnnualPeriodInterventionListItem(interventionListItem, project);
        }
        return interventionListItems;
      })
    );
  }

  private getFilters(): IAnnualPeriodFilter[] {
    return [
      { key: AnnualPeriodFilterKey.id, label: "Par ID d'intervention" },
      { key: AnnualPeriodFilterKey.requestor, label: 'Par requérant' },
      { key: AnnualPeriodFilterKey.planificationYear, label: 'Par année de planification' },
      { key: AnnualPeriodFilterKey.interventionLength, label: "Par longueur d'intervention" }
    ];
  }
}

import { ActivatedRoute } from '@angular/router';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { max, min } from 'lodash';
import { IGanttIndex } from 'src/app/shared/models/gantt/gant-index';
import { ProjectService } from 'src/app/shared/services/project.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { BaseDetailsComponent } from '../base-details-component';
import { IAnnualPeriodInterventionListItem } from './annual-period-intervention-list-item';

export abstract class BaseAnnualPeriodsComponent extends BaseDetailsComponent {
  public get projectYears(): number[] {
    return this.projectService.getProjectYearRange(this.project);
  }

  constructor(
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    private readonly projectService: ProjectService
  ) {
    super(windowService, activatedRoute);
  }

  protected enrichAnnualPeriodInterventionListItem(
    interventionListItem: IAnnualPeriodInterventionListItem,
    project: IEnrichedProject
  ): void {
    interventionListItem.annualPeriodsDictionary = {};
    for (const interventionAnnualPeriod of interventionListItem?.annualDistribution?.annualPeriods || []) {
      interventionListItem.annualPeriodsDictionary[interventionAnnualPeriod.year] = interventionAnnualPeriod;
    }
    interventionListItem.ganttIndex = this.getInterventionGanttIndexes(
      interventionListItem,
      project?.annualDistribution?.annualPeriods || []
    );
  }

  private getInterventionGanttIndexes(
    intervention: IEnrichedIntervention,
    annualPeriods: IEnrichedProjectAnnualPeriod[]
  ): IGanttIndex {
    const interventionAnnualPeriods = annualPeriods.filter(period =>
      period?.interventionIds?.includes(intervention.id)
    );
    const allYears = annualPeriods.map(period => period.year);
    const interventionYears = interventionAnnualPeriods.map(period => period.year);
    return {
      startIndex: allYears.indexOf(min(interventionYears)),
      endIndex: allYears.indexOf(max(interventionYears))
    };
  }
}

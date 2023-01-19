import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { IAnnualPeriodInterventionListItem } from '../annual-period-intervention-list-item';
import { BaseAnnualPeriodsComponent } from '../base-annual-periods-component';

@Component({
  selector: 'app-intervention-annual-periods',
  templateUrl: './intervention-annual-periods.component.html',
  styleUrls: ['./intervention-annual-periods.component.scss']
})
export class InterventionAnnualPeriodsComponent extends BaseAnnualPeriodsComponent implements OnInit {
  public interventionListItem$: Observable<IAnnualPeriodInterventionListItem>;
  public interventionListItem: IAnnualPeriodInterventionListItem;

  constructor(
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    projectService: ProjectService,
    public interventionService: InterventionService
  ) {
    super(windowService, activatedRoute, projectService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initIntervention();
  }

  private initIntervention(): void {
    this.interventionListItem$ = this.windowService.createObjectsObservable(this.destroy$).pipe(
      map(([project, intervention]) => {
        if (!intervention || !project) {
          return null;
        }
        const interventionListItem = cloneDeep(intervention) as IAnnualPeriodInterventionListItem;
        this.enrichAnnualPeriodInterventionListItem(interventionListItem, project);
        return interventionListItem;
      }),
      shareReplay()
    );
    this.interventionListItem$.subscribe(interventionListItem => (this.interventionListItem = interventionListItem));
  }
}

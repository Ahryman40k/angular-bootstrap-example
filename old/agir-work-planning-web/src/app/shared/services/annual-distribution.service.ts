import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IInterventionAnnualDistribution,
  IPlainProjectAnnualDistribution
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { environment } from 'src/environments/environment';

import { BroadcastEvent, WindowBroadcastService } from '../window/window-broadcast.service';

@Injectable({
  providedIn: 'root'
})
export class AnnualDistributionService {
  constructor(private readonly http: HttpClient, private readonly broadcastService: WindowBroadcastService) {}
  public canProgramAnnualPeriod(annualPeriod: IEnrichedProjectAnnualPeriod, project: IEnrichedProject): boolean {
    const annualPeriodIndex = project.annualDistribution.annualPeriods.indexOf(annualPeriod);

    for (let i = 0; i < annualPeriodIndex; i++) {
      if (!project.annualDistribution.annualPeriods[i].programBookId) {
        return false;
      }
    }
    return true;
  }

  public canDeprogramAnnualPeriod(annualPeriod: IEnrichedProjectAnnualPeriod, project: IEnrichedProject): boolean {
    const annualPeriodIndex = project.annualDistribution.annualPeriods.indexOf(annualPeriod);
    for (let i = project.annualDistribution.annualPeriods.length - 1; i > annualPeriodIndex; i--) {
      if (project.annualDistribution.annualPeriods[i].programBookId) {
        return false;
      }
    }
    return true;
  }

  public async updateProjectAnnualDistribution(
    projectId: string,
    annualDistribution: IPlainProjectAnnualDistribution
  ): Promise<void> {
    await this.http
      .put<IPlainProjectAnnualDistribution>(
        `${environment.apis.planning.projects}/${projectId}/annualDistribution`,
        annualDistribution
      )
      .toPromise();
  }

  public async updateInterventionAnnualDistribution(
    interventionId: string,
    annualDistribution: IInterventionAnnualDistribution
  ): Promise<void> {
    await this.http
      .put<IInterventionAnnualDistribution>(
        `${environment.apis.planning.interventions}/${interventionId}/annualDistribution`,
        annualDistribution
      )
      .toPromise();
  }
}

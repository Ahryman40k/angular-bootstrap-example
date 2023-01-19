import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IInterventionDecision,
  InterventionDecisionType,
  IProjectDecision
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten } from 'lodash';
import { BehaviorSubject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BroadcastEvent, WindowBroadcastService } from '../window/window-broadcast.service';

@Injectable({
  providedIn: 'root'
})
export class DecisionsService {
  private readonly currentDecisionSubject = new BehaviorSubject<IInterventionDecision>(null);
  public currentDecision$ = this.currentDecisionSubject.asObservable();
  constructor(private readonly http: HttpClient, private readonly broadcastService: WindowBroadcastService) {}

  public setCurrentDecision(decision: IInterventionDecision): void {
    this.currentDecisionSubject.next(decision);
  }

  public getCurrentDecision(): IInterventionDecision {
    return this.currentDecisionSubject.getValue();
  }

  public async createInterventionDecision(id: string, decision: IInterventionDecision): Promise<void> {
    if (decision.typeId === InterventionDecisionType.canceled) {
      decision.targetYear = undefined;
    }
    await this.http
      .post<IInterventionDecision>(`${environment.apis.planning.interventions}/${id}/decisions`, decision)
      .toPromise();
  }

  public async createProjectDecision(id: string, decision: IProjectDecision): Promise<void> {
    await this.http
      .post<IProjectDecision>(`${environment.apis.planning.projects}/${id}/decisions`, { decision })
      .toPromise();
  }

  public getInterventionDecisions(id: string): Promise<IInterventionDecision[]> {
    return this.http
      .get<IInterventionDecision[]>(`${environment.apis.planning.interventions}/${id}/decisions`)
      .toPromise();
  }

  public getProjectDecisions(id: string): Promise<IInterventionDecision[]> {
    return this.http.get<IInterventionDecision[]>(`${environment.apis.planning.projects}/${id}/decisions`).toPromise();
  }

  public async getMultipleInterventionsDecisions(ids: string[]): Promise<IInterventionDecision[]> {
    const results = await Promise.all(ids.map(id => this.getInterventionDecisions(id)));
    return flatten(results.filter(x => x !== null));
  }
}

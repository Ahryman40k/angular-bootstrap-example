import { Injectable } from '@angular/core';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionExpand,
  IPlainIntervention,
  IPlainProject,
  IRtuProject,
  ProjectExpand
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject, combineLatest, merge, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BroadcastEvent, WindowBroadcastService } from '../window/window-broadcast.service';
import { AssetService } from './asset.service';
import { InterventionService } from './intervention.service';
import { ProjectService } from './project.service';
import { RtuProjectService } from './rtu-project.service';

export type WindowResult = IPlainIntervention | IEnrichedIntervention | IPlainProject | IEnrichedProject;

@Injectable()
export class WindowService {
  private readonly projectSubject = new BehaviorSubject<IEnrichedProject>(null);
  public project$ = this.projectSubject.asObservable();
  public get currentProject(): IEnrichedProject {
    return this.projectSubject.value;
  }
  public projectChanged$: Observable<unknown>;

  private readonly interventionSubject = new BehaviorSubject<IEnrichedIntervention>(null);
  public intervention$ = this.interventionSubject.asObservable();
  public get currentIntervention(): IEnrichedIntervention {
    return this.interventionSubject.value;
  }

  private readonly assetSubject = new BehaviorSubject<IAsset>(null);
  public asset$ = this.assetSubject.asObservable();
  public get currentAsset(): IAsset {
    return this.assetSubject.value;
  }

  private readonly rtuProjectSubject = new BehaviorSubject<IRtuProject>(null);
  public rtuProject$ = this.rtuProjectSubject.asObservable();
  public get currentRtuProject(): IRtuProject {
    return this.rtuProjectSubject.value;
  }

  public get canInteract(): boolean {
    return (
      (!this.currentProject || this.projectService.canInteract(this.currentProject)) &&
      (!this.currentIntervention || this.interventionService.canInteract(this.currentIntervention))
    );
  }

  constructor(
    private readonly projectService: ProjectService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly interventionService: InterventionService,
    private readonly assetService: AssetService,
    broadcastService: WindowBroadcastService
  ) {
    this.projectChanged$ = merge(
      broadcastService.observable(BroadcastEvent.interventionUpdated),
      broadcastService.observable(BroadcastEvent.projectUpdated)
    );
    this.projectChanged$.subscribe(() => {
      if (this.currentProject) {
        void this.setProject(this.currentProject.id);
      }
    });
  }

  public async setProjectWithInterventions(projectId: string): Promise<void> {
    const p = await this.projectService.getProject(projectId, [ProjectExpand.interventions]);
    this.projectSubject.next(p);
  }

  public async setProject(projectId: string): Promise<void> {
    const p = await this.projectService.getFullProject(projectId);
    this.projectSubject.next(p);
  }

  public async setIntervention(interventionId: string): Promise<void> {
    if (this.currentIntervention?.id === interventionId) {
      return;
    }
    if (!interventionId) {
      this.interventionSubject.next(null);
      return;
    }
    if (this.currentProject) {
      const intervention = this.currentProject.interventions.find(i => i.id === interventionId);
      this.interventionSubject.next(intervention);
    } else {
      const intervention = await this.interventionService.getIntervention<IEnrichedIntervention>(interventionId, [
        InterventionExpand.assets
      ]);
      if (intervention?.project?.id) {
        await this.setProject(intervention.project.id);
      }
      this.interventionSubject.next(intervention);
    }
  }

  public async setRtuProject(rtuProjectId: string): Promise<void> {
    if (this.currentRtuProject?.id === rtuProjectId) {
      return;
    }
    if (!rtuProjectId) {
      this.rtuProjectSubject.next(null);
      return;
    }
    const rtuProject = await this.rtuProjectService.getRtuProject(rtuProjectId);
    this.rtuProjectSubject.next(rtuProject);
  }

  public async setAsset(assetType: AssetType, assetId: string): Promise<void> {
    const a = await this.assetService.get(assetType, assetId, ['assetDetails']);
    this.assetSubject.next(a);
  }

  public createObjectsObservable(
    takeUntilSubject?: Observable<any>
  ): Observable<[IEnrichedProject, IEnrichedIntervention]> {
    let observable = combineLatest(this.project$, this.intervention$);
    if (takeUntilSubject) {
      observable = observable.pipe(takeUntil(takeUntilSubject));
    }
    return observable;
  }

  public async refresh(): Promise<void> {
    const promises = [];
    if (this.currentProject) {
      promises.push(this.refreshProject());
    }
    if (this.currentIntervention) {
      promises.push(this.refreshIntervention());
    }
    if (promises.length) {
      await Promise.all(promises);
    }
  }

  private async refreshProject(): Promise<void> {
    if (!this.projectSubject.value) {
      return;
    }
    this.projectSubject.next(await this.projectService.getFullProject(this.projectSubject.value.id));
  }

  private async refreshIntervention(): Promise<void> {
    if (!this.interventionSubject.value) {
      return;
    }
    this.interventionSubject.next(await this.interventionService.getIntervention(this.interventionSubject.value.id));
  }
}

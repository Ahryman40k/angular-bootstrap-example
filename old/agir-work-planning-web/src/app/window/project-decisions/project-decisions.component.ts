import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IProjectDecision } from '@villemontreal/agir-work-planning-lib/dist/src';
import { from, Observable } from 'rxjs';
import { mergeMap, shareReplay, takeUntil } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import {
  DecisionCreateCloseType,
  ProjectDecisionCreateModalComponent
} from 'src/app/shared/forms/project-decision-create-modal/project-decision-create-modal.component';
import { DecisionsService } from 'src/app/shared/services/decisions.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { UserService } from 'src/app/shared/user/user.service';

import { BaseDecisionsComponent } from '../base-decisions-component';

@Component({
  selector: 'app-project-decisions',
  templateUrl: './project-decisions.component.html',
  styleUrls: ['./project-decisions.component.scss']
})
export class ProjectDecisionsComponent extends BaseDecisionsComponent {
  public decisions$: Observable<IProjectDecision[]>;

  constructor(
    activatedRoute: ActivatedRoute,
    private readonly decisionsService: DecisionsService,
    private readonly dialogsService: DialogsService,
    public projectsService: ProjectService,
    private readonly router: Router,
    userService: UserService,
    windowService: WindowService
  ) {
    super(activatedRoute, userService, windowService);
    this.decisions$ = this.createDecisionsObservable();
  }

  private createDecisionsObservable(): Observable<IProjectDecision[]> {
    return this.windowService.project$.pipe(
      takeUntil(this.destroy$),
      mergeMap(() => from(this.decisionsService.getProjectDecisions(this.project.id))),
      shareReplay()
    );
  }

  public async openCreationModal(): Promise<void> {
    const modal = this.dialogsService.showModal(ProjectDecisionCreateModalComponent);
    modal.componentInstance.project = this.project;

    const result: DecisionCreateCloseType = await modal.result;
    if (result === DecisionCreateCloseType.created) {
      void this.windowService.refresh();
    }
  }
}

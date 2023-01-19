import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IInterventionDecision,
  InterventionDecisionType,
  InterventionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { from, Observable, of } from 'rxjs';
import { mergeMap, shareReplay } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import {
  DecisionRevisionCloseType,
  DecisionRevisionComponent
} from 'src/app/shared/forms/decision/decision-revision/decision-revision.component';
import {
  IDecisionCreateComponentResult,
  InterventionDecisionCreateComponent
} from 'src/app/shared/forms/decision/intervention-decision-create.component';
import { DecisionsService } from 'src/app/shared/services/decisions.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { UserService } from 'src/app/shared/user/user.service';

import { BaseDecisionsComponent } from '../base-decisions-component';
import { AcceptDecisionCloseType, DecisionAcceptComponent } from '../decision-accept/decision-accept.component';
import { DecisionRefuseComponent, RefuseDecisionCloseType } from '../decision-refuse/decision-refuse.component';

@Component({
  selector: 'app-intervention-decisions',
  templateUrl: './intervention-decisions.component.html'
})
export class InterventionDecisionsComponent extends BaseDecisionsComponent {
  private readonly _isDecisionRequired: boolean;

  public InterventionStatus = InterventionStatus;
  public decisions$: Observable<IInterventionDecision[]>;

  public get isDecisionRequired(): boolean {
    if (this.windowService.currentIntervention) {
      return this.windowService.currentIntervention.decisionRequired;
    }
    return this._isDecisionRequired;
  }

  constructor(
    activatedRoute: ActivatedRoute,
    private readonly decisionsService: DecisionsService,
    public interventionsService: InterventionService,
    private readonly dialogsService: DialogsService,
    private readonly router: Router,
    userService: UserService,
    windowService: WindowService
  ) {
    super(activatedRoute, userService, windowService);
    this.decisions$ = this.createDecisionsObservable();
  }

  public async openRevisionModal(): Promise<void> {
    const modal = this.dialogsService.showModal(DecisionRevisionComponent);
    modal.componentInstance.intervention = this.intervention;

    const result = (await modal.result) as DecisionRevisionCloseType;
    if (result === DecisionRevisionCloseType.confirmed) {
      this.refresh();
    }
  }

  public refresh(): void {
    void this.windowService.refresh();
  }

  private createDecisionsObservable(): Observable<IInterventionDecision[]> {
    return this.windowService.createObjectsObservable(this.destroy$).pipe(
      mergeMap(x => {
        const [project, intervention] = x;
        if (intervention) {
          return from(this.decisionsService.getInterventionDecisions(intervention.id));
        }
        if (project) {
          return from(this.decisionsService.getMultipleInterventionsDecisions(project.interventionIds));
        }
        return of([]);
      }),
      shareReplay()
    );
  }

  public canMakeRevision(decision: IInterventionDecision, index: number): boolean {
    return decision.typeId === InterventionDecisionType.refused && index === 0;
  }

  public async acceptDecision(): Promise<void> {
    const modal = this.dialogsService.showModal(DecisionAcceptComponent, 'modal-large');
    modal.componentInstance.intervention = this.intervention;

    const result = (await modal.result) as AcceptDecisionCloseType;
    if (result === AcceptDecisionCloseType.accepted) {
      this.refresh();
    }
  }

  public async openRefuseModal(): Promise<void> {
    const modal = this.dialogsService.showModal(DecisionRefuseComponent);
    modal.componentInstance.intervention = this.intervention;

    const result = (await modal.result) as RefuseDecisionCloseType;
    if (result === RefuseDecisionCloseType.refused) {
      this.refresh();
    }
  }

  public async openCreateModal(): Promise<void> {
    const modal = this.dialogsService.showModal(InterventionDecisionCreateComponent);
    modal.componentInstance.hasDecisionRefusedPermission = await this.userService.hasPermission(
      this.Permission.INTERVENTION_DECISION_ACCEPTED_REFUSED_CREATE
    );
    modal.componentInstance.hasDecisionReturnedPermission = await this.userService.hasPermission(
      this.Permission.INTERVENTION_DECISION_RETURNED_CREATE
    );

    modal.componentInstance.intervention = this.intervention;

    const result: IDecisionCreateComponentResult = await modal.result;

    if (result?.decisionCreated) {
      if (result.projectRedirect) {
        await this.windowService.setIntervention(null);
        await this.router.navigate(['/window/projects', this.project.id, 'overview']);
      }

      this.refresh();
    }
  }
}

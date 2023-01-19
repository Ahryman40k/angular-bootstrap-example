import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IConflictualItem,
  IEnrichedIntervention,
  IInterventionDecision,
  InterventionDecisionType,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { RequirementCreateComponent } from 'src/app/shared/forms/requirements-create/requirement-create.component';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DecisionsService } from 'src/app/shared/services/decisions.service';
import { RequirementService } from 'src/app/shared/services/requirement.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { UserService } from 'src/app/shared/user/user.service';

export enum AcceptDecisionCloseType {
  accepted = 'accepted',
  rejected = 'rejected'
}
@Component({
  selector: 'app-decision-accept',
  templateUrl: './decision-accept.component.html',
  styleUrls: ['./decision-accept.component.scss'],
  providers: [WindowService]
})
export class DecisionAcceptComponent implements OnInit {
  @ViewChild(RequirementCreateComponent) public requirementChild;
  public intervention: IEnrichedIntervention;
  public addRequirement: FormControl;
  public form: FormGroup;
  public submitting = false;

  public requirementFormValid: boolean = false;

  public get canSubmit(): boolean {
    return (
      this.submitting ||
      (this.form.invalid && !this.requirementService.getRequirementCreationFormStatus() && this.addRequirement.value)
    );
  }

  constructor(
    private readonly decisionsService: DecisionsService,
    private readonly requirementService: RequirementService,
    private readonly fb: FormBuilder,
    private readonly notificationsService: NotificationsService,
    private readonly activeModal: NgbActiveModal,
    private readonly userService: UserService
  ) {}

  public ngOnInit(): void {
    this.addRequirement = new FormControl();
    this.form = this.createForm();
  }
  public get canWriteRequirement(): boolean {
    if (!this.userService.currentUser) {
      return false;
    }
    return this.userService.currentUser.hasPermission(Permission.REQUIREMENT_WRITE);
  }

  public reject(): void {
    this.activeModal.close(AcceptDecisionCloseType.rejected);
  }

  private async acceptWithRequirement(): Promise<void> {
    const decision: IInterventionDecision = {
      typeId: InterventionDecisionType.accepted,
      text: 'Accepté (Go) avec exigence',
      targetYear: this.intervention.planificationYear
    };
    const requirementUpsert = this.requirementChild.getDataRequirement();
    const objectBase: IConflictualItem = {
      id: this.intervention.id,
      type: 'intervention'
    };
    requirementUpsert.items.unshift(objectBase);
    await this.decisionsService.createInterventionDecision(this.intervention.id, decision);
    this.requirementService.addRequirement(requirementUpsert).subscribe(
      () => {
        this.notificationsService.show('Exigence créée', NotificationAlertType.success);
      },
      error => {
        this.notificationsService.show(error.message, NotificationAlertType.danger);
      }
    );
  }

  public async accept(): Promise<void> {
    this.submitting = true;
    if (this.addRequirement.value) {
      await this.acceptWithRequirement();
    } else {
      const decision: IInterventionDecision = {
        typeId: InterventionDecisionType.accepted,
        text: 'Accepté (Go)',
        targetYear: this.intervention.planificationYear
      };
      await this.decisionsService.createInterventionDecision(this.intervention.id, decision);
    }
    this.notificationsService.show('Intervention acceptée', NotificationAlertType.success);
    this.submitting = false;
    this.activeModal.close(AcceptDecisionCloseType.accepted);
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      type: [null, Validators.required],
      description: [null, Validators.required]
    });
    return form;
  }
}

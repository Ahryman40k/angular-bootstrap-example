import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedIntervention,
  IInterventionDecision,
  InterventionDecisionType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DecisionsService } from 'src/app/shared/services/decisions.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { markAllAsTouched } from '../../forms.utils';

export enum DecisionRevisionCloseType {
  confirmed = 'confirmed',
  cancel = 'cancel'
}
@Component({
  selector: 'app-decision-revision',
  templateUrl: './decision-revision.component.html',
  styleUrls: ['./decision-revision.component.scss'],
  providers: [WindowService]
})
export class DecisionRevisionComponent implements OnInit {
  public form: FormGroup;
  public intervention: IEnrichedIntervention;

  constructor(
    private readonly fb: FormBuilder,
    private readonly decisionsService: DecisionsService,
    private readonly notificationsService: NotificationsService,
    private readonly activeModal: NgbActiveModal
  ) {}

  public ngOnInit(): void {
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      justification: [null, Validators.required]
    });
    return form;
  }

  public cancel(): void {
    this.activeModal.close(DecisionRevisionCloseType.cancel);
  }

  public async requestRevision(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    const decision: IInterventionDecision = {
      typeId: InterventionDecisionType.revisionRequest,
      text: this.form.controls.justification.value,
      targetYear: this.intervention.planificationYear
    };
    await this.decisionsService.createInterventionDecision(this.intervention.id, decision);
    this.notificationsService.show('La demande de révision à bien été complétée', NotificationAlertType.success);
    this.activeModal.close(DecisionRevisionCloseType.confirmed);
  }
}

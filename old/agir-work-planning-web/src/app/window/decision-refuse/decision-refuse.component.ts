import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedIntervention,
  IInterventionDecision,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DecisionsService } from 'src/app/shared/services/decisions.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { WindowService } from 'src/app/shared/services/window.service';

export enum RefuseDecisionCloseType {
  refused = 'refused',
  cancel = 'cancel'
}
@Component({
  selector: 'app-decision-refuse',
  templateUrl: './decision-refuse.component.html',
  styleUrls: ['./decision-refuse.component.scss'],
  providers: [WindowService]
})
export class DecisionRefuseComponent implements OnInit {
  public refuseTypes$: Observable<ITaxonomy[]>;
  public form: FormGroup;
  public intervention: IEnrichedIntervention;

  constructor(
    private readonly fb: FormBuilder,
    private readonly notificationsService: NotificationsService,
    private readonly decisionsService: DecisionsService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly activeModal: NgbActiveModal
  ) {
    this.refuseTypes$ = this.createRefuseTypesObservable();
  }

  public ngOnInit(): void {
    this.form = this.createForm();
  }

  public return(): void {
    this.activeModal.close(RefuseDecisionCloseType.cancel);
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (!this.intervention || this.form.invalid) {
      return;
    }
    const decision: IInterventionDecision = {
      typeId: 'refused',
      refusalReasonId: this.form.controls.refuseType.value,
      text: this.form.controls.justification.value
    };
    await this.decisionsService.createInterventionDecision(this.intervention.id, decision);
    this.notificationsService.show("L'intervention a bien été refusée", NotificationAlertType.success);
    this.activeModal.close(RefuseDecisionCloseType.refused);
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      refuseType: [null, Validators.required],
      justification: [null, Validators.required]
    });
    return form;
  }

  private createRefuseTypesObservable(): Observable<ITaxonomy[]> {
    return this.taxonomiesService.group(TaxonomyGroup.interventionDecisionRefused).pipe(take(1));
  }
}

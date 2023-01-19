import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbCalendar, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionDecision,
  InterventionDecisionType,
  InterventionStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { IDate, ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { findKey, isNil } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, mergeMap, take, takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../components/base/base.component';
import { NotificationAlertType } from '../../notifications/notification-alert';
import { NotificationsService } from '../../notifications/notifications.service';
import { DecisionsService } from '../../services/decisions.service';
import { ProjectService } from '../../services/project.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { WindowService } from '../../services/window.service';
import { markAllAsTouched } from '../forms.utils';

export enum DecisionCreateCloseType {
  created = 'created',
  canceled = 'canceled'
}

export interface IDecisionCreateComponentResult {
  decisionCreated: boolean;
  projectRedirect?: boolean;
}

@Component({
  selector: 'app-decision-create',
  templateUrl: './intervention-decision-create.component.html',
  styleUrls: ['./intervention-decision-create.component.scss'],
  providers: [WindowService]
})
export class InterventionDecisionCreateComponent extends BaseComponent implements OnInit {
  @Input() public buttonText: string;
  @Input() public decisionTypes: ITaxonomy[];
  @Input() public date: IDate;
  @Input() public justificative: string;

  public form: FormGroup;
  public currentDate: NgbDateStruct;
  public minYear: number;
  public selectedItemType: string;
  public intervention: IEnrichedIntervention;
  public project?: IEnrichedProject;
  public showAlert: boolean = false;
  public showRefuseTypes: boolean = false;
  public submitting = false;
  public hasDecisionRefusedPermission: boolean = false;
  public hasDecisionReturnedPermission: boolean = false;

  public taxos: { [name: string]: ITaxonomy[] } = {};

  public decisionTypes$: Observable<ITaxonomy[]>;
  public refuseTypes$: Observable<ITaxonomy[]>;

  constructor(
    private readonly calendar: NgbCalendar,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly fb: FormBuilder,
    private readonly decisionsService: DecisionsService,
    private readonly notificationsService: NotificationsService,
    private readonly windowService: WindowService,
    private readonly activeModal: NgbActiveModal,
    private readonly projectService: ProjectService
  ) {
    super();
    this.currentDate = this.calendar.getToday();
    this.decisionTypes$ = this.createDecisionTypesObservable();
    this.refuseTypes$ = this.createRefuseTypesObservable();
  }

  public async ngOnInit(): Promise<void> {
    this.decisionsService.currentDecision$.pipe(takeUntil(this.destroy$)).subscribe(decision => {
      this.createForm(decision);
    });
    this.form.controls.decisionType.valueChanges.subscribe(x => {
      if (x.code === InterventionStatus.canceled) {
        this.showAlert = true;
        this.form.controls.date.reset(this.currentDate);
        this.form.controls.date.enable();
      } else {
        this.showAlert = false;
        this.form.controls.date.reset(this.currentDate);
        this.form.controls.date.disable();
      }
      this.showRefuseTypes = x.code === InterventionStatus.refused;
      if (this.showRefuseTypes) {
        this.form.controls.refuseType.enable();
      } else {
        this.form.controls.refuseType.disable();
      }
    });
    this.minYear = this.currentDate.year;
    if (this.intervention?.project) {
      this.project = await this.projectService.getProject(this.intervention.project.id);
    }
  }

  public async createDecision(): Promise<void> {
    this.submitting = true;
    try {
      const decision: IInterventionDecision = this.getDecisionForm(this.form);
      await this.decisionsService.createInterventionDecision(this.intervention.id, decision);
      this.notificationsService.show(
        decision.typeId ? 'Décision ajoutée' : "L'intervention est annulée",
        NotificationAlertType.success
      );
      this.closeModal({
        decisionCreated: true,
        // If the intervention is in a project and the decision is a cancelation we redirect to the project details.
        projectRedirect: this.project && decision.typeId === InterventionDecisionType.canceled
      });
    } finally {
      this.submitting = false;
    }
  }

  public getDecisionForm(formDecision: FormGroup): IInterventionDecision {
    return {
      typeId: formDecision.controls.decisionType.value.code,
      text: formDecision.controls.justification.value,
      refusalReasonId: formDecision.controls.refuseType.value
    };
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    await this.createDecision();
  }

  public cancel(): void {
    this.closeModal({ decisionCreated: false });
  }

  private createForm(decision?: IInterventionDecision): void {
    this.form = this.fb.group({
      date: [{ value: null, disabled: true }, Validators.required],
      justification: [null, Validators.required],
      decisionType: [null, Validators.required],
      refuseType: [null, Validators.required]
    });
    this.form.reset({ date: this.currentDate });
    if (decision) {
      this.form.controls.decisionType.reset(decision.typeId ? decision.typeId : null);
      if (decision.audit) {
        this.form.controls.date.setValue(decision.audit.lastModifiedAt || decision.audit.createdAt);
      }
      this.form.controls.justification.setValue(decision.text ? decision.text : null);
    }
  }

  private createRefuseTypesObservable(): Observable<ITaxonomy[]> {
    return this.taxonomiesService.group(TaxonomyGroup.interventionDecisionRefused).pipe(take(1));
  }

  private createDecisionTypesObservable(): Observable<ITaxonomy[]> {
    const windowSelectionObservable = this.windowService.createObjectsObservable(this.destroy$);

    return combineLatest(
      windowSelectionObservable,
      windowSelectionObservable.pipe(
        mergeMap(([project, intervention]) => {
          const selectedItemType = project ? TaxonomyGroup.projectDecisionType : TaxonomyGroup.interventionDecisionType;
          return this.taxonomiesService.group(selectedItemType).pipe(take(1));
        })
      )
    ).pipe(
      map(([[_project, intervention], taxonomies]) => {
        const rightDecisionTypes: ITaxonomy[] = [];
        if (
          this.intervention &&
          this.intervention.status === InterventionStatus.accepted &&
          isNil(this.intervention.project?.id) &&
          this.hasDecisionRefusedPermission
        ) {
          rightDecisionTypes.push(taxonomies[findKey(taxonomies, { code: InterventionDecisionType.refused })]);
        }
        if (
          this.intervention &&
          this.intervention.status === InterventionStatus.waiting &&
          isNil(this.intervention.programId) &&
          isNil(this.intervention.project?.id) &&
          this.hasDecisionReturnedPermission
        ) {
          rightDecisionTypes.push(taxonomies[findKey(taxonomies, { code: InterventionDecisionType.returned })]);
        }
        if (this.intervention && this.intervention.status !== InterventionStatus.canceled) {
          rightDecisionTypes.push(taxonomies[findKey(taxonomies, { code: InterventionDecisionType.canceled })]);
        }
        return rightDecisionTypes;
      })
    );
  }

  private closeModal(result: IDecisionCreateComponentResult): void {
    this.activeModal.close(result);
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbCalendar, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedAnnualProgram,
  IEnrichedProject,
  IProjectDecision,
  Permission,
  ProjectDecisionType,
  ProjectStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { findKey } from 'lodash';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { arrayOfNumbers } from '../../arrays/number-arrays';
import { BaseComponent } from '../../components/base/base.component';
import { NotificationAlertType } from '../../notifications/notification-alert';
import { NotificationsService } from '../../notifications/notifications.service';
import { DecisionsService } from '../../services/decisions.service';
import { ProjectService } from '../../services/project.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { WindowService } from '../../services/window.service';
import { UserService } from '../../user/user.service';
import { markAllAsTouched } from '../forms.utils';

export enum DecisionCreateCloseType {
  created = 'created',
  canceled = 'canceled'
}
@Component({
  selector: 'app-project-decision-create-modal',
  templateUrl: './project-decision-create-modal.component.html',
  providers: [WindowService]
})
export class ProjectDecisionCreateModalComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public startYear: number;
  public endYear: number;
  public justificative: string;
  public currentDate: NgbDateStruct;
  public years: number[];
  public validated = false;

  public project: IEnrichedProject;
  public decisionTypes$: Observable<ITaxonomy[]>;

  public get projectHasProgramBooks(): boolean {
    return !!this.projectService.getProjectProgramBooks(this.project).length;
  }

  public get projectAnnualPrograms(): IEnrichedAnnualProgram[] {
    return this.projectService.getProjectAnnualPrograms(this.project);
  }
  constructor(
    private readonly calendar: NgbCalendar,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly fb: FormBuilder,
    private readonly decisionsService: DecisionsService,
    private readonly notificationsService: NotificationsService,
    private readonly activeModal: NgbActiveModal,
    private readonly projectService: ProjectService,
    private readonly userService: UserService
  ) {
    super();
    this.currentDate = this.calendar.getToday();
    this.decisionTypes$ = this.createDecisionTypesObservable();
  }

  public ngOnInit(): void {
    this.createForm();
    this.form.controls.decisionType.valueChanges.subscribe(x => {
      this.validated = false;
      if (x === ProjectDecisionType.canceled) {
        this.form.controls.startYear.reset();
        this.form.controls.startYear.disable();
        this.form.controls.endYear.reset();
        this.form.controls.endYear.disable();
        this.validated = true;
      } else {
        this.form.controls.startYear.reset(this.project.startYear);
        this.form.controls.startYear.enable();
        this.form.controls.endYear.reset(this.project.endYear);
        this.form.controls.endYear.enable();
      }
    });

    this.startYear = this.currentDate.year;
    this.years = arrayOfNumbers(this.currentDate.year, this.currentDate.year + 10);
  }

  public async createDecision(): Promise<void> {
    const decision: IProjectDecision = this.getDecisionForm(this.form);
    await this.decisionsService.createProjectDecision(this.project.id, decision);
    this.notificationsService.show(
      decision.startYear ? 'Décision ajoutée' : 'Le projet est annulé',
      NotificationAlertType.success
    );
    this.activeModal.close(DecisionCreateCloseType.created);
  }

  public validateDecision(): void {
    this.validated = true;
  }

  public getDecisionForm(formDecision: FormGroup): IProjectDecision {
    return {
      typeId: formDecision.controls.decisionType.value,
      startYear: formDecision.controls.startYear.value,
      endYear: formDecision.controls.endYear.value,
      text: formDecision.controls.justification.value
    };
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    if (!this.validated) {
      this.validateDecision();
    } else {
      await this.createDecision();
    }
  }

  public cancel(): void {
    this.activeModal.close(DecisionCreateCloseType.canceled);
  }

  private createForm(): void {
    this.form = this.fb.group({
      endYear: [this.project.endYear, [Validators.pattern('^[0-9]{4}$'), Validators.required]],
      startYear: [this.project.startYear, [Validators.pattern('^[0-9]{4}$'), Validators.required]],
      justification: ['', Validators.required],
      decisionType: ['', Validators.required]
    });
  }

  private createDecisionTypesObservable(): Observable<ITaxonomy[]> {
    return this.taxonomiesService.group(TaxonomyGroup.projectDecisionType).pipe(
      take(1),
      switchMap(taxonomies => this.showRightDecisionTypes(taxonomies))
    );
  }

  private async showRightDecisionTypes(decisionTypes: ITaxonomy[]): Promise<ITaxonomy[]> {
    const rightDecisionTypes: ITaxonomy[] = [];
    const { planned, programmed, replanned, postponed, preliminaryOrdered, finalOrdered } = ProjectStatus;
    const permissionCanceled = await this.userService.hasPermission(Permission.PROJECT_DECISION_CANCELED_CREATE);
    const permissionReplanned = await this.userService.hasPermission(Permission.PROJECT_DECISION_REPLANNED_CREATE);
    const permissionPostponed = await this.userService.hasPermission(Permission.PROJECT_DECISION_POSTPONED_CREATE);

    if (this.project) {
      if (
        [planned, programmed, replanned, postponed, preliminaryOrdered, finalOrdered].includes(
          this.project.status as ProjectStatus
        ) &&
        permissionCanceled
      ) {
        rightDecisionTypes.push(decisionTypes[findKey(decisionTypes, { code: ProjectDecisionType.canceled })]);
      }

      if ([preliminaryOrdered, finalOrdered].includes(this.project.status as ProjectStatus) && permissionPostponed) {
        rightDecisionTypes.push(decisionTypes[findKey(decisionTypes, { code: ProjectDecisionType.postponed })]);
      }

      if (
        [planned, replanned, programmed, postponed].includes(this.project.status as ProjectStatus) &&
        permissionReplanned
      ) {
        rightDecisionTypes.push(decisionTypes[findKey(decisionTypes, { code: ProjectDecisionType.replanned })]);
      }
    }
    return rightDecisionTypes;
  }
}

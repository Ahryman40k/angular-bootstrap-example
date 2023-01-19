import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedProject,
  IServicePriority,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, uniq } from 'lodash';
import { Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../components/base/base.component';
import { ConfirmationModalCloseType } from '../../forms/confirmation-modal/confirmation-modal.component';
import { markAllAsTouched } from '../../forms/forms.utils';
import { NotificationsService } from '../../notifications/notifications.service';
import { ProjectService } from '../../services/project.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { DialogsService } from '../dialogs.service';

@Component({
  selector: 'app-add-project-priority-service-modal',
  templateUrl: './add-project-priority-service-modal.component.html'
})
export class AddProjectPriorityServiceModalComponent extends BaseComponent implements OnInit {
  public areServicesInvalid: boolean;
  public availableServices: ITaxonomy[];
  public form: FormGroup;
  public maxNumberOfServices: number;
  public priorities$: Observable<ITaxonomy[]>;
  public project: IEnrichedProject;
  public services: ITaxonomy[];
  public confirmationButtonLabel: string;
  public modalTitle: string;
  public servicePrioritiesLength: number;
  public duplicatedCode = 'duplicated';
  public isSubmitting = false;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly dialogsService: DialogsService,
    private readonly fb: FormBuilder,
    private readonly projectService: ProjectService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  public get servicePriorities(): FormArray {
    return this.form.controls.servicePriorities as FormArray;
  }

  public get canAddNewService(): boolean {
    return this.services?.length > 0 && this.servicePriorities.length < this.maxNumberOfServices;
  }

  public ngOnInit(): void {
    this.initModalInformations();
    this.initForm();
    this.initOnFormChanges();
  }

  public initialize(project: IEnrichedProject): void {
    this.project = project;
  }

  private initModalInformations(): void {
    this.servicePrioritiesLength = this.project.servicePriorities?.length;
    if (this.servicePrioritiesLength > 0) {
      this.modalTitle = 'Modifier une priorité service au projet';
      this.confirmationButtonLabel = 'Modifier';
    } else {
      this.modalTitle = 'Ajouter une priorité service au projet';
      this.confirmationButtonLabel = 'Ajouter';
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      servicePriorities: this.fb.array([])
    });

    if (this.servicePrioritiesLength > 0) {
      this.project.servicePriorities.forEach(servicePriority => {
        this.addServicePriorityToForm(servicePriority);
      });
    } else {
      this.addServicePriorityToForm();
    }
    this.getFormData();
  }

  private initOnFormChanges(): void {
    this.form.controls.servicePriorities.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((servicePriorities: IServicePriority[]) => {
        this.areServicesInvalid = this.areServicesDuplicated(servicePriorities);
        this.form.controls.servicePriorities.setErrors(
          this.areServicesInvalid ? { [this.duplicatedCode]: true } : null
        );
        this.form.updateValueAndValidity();
      });
  }

  private areServicesDuplicated(servicePriorities: IServicePriority[]): boolean {
    const services = servicePriorities.map(servicePriority => servicePriority.service).filter(service => !!service);
    return uniq(services).length !== services.length;
  }

  public addServicePriorityToForm(servicePriority?: IServicePriority): void {
    this.servicePriorities.push(
      this.fb.group({
        service: [servicePriority?.service || null, [Validators.required]],
        priorityId: [servicePriority?.priorityId || null, [Validators.required]]
      })
    );
  }

  public removeServicePriorityFromForm(index: number): void {
    this.servicePriorities.removeAt(index);
  }

  public async addServicePrioritiesToProject(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    await this.projectService.patchProject(this.project, { servicePriorities: this.servicePriorities.value });
    this.notificationsService.showSuccess(
      `La priorité service a été ${this.servicePrioritiesLength > 0 ? 'modifiée' : 'crée'} avec succès`
    );
    this.activeModal.close();
  }

  public async restartServicePriorities(): Promise<void> {
    const modal = this.dialogsService.showConfirmationModal(
      `Réinitialiser les priorités`,
      'Les priorités seront réinitialisées, voulez-vous continuer?'
    );
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      this.activeModal.close({ confirmation: ConfirmationModalCloseType.canceled, project: this.project });
    }
  }

  public cancel(): void {
    this.activeModal.close();
  }

  private getFormData(): void {
    const projectRequestors = this.project.interventions.map(intervention => intervention.requestorId);
    this.taxonomiesService
      .group(TaxonomyGroup.service)
      .pipe(take(1))
      .subscribe(services => {
        this.availableServices = services
          .filter(s => projectRequestors.some(requestor => s.properties.requestors.includes(requestor)))
          .map(service => {
            if (service.properties.acronym?.fr) {
              service.label.fr = service.properties.acronym.fr;
            }
            return service;
          });
        this.services = cloneDeep(this.availableServices);
        this.maxNumberOfServices = this.services.length;
      });

    this.priorities$ = this.taxonomiesService.group(TaxonomyGroup.priorityType).pipe(take(1));
  }
}

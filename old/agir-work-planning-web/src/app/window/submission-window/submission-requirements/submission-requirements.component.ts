import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ISubmission, ISubmissionRequirement, SubmissionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { RequirementMessages } from 'src/app/shared/services/requirement.service';
import { SubmissionRequirementsService } from 'src/app/shared/services/submission-requirements.service';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import {
  requirementSubmissionType,
  SubmissionRequirementsModalComponent
} from './submission-requirements-modal/submission-requirements-modal.component';

@Component({
  selector: 'app-submission-requirements',
  templateUrl: './submission-requirements.component.html',
  styleUrls: ['./submission-requirements.component.scss'],
  providers: [NgbActiveModal]
})
export class SubmissionRequirementsComponent extends BaseComponent implements OnInit {
  public eventsSubject: Subject<string> = new Subject<string>();

  public SubmissionStatus = SubmissionStatus;
  public form: FormGroup;
  public submissionRequirementsStatus = [
    {
      value: requirementSubmissionType.generic,
      label: 'Générique à la soumission',
      selected: true
    },
    {
      value: requirementSubmissionType.specific,
      label: 'Spécifique à un/des projet(s)',
      selected: true
    },
    {
      value: requirementSubmissionType.obsolete,
      label: 'Exclure les obsolètes',
      selected: false
    }
  ];

  constructor(
    private readonly windowSubmissionStoreService: WindowSubmissionStoreService,
    private readonly dialogsService: DialogsService,
    private readonly fb: FormBuilder,
    private readonly submissionRequirementsService: SubmissionRequirementsService,
    private readonly activeModal: NgbActiveModal,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.createForm();
    this.initFormByDefault();
  }
  private createForm(): FormGroup {
    this.form = this.fb.group({
      searchTerm: '',
      statusFilter: this.fb.array([])
    });
    return this.form;
  }

  public initFormByDefault(): void {
    const checkArray: FormArray = this.form.get('statusFilter') as FormArray;
    const selectedStatus = this.submissionRequirementsStatus.filter(e => e.selected);
    checkArray.controls = [];
    selectedStatus.forEach(el => {
      checkArray.push(new FormControl(el.value));
    });
  }

  public checkElement(status, event): void {
    const checkArray: FormArray = this.form.get('statusFilter') as FormArray;

    this.submissionRequirementsStatus.map(el => {
      if (el === status) {
        el.selected = event;
      }
    });
    const selectedStatus = this.submissionRequirementsStatus.filter(e => e.selected);
    checkArray.controls = [];
    if (selectedStatus.length) {
      selectedStatus.forEach(el => {
        checkArray.push(new FormControl(el.value));
      });
    } else {
      checkArray.push(new FormControl(null));
    }
  }

  public get isValidSubmissionProgressStatus(): boolean {
    return this.submissionRequirementsService.isValidSubmissionProgressStatus(this.submission);
  }
  public get submission(): ISubmission {
    return this.windowSubmissionStoreService.submission;
  }

  public async openModal(requirement: ISubmissionRequirement): Promise<void> {
    const modal = this.dialogsService.showModal(SubmissionRequirementsModalComponent);
    const openModalVerb = requirement ? 'Modifier' : 'Ajouter';
    modal.componentInstance.title = `${openModalVerb} une exigence`;
    modal.componentInstance.buttonLabel = openModalVerb;
    modal.componentInstance.submissionRequirement = requirement;
  }

  public openEditModal(requirement: ISubmissionRequirement): void {
    void this.openModal(requirement);
  }
  public async openRequirementObsoleteModal(requirement: ISubmissionRequirement): Promise<void> {
    let modal;
    const deprecateMessage =
      'Cette action rendra inactive cette exigence, mais elle sera toujours affichée dans la soumission. Êtes-vous certain de vouloir continuer?';
    const activeMessage = 'Cette action rendra active cette exigence. Êtes-vous certain de vouloir continuer?';

    if (!requirement.isDeprecated) {
      modal = this.dialogsService.showConfirmationModal('Rendre l’exigence obsolètee', deprecateMessage);
    } else {
      modal = this.dialogsService.showConfirmationModal('Réactiver l’exigence', activeMessage);
    }

    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      const submissionRequirementPatch = {
        isDeprecated: !requirement.isDeprecated
      };

      this.submissionRequirementsService
        .patchSubmissionRequirement(this.submission.submissionNumber, requirement.id, submissionRequirementPatch)
        .pipe(take(1))
        .subscribe(
          data => {
            this.notificationsService.show(RequirementMessages.updateSuccess, NotificationAlertType.success);
            this.windowSubmissionStoreService.refresh();
          },
          error => {
            this.notificationsService.show(RequirementMessages.updateError, NotificationAlertType.danger);
            this.windowSubmissionStoreService.refresh();
          }
        );
    }
  }
  public async openDeleteModal(requirement: ISubmissionRequirement): Promise<void> {
    const deleteMessage =
      'La suppression de cette exigence entrainera la perte des données.\nÊtes-vous certain de vouloir continuer?';
    const modal = this.dialogsService.showDeleteModal('Supprimer une exigence', deleteMessage);
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      this.submissionRequirementsService
        .deleteSubmissionRequirement(this.submission.submissionNumber, requirement.id)
        .pipe(take(1))
        .subscribe(
          () => {
            this.notificationsService.show(RequirementMessages.deleteSuccess, NotificationAlertType.success);
            this.windowSubmissionStoreService.refresh();
          },
          error => {
            this.notificationsService.show(RequirementMessages.deleteError, NotificationAlertType.danger);
            this.windowSubmissionStoreService.refresh();
          }
        );

      this.activeModal.close(true);
    }
  }

  public onSearchSubmissions() {
    this.form.controls.searchTerm.setValue(this.form.controls.searchTerm.value);
  }

  public get restrictionItems(): IRestrictionItem[] {
    return [{ entity: this.windowSubmissionStoreService.projects, entityType: 'PROJECT' }];
  }
}

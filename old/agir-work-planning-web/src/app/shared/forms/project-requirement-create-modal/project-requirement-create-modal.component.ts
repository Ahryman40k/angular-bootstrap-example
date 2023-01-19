import { Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedProject, IRequirement, IRequirementItem } from '@villemontreal/agir-work-planning-lib/dist/src';

import { NotificationAlertType } from '../../notifications/notification-alert';
import { NotificationsService } from '../../notifications/notifications.service';
import { RequirementMessages, RequirementService } from '../../services/requirement.service';
import { WindowService } from '../../services/window.service';
import { RequirementCreateComponent } from '../requirements-create/requirement-create.component';

export enum DecisionCreationCloseType {
  confirmed = 'confirmed',
  cancel = 'cancel'
}

@Component({
  selector: 'app-project-requirement-create-modal',
  templateUrl: './project-requirement-create-modal.component.html',
  styleUrls: ['./project-requirement-create-modal.component.scss'],
  providers: [WindowService]
})
export class ProjectRequirementCreateModalComponent {
  @ViewChild(RequirementCreateComponent) public requirementChild;
  @Input() public title: string;
  @Input() public buttonLabel: string;
  @Input() public requirement: IRequirement;

  public project: IEnrichedProject;
  public submitting: boolean = false;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly notificationsService: NotificationsService,
    private readonly requirementService: RequirementService
  ) {}

  public get canSubmit(): boolean {
    return this.submitting || this.requirementService.getRequirementCreationFormStatus();
  }
  public cancel(): void {
    this.activeModal.close(DecisionCreationCloseType.cancel);
  }

  public create(): void {
    this.submitting = true;
    const requirementUpsert = this.requirementChild.getDataRequirement();
    const objectBase: IRequirementItem = {
      id: this.project.id,
      type: 'project'
    };
    requirementUpsert.items.unshift(objectBase);

    if (this.requirement) {
      this.requirementService.updateRequirement(requirementUpsert, this.requirement.id).subscribe(
        () => {
          this.notificationsService.show(RequirementMessages.updateSuccess, NotificationAlertType.success);
        },
        error => {
          this.notificationsService.show(RequirementMessages.updateError, NotificationAlertType.danger);
        }
      );
    } else {
      this.requirementService.addRequirement(requirementUpsert).subscribe(
        () => {
          this.notificationsService.show(RequirementMessages.addSuccess, NotificationAlertType.success);
        },
        error => {
          this.notificationsService.show(RequirementMessages.addError, NotificationAlertType.danger);
        }
      );
    }
    this.activeModal.close(DecisionCreationCloseType.confirmed);
    this.submitting = false;
  }
}

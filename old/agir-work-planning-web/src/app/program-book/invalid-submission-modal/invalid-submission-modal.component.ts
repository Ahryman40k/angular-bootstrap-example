import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ISubmission,
  ISubmissionPatchRequest,
  SubmissionProgressStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { finalize, take } from 'rxjs/operators';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { SubmissionProjectErrorService } from 'src/app/shared/services/submission-project-error.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';

@Component({
  selector: 'app-invalid-submission-modal',
  templateUrl: './invalid-submission-modal.component.html',
  styleUrls: ['./invalid-submission-modal.component.scss']
})
export class InvalidSubmissionModalComponent {
  public commentCtrl = new FormControl(null, [Validators.required]);

  public submitting = false;
  private _submission: ISubmission;
  public deactivateSubmissionVerb = 'Invalider';
  public successMessage = 'Soumission invalidée avec succès';

  public set submission(submission: ISubmission) {
    this._submission = submission;
    if (
      [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN].includes(
        submission.progressStatus as SubmissionProgressStatus
      )
    ) {
      this.deactivateSubmissionVerb = 'Désactiver';
      this.successMessage = 'Soumission désactivée avec succès';
    }
  }

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly notificationsService: NotificationsService,
    private readonly submissionProjectService: SubmissionProjectService,
    private readonly submissionProjectErrorService: SubmissionProjectErrorService
  ) {}

  public submit(): void {
    const submissionPatch: ISubmissionPatchRequest = {
      comment: this.commentCtrl.value,
      status: SubmissionStatus.INVALID
    };
    this.submitting = true;
    this.submissionProjectService
      .patchSubmission(this._submission.submissionNumber, submissionPatch)
      .pipe(
        take(1),
        finalize(() => (this.submitting = false))
      )
      .subscribe(
        (submission: ISubmission) => {
          this.notificationsService.showSuccess(this.successMessage);
          this.activeModal.close(submission);
        },
        (err: HttpErrorResponse) => {
          this.submissionProjectErrorService.handlePatchSubmissionError(err);
        }
      );
  }

  public reject(): void {
    this.activeModal.close(null);
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbDateNativeAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import {
  ISubmission,
  ISubmissionPatchRequest,
  ITaxonomy,
  nextAuthorizedSubmissionProgressStatuses,
  SubmissionProgressStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { finalize, map, take } from 'rxjs/operators';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { SubmissionProjectErrorService } from 'src/app/shared/services/submission-project-error.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-submission-progress-history-modal',
  templateUrl: './submission-progress-history-modal.component.html',
  styleUrls: ['./submission-progress-history-modal.component.scss']
})
export class SubmissionProgressHistoryModalComponent implements OnInit {
  public modalTitle = 'Modifier l’état d’avancement de la soumission';
  public submitting = false;
  public submission: ISubmission;
  public progressStatuses: ITaxonomy[] = [];
  public progressHistoryFormGroup: FormGroup;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly notificationsService: NotificationsService,
    private readonly submissionProjectService: SubmissionProjectService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly submissionProjectErrorService: SubmissionProjectErrorService
  ) {
    this.initProgressHistoryFormGroup();
  }

  public ngOnInit(): void {
    this.initProgressStatus();
  }

  public initProgressHistoryFormGroup() {
    this.progressHistoryFormGroup = this.fb.group({
      progressStatus: ['', Validators.required],
      progressStatusChangeDate: ['', Validators.required]
    });
  }
  public initProgressStatus() {
    this.taxonomiesService
      .group(TaxonomyGroup.submissionProgressStatus)
      .pipe(
        map(taxonomies =>
          taxonomies.filter(el =>
            nextAuthorizedSubmissionProgressStatuses(
              this.submission.progressStatus as SubmissionProgressStatus
            ).includes(el.code as SubmissionProgressStatus)
          )
        )
      )
      .subscribe(progressStatuses => {
        this.progressStatuses = progressStatuses;
        this.progressHistoryFormGroup.controls.progressStatus.setValue(progressStatuses.find(s => s).code);
      });
  }

  public submit(): void {
    const submissionPatch: ISubmissionPatchRequest = {
      ...this.progressHistoryFormGroup.getRawValue(),
      progressStatusChangeDate: new NgbDateNativeAdapter().toModel(
        this.progressHistoryFormGroup.get('progressStatusChangeDate').value
      )
    };
    this.submitting = true;
    this.submissionProjectService
      .patchSubmission(this.submission.submissionNumber, submissionPatch)
      .pipe(
        take(1),
        finalize(() => (this.submitting = false))
      )
      .subscribe(
        (submission: ISubmission) => {
          this.notificationsService.showSuccess("L'état d’avancement a été modifié avec succès");
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

  public get minDate(): NgbDateStruct {
    const minDate = !isEmpty(this.submission.progressHistory)
      ? new Date(this.submission.progressHistory[this.submission.progressHistory.length - 1].createdAt)
      : new Date(this.submission.audit.createdAt);
    return { year: minDate.getFullYear(), month: minDate.getMonth() + 1, day: minDate.getDate() };
  }
}

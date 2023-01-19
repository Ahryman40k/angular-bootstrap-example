import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedProject,
  ISubmission,
  ISubmissionsSearchRequest,
  SubmissionProgressStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { finalize, map, take } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { SubmissionProjectErrorService } from 'src/app/shared/services/submission-project-error.service';
import { SubmissionProjectStoreService } from 'src/app/shared/services/submission-project-store.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';

@Component({
  selector: 'app-add-project-to-submission-modal',
  templateUrl: './add-project-to-submission-modal.component.html',
  styleUrls: ['./add-project-to-submission-modal.component.scss']
})
export class AddProjectToSubmissionModalComponent extends BaseComponent {
  public submissions$ = new Observable<ISubmission[]>();
  public modalTitle = 'Ajouter le projet à une soumission existante';
  public submissionCtrl = new FormControl(null, [Validators.required]);
  public submitting = false;
  public project: IEnrichedProject;
  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly notificationsService: NotificationsService,
    private readonly programBookService: ProgramBookService,
    private readonly submissionProjectService: SubmissionProjectService,
    private readonly submissionProjectStoreService: SubmissionProjectStoreService,
    private readonly submissionProjectErrorService: SubmissionProjectErrorService
  ) {
    super();
    this.initSubmissions();
  }

  private initSubmissions() {
    const searchRequest: ISubmissionsSearchRequest = {
      fields: ['status'],
      limit: 1000,
      status: [SubmissionStatus.VALID],
      progressStatus: [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN],
      programBookId: [this.programBookService.selectedProgramBookDetails.id]
    };
    this.submissions$ = this.submissionProjectService
      .submissionPostSearch(searchRequest)
      .pipe(map((res: IPaginatedResults<ISubmission>) => res.items));
  }

  public submit(): void {
    this.submitting = true;
    this.submissionProjectService
      .addProjectToSubmission(this.submissionCtrl.value, this.project.id)
      .pipe(
        take(1),
        finalize(() => (this.submitting = false))
      )
      .subscribe(
        (submission: ISubmission) => {
          this.submissionProjectStoreService.updateSubmission(submission);
          const partialProject: Partial<IEnrichedProject> = {
            submissionNumber: submission.submissionNumber
          };
          this.submissionProjectStoreService.patchProject(this.project.id, partialProject);
          this.notificationsService.showSuccess('Project ajouté à la soumission avec succès');
          this.submissionProjectStoreService.sortProjects();
          // remove checkbox if project is selected
          this.submissionProjectStoreService.deselectProject(this.project);
          this.activeModal.close(false);
        },
        (err: HttpErrorResponse) => {
          this.submissionProjectErrorService.handleAddProjectToSubmissionError(err);
        }
      );
  }

  public get linkProject(): string {
    return `window/projects/${this.project.id}/overview`;
  }

  public reject(): void {
    this.activeModal.close(false);
  }
}

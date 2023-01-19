import { Component } from '@angular/core';
import {
  ISubmission,
  ISubmissionsSearchRequest,
  ITaxonomyList,
  SubmissionProgressStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { SUBMISSION_SEARCH_FIELDS_PARAMS } from 'src/app/shared/models/submissions/search-fields-params';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { invalidProgressStatus, SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { InvalidSubmissionModalComponent } from '../invalid-submission-modal/invalid-submission-modal.component';
import { SubmissionProgressHistoryModalComponent } from '../submission-progress-history-modal/submission-progress-history-modal.component';
import { ValidSubmissionModalComponent } from '../valid-submission-modal/valid-submission-modal.component';
const PAGE_SIZE = 16;
const CURRENT_PAGE = 1;
@Component({
  selector: 'app-program-book-submission-list',
  templateUrl: './program-book-submission-list.component.html',
  styleUrls: ['./program-book-submission-list.component.scss']
})
export class ProgramBookSubmissionListComponent extends BaseComponent {
  public SubmissionStatus = SubmissionStatus;
  public emptyListMessage = 'Ce carnet n’a aucune soumission pour l’instant.';
  public title = 'Soumissions du carnet';
  public isLoading = false;
  public pagination: IPagination = {
    limit: PAGE_SIZE,
    currentPage: CURRENT_PAGE,
    pageSize: 16,
    totalCount: 0
  };
  private submissionsSubject = new BehaviorSubject<ISubmission[]>([]);
  public submissions$ = this.submissionsSubject.asObservable();

  constructor(
    private readonly submissionProjectService: SubmissionProjectService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly dialogsService: DialogsService,
    private readonly programBookService: ProgramBookService
  ) {
    super();
    this.programBookService.selectedProgramBookDetails$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getProgramBookSubmissions();
    });
  }

  public onPageChanged() {
    this.getProgramBookSubmissions();
  }
  public getProgramBookSubmissions() {
    const searchRequest: ISubmissionsSearchRequest = {
      offset: (this.pagination.currentPage - 1) * this.pagination.pageSize,
      limit: this.pagination.pageSize,
      programBookId: [this.programBookService.selectedProgramBookDetails.id],
      fields: [
        SUBMISSION_SEARCH_FIELDS_PARAMS.SUBMISSION_NUMBER,
        SUBMISSION_SEARCH_FIELDS_PARAMS.STATUS,
        SUBMISSION_SEARCH_FIELDS_PARAMS.PROGRAM_BOOK_ID,
        SUBMISSION_SEARCH_FIELDS_PARAMS.PROGRESS_STATUS,
        SUBMISSION_SEARCH_FIELDS_PARAMS.PROJECT_IDS,
        SUBMISSION_SEARCH_FIELDS_PARAMS.AUDIT
      ]
    };
    this.isLoading = true;
    this.submissionProjectService
      .submissionPostSearch(searchRequest)
      .subscribe((paginatedResults: IPaginatedResults<ISubmission>) => {
        this.isLoading = false;
        this.pagination.totalCount = paginatedResults.paging.totalCount;
        this.submissionsSubject.next(paginatedResults.items);
      });
  }

  public menuItems(submission: ISubmission): IMoreOptionsMenuItem[] {
    if (submission.status === SubmissionStatus.INVALID) {
      const optionsMenuInvalidSubmission: IMoreOptionsMenuItem[] = [];
      if (!invalidProgressStatus.includes(submission.progressStatus)) {
        optionsMenuInvalidSubmission.push({
          label: [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN].includes(
            submission.progressStatus as SubmissionProgressStatus
          )
            ? 'Réactiver la soumission'
            : 'Revalider la soumission',
          permission: this.Permission.SUBMISSION_PROGRESS_STATUS_WRITE,
          action: async () => {
            await this.setSubmissionToValid(submission);
          },
          restrictionItems: this.restrictionItems
        });
      }
      return optionsMenuInvalidSubmission;
    }
    const optionsMenu: IMoreOptionsMenuItem[] = [
      {
        label: [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN].includes(
          submission.progressStatus as SubmissionProgressStatus
        )
          ? 'Désactiver la soumission'
          : 'Invalider la soumission',
        permission: this.Permission.SUBMISSION_STATUS_WRITE,
        action: async () => {
          await this.setSubmissionToInvalid(submission);
        },
        restrictionItems: this.restrictionItems
      }
    ];
    if (submission.progressStatus !== SubmissionProgressStatus.CLOSING) {
      optionsMenu.push({
        label: 'Modifier l’état d’avancement',
        permission: this.Permission.SUBMISSION_PROGRESS_STATUS_WRITE,
        action: async () => {
          await this.changeProgressStatus(submission);
        },
        restrictionItems: this.restrictionItems
      });
    }
    return optionsMenu;
  }
  public submissionLink(submission: ISubmission) {
    return `window/submissions/${submission.submissionNumber}/projects`;
  }

  public get submissionProgressStatusTaxonomies$(): Observable<ITaxonomyList> {
    return this.taxonomiesService.group(this.TaxonomyGroup.submissionProgressStatus);
  }

  public async setSubmissionToInvalid(submission: ISubmission) {
    const modal = this.dialogsService.showModal(InvalidSubmissionModalComponent);
    modal.componentInstance.submission = submission;
    const res = (await modal.result) as ISubmission;
    if (res) {
      const newSubmissions = this.submissionsSubject.getValue().map((el: ISubmission) => {
        return el.submissionNumber === res.submissionNumber ? res : el;
      });
      this.submissionsSubject.next(newSubmissions);
    }
  }

  public async setSubmissionToValid(submission: ISubmission) {
    const modal = this.dialogsService.showModal(ValidSubmissionModalComponent);
    modal.componentInstance.submission = submission;
    const res = (await modal.result) as ISubmission;
    if (res) {
      const newSubmissions = this.submissionsSubject.getValue().map((el: ISubmission) => {
        return el.submissionNumber === res.submissionNumber ? res : el;
      });
      this.submissionsSubject.next(newSubmissions);
    }
  }

  public async changeProgressStatus(submission: ISubmission) {
    const modal = this.dialogsService.showModal(SubmissionProgressHistoryModalComponent);
    modal.componentInstance.submission = submission;
    const res = (await modal.result) as ISubmission;
    if (res) {
      const newSubmissions = this.submissionsSubject.getValue().map((el: ISubmission) => {
        return el.submissionNumber === res.submissionNumber ? res : el;
      });
      this.submissionsSubject.next(newSubmissions);
    }
  }
  public get restrictionItems(): IRestrictionItem[] {
    return [
      { entity: this.programBookService.selectedProgramBookDetails, entityType: 'PROGRAM_BOOK' },
      { entity: this.programBookService.selectedProgramBookDetails.annualProgram, entityType: 'ANNUAL_PROGRAM' }
    ];
  }
}

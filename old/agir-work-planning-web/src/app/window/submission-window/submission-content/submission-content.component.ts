import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import {
  IEnrichedProgramBook,
  ISubmission,
  Permission,
  ProgramBookExpand,
  SubmissionProgressStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { InvalidSubmissionModalComponent } from 'src/app/program-book/invalid-submission-modal/invalid-submission-modal.component';
import { SubmissionProgressHistoryModalComponent } from 'src/app/program-book/submission-progress-history-modal/submission-progress-history-modal.component';
import { ValidSubmissionModalComponent } from 'src/app/program-book/valid-submission-modal/valid-submission-modal.component';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IMenuItem } from 'src/app/shared/forms/menu-active/menu-active.component';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { BrowserWindowService } from 'src/app/shared/services/browser-window.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { invalidProgressStatus } from 'src/app/shared/services/submission-project.service';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';

@Component({
  selector: 'app-submission-content',
  templateUrl: './submission-content.component.html',
  styleUrls: ['./submission-content.component.scss']
})
export class SubmissionContentComponent extends BaseComponent implements OnInit {
  @ViewChildren(RouterLinkActive) public routerLinkActiveDirectives: QueryList<RouterLinkActive>;
  public SubmissionStatus = SubmissionStatus;
  constructor(
    private readonly browserWindowService: BrowserWindowService,
    private readonly windowSubmissionStoreService: WindowSubmissionStoreService,
    private readonly dialogsService: DialogsService,
    private readonly router: Router,
    private route: ActivatedRoute,
    private readonly programBookService: ProgramBookService
  ) {
    super();
  }

  public get submissionNumberHref(): string {
    return `map?submission-number=${this.submission.submissionNumber}`;
  }

  public get hrefProgramBook(): string {
    return `program-books/${this.programBook?.id}/summary`;
  }

  public get programBook(): IEnrichedProgramBook {
    return this.windowSubmissionStoreService.programBook;
  }

  public get isSubmissionValid(): boolean {
    return this.submission.status === SubmissionStatus.VALID;
  }

  public get budget(): number {
    const sumReducer = (previousValue: number, currentValue: number) => previousValue + currentValue;
    return this.windowSubmissionStoreService.projects
      .map(pr => {
        return pr.annualDistribution.annualPeriods
          .filter(el => el.programBookId === this.programBook?.id)
          .map(el => el.annualBudget)
          .reduce(sumReducer, 0);
      })
      .reduce(sumReducer, 0);
  }
  public ngOnInit() {
    this.windowSubmissionStoreService.setSubmission(
      (this.route.snapshot.data as { submission: ISubmission }).submission
    );
    this.getProgramBook();
    this.windowSubmissionStoreService.getProjects();
  }

  public getProgramBook(): void {
    this.programBookService
      .getProgramBookById(this.windowSubmissionStoreService.submission.programBookId, [ProgramBookExpand.annualProgram])
      .then(programBook => {
        this.windowSubmissionStoreService.setProgramBook(programBook);
      })
      .catch(err => {
        this.windowSubmissionStoreService.setProgramBook(null);
      });
  }

  public get submission(): ISubmission {
    return this.windowSubmissionStoreService.submission;
  }

  public close(): void {
    if (!this.browserWindowService.close()) {
      void this.router.navigate(['/']);
    }
  }

  public get menuItems(): IMenuItem[] {
    return [
      { key: 'projects', label: 'Projets de la soumission', link: ['projects'] },
      { key: 'requirements', label: 'Exigences de conception', link: ['submission-requirements'] },
      {
        key: 'documents',
        label: 'Documents',
        link: ['documents'],
        permission: Permission.SUBMISSION_DOCUMENT_READ
      },
      { key: 'history', label: 'Historique', link: ['history'] }
    ];
  }

  public isActivePage(page: IMenuItem): boolean {
    return this.router.url.indexOf(page.link.join('/')) > -1;
  }

  public get moreOptionsMenuItems(): IMoreOptionsMenuItem[] {
    if (this.submission.status === SubmissionStatus.INVALID) {
      const optionsMenuInvalidSubmission: IMoreOptionsMenuItem[] = [];
      if (!invalidProgressStatus.includes(this.submission.progressStatus)) {
        optionsMenuInvalidSubmission.push({
          label: [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN].includes(
            this.submission.progressStatus as SubmissionProgressStatus
          )
            ? 'Réactiver la soumission'
            : 'Revalider la soumission',
          permission: this.Permission.SUBMISSION_PROGRESS_STATUS_WRITE,
          action: async () => {
            await this.setSubmissionToValid(this.submission);
          },
          restrictionItems: this.restrictionItems
        });
      }
      return optionsMenuInvalidSubmission;
    }
    const optionsMenu: IMoreOptionsMenuItem[] = [
      {
        label: [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN].includes(
          this.submission.progressStatus as SubmissionProgressStatus
        )
          ? 'Désactiver la soumission'
          : 'Invalider la soumission',
        permission: this.Permission.SUBMISSION_STATUS_WRITE,
        action: async () => {
          await this.setSubmissionToInvalid();
        },
        restrictionItems: this.restrictionItems
      }
    ];
    if (this.submission.progressStatus !== SubmissionProgressStatus.CLOSING) {
      optionsMenu.push({
        label: 'Modifier l’état d’avancement',
        permission: this.Permission.SUBMISSION_PROGRESS_STATUS_WRITE,
        action: async () => {
          await this.changeProgressStatus();
        },
        restrictionItems: this.restrictionItems
      });
    }
    return optionsMenu;
  }

  public async setSubmissionToInvalid() {
    const modal = this.dialogsService.showModal(InvalidSubmissionModalComponent);
    modal.componentInstance.submission = this.submission;
    const res = (await modal.result) as ISubmission;
    if (res) {
      this.windowSubmissionStoreService.setSubmission(res);
    }
  }

  public async setSubmissionToValid(submission: ISubmission) {
    const modal = this.dialogsService.showModal(ValidSubmissionModalComponent);
    modal.componentInstance.submission = this.submission;
    const res = (await modal.result) as ISubmission;
    if (res) {
      this.windowSubmissionStoreService.setSubmission(res);
    }
  }

  public async changeProgressStatus() {
    const modal = this.dialogsService.showModal(SubmissionProgressHistoryModalComponent);
    modal.componentInstance.submission = this.submission;
    const res = (await modal.result) as ISubmission;
    if (res) {
      this.windowSubmissionStoreService.setSubmission(res);
    }
  }

  public get restrictionItems(): IRestrictionItem[] {
    return [{ entity: this.windowSubmissionStoreService.projects, entityType: 'PROJECT' }];
  }
}

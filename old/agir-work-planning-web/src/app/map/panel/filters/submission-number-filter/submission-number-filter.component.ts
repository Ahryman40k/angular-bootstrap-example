import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  AnnualProgramExpand,
  IEnrichedAnnualProgram,
  ISubmission,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { debounceTime, filter, finalize, switchMap, take } from 'rxjs/operators';

import { flatten, isNil } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { ANNUAL_PROGRAM_FIELDS } from 'src/app/shared/models/findOptions/annualProgramFindOptions';
import { SUBMISSION_FIELDS } from 'src/app/shared/models/findOptions/submissionFindOptions';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { AnnualProgramService } from '../../../../shared/services/annual-program.service';
import { ProjectService } from '../../../../shared/services/project.service';
import { SubmissionProjectService } from '../../../../shared/services/submission-project.service';

@Component({
  selector: 'app-submission-number-filter',
  templateUrl: './submission-number-filter.component.html',
  styleUrls: ['./submission-number-filter.component.scss']
})
export class SubmissionNumberFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public isLoading = false;
  private submissionNumbersSubject = new BehaviorSubject<ISubmission[]>([]);
  public submissionNumbers$ = this.submissionNumbersSubject.asObservable();

  constructor(
    private readonly fb: FormBuilder,
    private readonly globalFilterService: GlobalFilterService,
    private readonly submissionProjectService: SubmissionProjectService,
    private readonly projectService: ProjectService,
    private readonly annualProgramService: AnnualProgramService
  ) {
    super();
  }
  public filterFn = (el: ISubmission, value: string): boolean => el.submissionNumber.includes(value);

  public ngOnInit(): void {
    super.ngOnInit();
    this.initSubmissionNumbers();
    this.form = this.fb.group({
      submissionNumber: [this.globalFilterService.filter.submissionNumber],
      search: ['']
    });
    this.form.controls.submissionNumber.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(submissionNumber => this.globalFilterService.patch({ submissionNumber }));
  }

  private initSubmissionNumbers(): void {
    this.isLoading = true;
    this.projectService.filter$
      .pipe(
        filter(el => !isNil(el.fromEndYear) && !isNil(el.toStartYear)),
        switchMap(() => {
          return this.annualProgramService.getAnnualProgramsFilterByOptions({
            fields: [ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_ID],
            expand: AnnualProgramExpand.programBooks,
            fromYear: this.projectService.filter.fromEndYear,
            toYear: this.projectService.filter.toStartYear
          });
        }),
        switchMap((res: IPaginatedResults<IEnrichedAnnualProgram>) => {
          const programbookIds = flatten(res.items.map(item => item.programBooks.map(pb => pb.id)));
          return this.submissionProjectService.submissionPostSearch({
            programBookId: programbookIds,
            status: [SubmissionStatus.VALID],
            fields: [SUBMISSION_FIELDS.SUBMISSION_NUMBER, SUBMISSION_FIELDS.PROJECT_IDS]
          });
        }),
        take(1),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(submissions => {
        this.submissionNumbersSubject.next(submissions.items);
      });
  }
}

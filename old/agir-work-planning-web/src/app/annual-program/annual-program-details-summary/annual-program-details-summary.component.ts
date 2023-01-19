import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { countBy, filter, isEqual, sumBy } from 'lodash';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';
import { PROJECT_FIELDS } from 'src/app/shared/models/findOptions/projectFields';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { UserService } from 'src/app/shared/user/user.service';
import { BaseAnnualProgramProgram } from '../base-annual-program';

@Component({
  selector: 'app-annual-program-details-summary',
  templateUrl: './annual-program-details-summary.component.html',
  styleUrls: ['./annual-program-details-summary.component.scss']
})
export class AnnualProgramDetailsSummaryComponent extends BaseAnnualProgramProgram implements OnInit {
  public projects: IEnrichedProject[];
  public submissionsCount: number;
  public hasPermission: boolean = false;
  public isLoading: boolean = true;
  public searchEventSubscription: any;

  get integratedProjectCount(): number {
    const integratedProjectCountResult = countBy(
      this.projects,
      el => el.projectTypeId === 'integrated' || el.projectTypeId === 'integratedgp'
    ).true;
    return integratedProjectCountResult ? integratedProjectCountResult : 0;
  }

  get nonIntegratedProjectCount(): number {
    const nonIntegratedProjectCountResult = countBy(this.projects, el => el.projectTypeId === 'nonIntegrated').true;
    return nonIntegratedProjectCountResult ? nonIntegratedProjectCountResult : 0;
  }

  get othersProjectCount(): number {
    const othersProjectCountResult = countBy(this.projects, el => el.projectTypeId === 'other').true;
    return othersProjectCountResult ? othersProjectCountResult : 0;
  }

  get projectsParachevementCount(): number {
    const projectParachementResult = countBy(this.projects, el => el.startYear < this.currentAnnualProgram?.year).true;
    return projectParachementResult ? projectParachementResult : 0;
  }

  get totalBudget(): number {
    if (this.hasPermission) {
      return sumBy(this.projects, ({ annualDistribution }) =>
        sumBy(
          filter(annualDistribution?.annualPeriods, period => period.year === this.currentAnnualProgram?.year),
          'annualBudget'
        )
      );
    }
  }

  constructor(
    public readonly projectService: ProjectService,
    public readonly annualProgramService: AnnualProgramService,
    public readonly submissionService: SubmissionProjectService,
    public readonly userService: UserService,
    public readonly activatedRoute: ActivatedRoute
  ) {
    super(annualProgramService, userService, projectService, submissionService);
    this.programBooksIds = [];
  }

  public ngOnInit() {
    combineLatest(
      this.activatedRoute.parent.params,
      this.annualProgramService.selectedAnnualProgram$.pipe(startWith(null))
    )
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, current) => prev === current)
      )
      .subscribe(async ([param, annualProgram]) => {
        if (!isEqual(annualProgram, this.currentAnnualProgram)) {
          await this.initAnnualProgram(param.id);
          if (this.currentAnnualProgram) {
            this.programBooksIds = this.currentAnnualProgram.programBooks.map(programBook => programBook.id);
            if (this.programBooksIds.length > 0) {
              const defaultFields = [PROJECT_FIELDS.PROJECT_TYPE_ID, PROJECT_FIELDS.START_YEAR];
              const fieldsInPermission = [
                PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_YEAR,
                PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_ANNUALBUDGET
              ];
              this.projects = await this.getProjects(this.programBooksIds, defaultFields, fieldsInPermission);
              this.getSubmissionsCountBy(this.programBooksIds, 'status', 'valid').subscribe(count => {
                const countResult = sumBy(count, 'count');
                this.submissionsCount = countResult ? countResult : 0;
              });
            } else {
              this.projects = [];
              this.submissionsCount = 0;
            }
          }
        }
        this.isLoading = false;
      });
  }
}

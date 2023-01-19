import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ICountBy,
  IInterventionCountBySearchRequest,
  InterventionStatus,
  ITaxonomy,
  Permission,
  ProjectStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { sumBy } from 'lodash';
import { Observable } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { AnnualProgramMenuService, FromPage } from 'src/app/shared/services/annual-program-menu.service';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserService } from 'src/app/shared/user/user.service';
import { INTERVENTION_FIELDS } from '../../shared/models/findOptions/interventionFields';
import { PROJECT_FIELDS } from '../../shared/models/findOptions/projectFields';
import { BaseAnnualProgramProgram } from '../base-annual-program';
interface INavItem {
  url: string;
  label: string;
  hasCount?: boolean;
  count?: number;
  name: TabsNames;
  permission?: Permission;
}
enum TabsNames {
  summary = 'summary',
  programbooks = 'program-books',
  submittedInterventions = 'submitted-interventions',
  projectsToSchedule = 'projects-to-schedule'
}
@Component({
  selector: 'app-annual-program-executor-details',
  templateUrl: './annual-program-executor-details.component.html',
  styleUrls: ['./annual-program-executor-details.component.scss']
})
export class AnnualProgramExecutorDetailsComponent extends BaseAnnualProgramProgram implements OnInit {
  public get currentExecutor(): Observable<ITaxonomy> {
    return this.taxonomiesService.code(TaxonomyGroup.executor, this.currentAnnualProgram?.executorId);
  }
  public menuItems$: Observable<IMoreOptionsMenuItem[]>;
  public TabsNames = TabsNames;

  public navItems: INavItem[] = [
    {
      label: 'Sommaire',
      url: 'summary',
      name: TabsNames.summary
    },
    {
      name: TabsNames.programbooks,
      label: 'Carnets',
      url: 'program-books'
    },
    {
      name: TabsNames.submittedInterventions,
      label: 'Interventions soumises',
      url: 'submitted-interventions',
      permission: this.Permission.PROGRAM_BOOK_PROGRAM,
      hasCount: true
    },
    {
      name: TabsNames.projectsToSchedule,
      label: 'Projets à programmer',
      permission: this.Permission.PROGRAM_BOOK_PROGRAM,
      url: 'projects-to-schedule',
      hasCount: true
    }
  ];
  public interventionCount: number;
  public projectToScheduleCount: number;
  constructor(
    public readonly taxonomiesService: TaxonomiesService,
    public readonly activatedRoute: ActivatedRoute,
    public readonly annualProgramService: AnnualProgramService,
    private readonly annualProgramMenuService: AnnualProgramMenuService,
    private readonly mapService: MapService,
    public readonly userService: UserService,
    public readonly projectService: ProjectService,
    public readonly submissionService: SubmissionProjectService,
    public readonly interventionService: InterventionService
  ) {
    super(annualProgramService, userService, projectService, submissionService);
  }
  public getInterventionsCount(): Promise<ICountBy[]> {
    const countByRequest: IInterventionCountBySearchRequest = {
      countBy: INTERVENTION_FIELDS.EXECUTOR_ID,
      executorId: this.currentAnnualProgram?.executorId,
      planificationYear: this.currentAnnualProgram?.year,
      status: [InterventionStatus.waiting, InterventionStatus.integrated, InterventionStatus.accepted],
      project: 'null'
    };
    return this.interventionService.getCountBy(countByRequest);
  }

  public getProjectsToScheduleCount(): Observable<ICountBy[]> {
    const searchObjects = {
      executorId: this.currentAnnualProgram?.executorId,
      toStartYear: this.currentAnnualProgram?.year,
      fromEndYear: this.currentAnnualProgram?.year,
      status: [
        ProjectStatus.planned,
        ProjectStatus.preliminaryOrdered,
        ProjectStatus.programmed,
        ProjectStatus.postponed,
        ProjectStatus.replanned,
        ProjectStatus.finalOrdered
      ],
      countBy: PROJECT_FIELDS.EXECUTOR_ID,
      excludeProgramBookIds: this.programBooksIds
    };
    return this.projectService.getCountBy(searchObjects);
  }

  public ngOnInit() {
    this.annualProgramService.selectedAnnualProgram$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, current) => prev === current)
      )
      .subscribe(async annualProgram => {
        this.currentAnnualProgram = annualProgram;
        this.programBooksIds = this.currentAnnualProgram?.programBooks?.map(programBook => programBook.id);

        if (await this.userService.hasPermission(this.Permission.PROGRAM_BOOK_PROGRAM)) {
          await this.initInterventionCount();
          this.initprojectToScheduleCount();
        }

        if (!annualProgram) {
          this.activatedRoute.params.subscribe(async param => {
            await this.initAnnualProgram(param.id);
          });
        }
      });
  }

  public async initInterventionCount(): Promise<void> {
    if (this.currentAnnualProgram) {
      const interventionCount = await this.getInterventionsCount();
      this.interventionCount = sumBy(interventionCount, 'count');
    }
  }
  public initprojectToScheduleCount(): void {
    if (this.currentAnnualProgram) {
      this.getProjectsToScheduleCount()
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.projectToScheduleCount = sumBy(data, 'count');
        });
    }
  }
  public menuItems(ap): Observable<IMoreOptionsMenuItem[]> {
    if (ap) {
      return this.annualProgramMenuService.getMenuItems(ap, this.destroy$, FromPage.ANNUAL_PROGRAM_DETAILS);
    }
  }
  public viewMap(): void {
    this.mapService.viewMap({
      queryParams: { 'annual-program-id': this.currentAnnualProgram.id }
    });
  }
}

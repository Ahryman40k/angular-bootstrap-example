import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AnnualProgramExpand,
  IEnrichedPaginatedProjects,
  IEnrichedProject,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { TDirection } from 'src/app/program-book/shared/models/submission-drm-columns';
import { IAppSort, SortingStatus } from 'src/app/shared/directives/sort.directive';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { ANNUAL_PROGRAM_FIELDS } from 'src/app/shared/models/findOptions/annualProgramFindOptions';
import { PROJECT_FIELDS } from 'src/app/shared/models/findOptions/projectFields';
import { ProjectsColumns, ProjectsToScheduleColumnLabels } from 'src/app/shared/models/table/column-config-enums';
import { IColumn, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { AnnualProgramMenuService } from 'src/app/shared/services/annual-program-menu.service';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserService } from 'src/app/shared/user/user.service';
import { BaseAnnualProgramProgram } from '../base-annual-program';

@Component({
  selector: 'app-annual-program-details-projects-to-schedule',
  templateUrl: './annual-program-details-projects-to-schedule.component.html',
  styleUrls: ['./annual-program-details-projects-to-schedule.component.scss']
})
export class AnnualProgramDetailsProjectsToScheduleComponent extends BaseAnnualProgramProgram implements OnInit {
  public ProjectsToScheduleColumnLabels = ProjectsToScheduleColumnLabels;
  public projects: IEnrichedProject[];
  public isInitializingTable: boolean = false;
  public emptyListMessage = 'Il n’y a plus de projet à traiter.';
  public pagination: IPagination = {
    currentPage: 1,
    limit: 10,
    offset: 0,
    pageSize: 10,
    totalCount: 0
  };
  public columnOptions: IColumnOptions;
  public sortedDirection = SortDirection.asc as TDirection;
  public sortedOrderBy: string;

  public columns: IColumn[] = [
    {
      columnName: ProjectsColumns.ID,
      className: `col-${ProjectsColumns.ID}`,
      displayOrder: 1,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.PROJECT_NAME,
      className: `col-${ProjectsColumns.PROJECT_NAME}`,
      displayOrder: 2,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.PROJECT_TYPE_ID,
      className: `col-${ProjectsColumns.PROJECT_TYPE_ID}`,
      displayOrder: 3,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.CATEGORY,
      className: `col-${ProjectsColumns.CATEGORY}`,
      displayOrder: 4,
      sorting: SortingStatus.inactive
    },

    {
      columnName: ProjectsColumns.STATUS,
      className: `col-${ProjectsColumns.STATUS}`,
      displayOrder: 5,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.STREET_NAME,
      className: `col-${ProjectsColumns.STREET_NAME}`,
      displayOrder: 6,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.STREET_FROM,
      className: `col-${ProjectsColumns.STREET_FROM}`,
      displayOrder: 7,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.STREET_TO,
      className: `col-${ProjectsColumns.STREET_TO}`,
      displayOrder: 8,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.BOROUGH_ID,
      className: `col-${ProjectsColumns.BOROUGH_ID}`,
      displayOrder: 9,
      sorting: SortingStatus.inactive
    }
  ];

  constructor(
    public readonly taxonomiesService: TaxonomiesService,
    public readonly activatedRoute: ActivatedRoute,
    public readonly annualProgramService: AnnualProgramService,
    private readonly annualProgramMenuService: AnnualProgramMenuService,
    private readonly mapService: MapService,
    public readonly userService: UserService,
    public readonly projectService: ProjectService,
    public readonly submissionService: SubmissionProjectService,
    private readonly programBookService: ProgramBookService
  ) {
    super(annualProgramService, userService, projectService, submissionService);
  }
  public ngOnInit() {
    combineLatest(this.activatedRoute.parent.params, this.programBookService.programBookChanged$.pipe(startWith(null)))
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([param]) => {
        this.currentAnnualProgram = await this.annualProgramService.getOne(
          param.id,
          [
            ANNUAL_PROGRAM_FIELDS.YEAR,
            ANNUAL_PROGRAM_FIELDS.EXECUTOR_ID,
            ANNUAL_PROGRAM_FIELDS.STATUS,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_ID,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_NAME,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_PROJECT_TYPES,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_STATUS,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_BOROUGH_IDS,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_PROGRAM_TYPES
          ],
          [AnnualProgramExpand.programBooks]
        );
        this.programBooksIds = this.currentAnnualProgram?.programBooks?.map(programBook => programBook.id);
        this.annualProgramService.updateSelectedAnnualProgram(this.currentAnnualProgram);
        await this.getProjectsToSchedule();
      });
  }
  public async getProjectsToSchedule(): Promise<void> {
    this.isInitializingTable = true;
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
      fields: [
        PROJECT_FIELDS.PROJECT_NAME,
        PROJECT_FIELDS.PROJECT_TYPE_ID,
        PROJECT_FIELDS.START_YEAR,
        PROJECT_FIELDS.END_YEAR,
        PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_PROGRAMBOOKID,
        PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_YEAR,
        PROJECT_FIELDS.STATUS,
        PROJECT_FIELDS.STREET_NAME,
        PROJECT_FIELDS.STREET_FROM,
        PROJECT_FIELDS.STREET_TO,
        PROJECT_FIELDS.BOROUGH_ID,
        PROJECT_FIELDS.INTERVENTIONS,
        PROJECT_FIELDS.EXECUTOR_ID
      ],
      expand: 'interventions',
      excludeProgramBookIds: this.programBooksIds,
      orderBy: this.sortedOrderBy,
      limit: this.pagination.limit,
      offset: (this.pagination.currentPage - 1) * this.pagination.pageSize
    };
    const paginatedProjects: IEnrichedPaginatedProjects = await this.projectService.getPaginatedProjects(searchObjects);
    this.projects = paginatedProjects.items;
    this.pagination.totalCount = paginatedProjects.paging.totalCount;
    this.isInitializingTable = false;
  }
  public async onPageChanged(): Promise<void> {
    await this.getProjectsToSchedule();
  }

  public async handleSortChange(event: IAppSort, sortedColum: IColumn): Promise<void> {
    const sortedColumn = sortedColum.columnName;
    this.sortedDirection = event.direction as TDirection;
    this.columns.map(el => {
      el.sorting = el.columnName === sortedColum.columnName ? SortingStatus.active : SortingStatus.inactive;
      return el;
    });
    this.sortedOrderBy = this.sortedDirection === SortDirection.asc ? sortedColumn : '-' + sortedColumn;
    await this.getProjectsToSchedule();
  }
}

export interface IInterventionOrderProps {
  id: string;
  value: string;
}

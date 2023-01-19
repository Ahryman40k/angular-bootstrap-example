import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AnnualProgramExpand,
  IEnrichedIntervention,
  InterventionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { TDirection } from 'src/app/program-book/shared/models/submission-drm-columns';
import { IAppSort, SortingStatus } from 'src/app/shared/directives/sort.directive';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { ANNUAL_PROGRAM_FIELDS } from 'src/app/shared/models/findOptions/annualProgramFindOptions';
import { INTERVENTION_FIELDS } from 'src/app/shared/models/findOptions/interventionFields';
import {
  InterventionColumns,
  SubmittedInterventionColumnLabels
} from 'src/app/shared/models/table/column-config-enums';
import { IColumn, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { AnnualProgramMenuService } from 'src/app/shared/services/annual-program-menu.service';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserService } from 'src/app/shared/user/user.service';
import { BaseAnnualProgramProgram } from '../base-annual-program';

@Component({
  selector: 'app-annual-program-details-submitted-interventions',
  templateUrl: './annual-program-details-submitted-interventions.component.html',
  styleUrls: ['./annual-program-details-submitted-interventions.component.scss']
})
export class AnnualProgramDetailsSubmittedInterventionsComponent extends BaseAnnualProgramProgram implements OnInit {
  public SubmittedInterventionColumnLabels = SubmittedInterventionColumnLabels;
  public interventions: IEnrichedIntervention[];
  public isInitializingTable: boolean = false;
  public emptyListMessage = 'Il n’y a plus d’intervention à traiter.';
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
      columnName: InterventionColumns.ID,
      className: `col-${InterventionColumns.ID}`,
      displayOrder: 1,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.INTERVENTION_NAME,
      className: `col-${InterventionColumns.INTERVENTION_NAME}`,
      displayOrder: 2,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.PROGRAM_ID,
      className: `col-${InterventionColumns.PROGRAM_ID}`,
      displayOrder: 3,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.DECESION_REQUIRED,
      className: `col-${InterventionColumns.DECESION_REQUIRED}`,
      displayOrder: 4,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.INTERVENTION_TYPE_ID,
      className: `col-${InterventionColumns.INTERVENTION_TYPE_ID}`,
      displayOrder: 5,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.REQUESTOR_ID,
      className: `col-${InterventionColumns.REQUESTOR_ID}`,
      displayOrder: 6,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.STREET_NAME,
      className: `col-${InterventionColumns.STREET_NAME}`,
      displayOrder: 7,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.STREET_FROM,
      className: `col-${InterventionColumns.STREET_FROM}`,
      displayOrder: 8,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.STREET_TO,
      className: `col-${InterventionColumns.STREET_TO}`,
      displayOrder: 9,
      sorting: SortingStatus.inactive
    },
    {
      columnName: InterventionColumns.BOROUGH_ID,
      className: `col-${InterventionColumns.BOROUGH_ID}`,
      displayOrder: 10,
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
    public readonly interventionService: InterventionService
  ) {
    super(annualProgramService, userService, projectService, submissionService);
  }
  public ngOnInit() {
    this.activatedRoute.parent.params.subscribe(async param => {
      this.currentAnnualProgram = await this.annualProgramService.getOne(
        param.id,
        [
          ANNUAL_PROGRAM_FIELDS.YEAR,
          ANNUAL_PROGRAM_FIELDS.EXECUTOR_ID,
          ANNUAL_PROGRAM_FIELDS.STATUS,
          ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_ID
        ],
        [AnnualProgramExpand.programBooks]
      );
      this.annualProgramService.updateSelectedAnnualProgram(this.currentAnnualProgram);
      await this.getSubmittedIntervention();
    });
  }
  public async getSubmittedIntervention(): Promise<void> {
    this.isInitializingTable = true;

    const searchObjects = {
      executorId: this.currentAnnualProgram?.executorId,
      planificationYear: this.currentAnnualProgram?.year,
      status: [InterventionStatus.waiting, InterventionStatus.integrated, InterventionStatus.accepted],
      project: 'null',
      fields: [
        INTERVENTION_FIELDS.INTERVENTION_NAME,
        INTERVENTION_FIELDS.PROGRAM_ID,
        INTERVENTION_FIELDS.STATUS,
        INTERVENTION_FIELDS.DECESION_REQUIRED,
        INTERVENTION_FIELDS.INTERVENTION_TYPE_ID,
        INTERVENTION_FIELDS.REQUESTOR_ID,
        INTERVENTION_FIELDS.BOROUGH_ID,
        INTERVENTION_FIELDS.STREET_NAME,
        INTERVENTION_FIELDS.STREET_FROM,
        INTERVENTION_FIELDS.STREET_TO
      ],
      orderBy: this.sortedOrderBy,
      limit: this.pagination.limit,
      offset: (this.pagination.currentPage - 1) * this.pagination.pageSize
    };
    this.interventionService.searchPaginatedInterventions(searchObjects).subscribe(data => {
      this.interventions = data.items;
      this.pagination.totalCount = data.paging.totalCount;
      this.isInitializingTable = false;
    });
  }
  public async onPageChanged(): Promise<void> {
    await this.getSubmittedIntervention();
  }

  public async handleSortChange(event: IAppSort, sortedColum: IColumn): Promise<void> {
    const sortedColumn = sortedColum.columnName;
    this.sortedDirection = event.direction as TDirection;
    this.columns.map(el => {
      el.sorting = el.columnName === sortedColum.columnName ? SortingStatus.active : SortingStatus.inactive;
      return el;
    });
    this.sortedOrderBy = this.sortedDirection === SortDirection.asc ? sortedColumn : '-' + sortedColumn;
    await this.getSubmittedIntervention();
  }
}

export interface IInterventionOrderProps {
  id: string;
  value: string;
}

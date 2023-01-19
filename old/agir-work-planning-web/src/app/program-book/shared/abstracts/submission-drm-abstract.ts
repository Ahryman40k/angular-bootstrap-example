import { OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { IEnrichedProject, ITaxonomy, ProjectType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, isNil, merge, trim, uniq } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IAppSort, SortingStatus } from 'src/app/shared/directives/sort.directive';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { HiddenColumns } from 'src/app/shared/models/menu/hidden-columns';
import { ProgramBookTableColumnLabels, ProgramBookTableColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumn, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DrmSubmissionNumberFormatPipe } from 'src/app/shared/pipes/drm-submission-number-format.pipe';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';
import { WindowBroadcastService } from 'src/app/shared/window/window-broadcast.service';
import { environment } from 'src/environments/environment';
import { BaseProgramBookTabComponent } from '../../base-program-book-tab.component';
import { IProjectOrderProps, TDirection } from '../models/submission-drm-columns';

export abstract class ProgramBookSubmissionDrmAbstract extends BaseProgramBookTabComponent implements OnInit {
  public programTaxonomies: ITaxonomy[];
  public boroughTaxonomies: ITaxonomy[];
  public abstract projects$: Observable<IEnrichedProject[]>;
  public readonly ProgramBookTableColumnLabels = ProgramBookTableColumnLabels;
  private readonly INITIAL_PAGE = 1;
  public readonly PAGE_SIZE = environment.services.pagination.limitMax;
  public sortedColumn: string = ProgramBookTableColumns.SUBMISSION_NUMBER;
  public sortedDirection = SortDirection.asc as TDirection;

  public abstract title: string;

  public abstract emptyListMessage: string;

  public pagination: IPagination = {
    currentPage: this.INITIAL_PAGE,
    limit: this.PAGE_SIZE,
    offset: 0,
    pageSize: this.PAGE_SIZE,
    totalCount: 0
  };

  public HiddenColumns = HiddenColumns;
  public isLoading = false;

  constructor(
    protected readonly taxonomiesService: TaxonomiesService,
    protected readonly projectService: ProjectService,
    protected readonly formBuilder: FormBuilder,
    protected readonly notificationsService: NotificationsService,
    protected readonly windowBroadcastService: WindowBroadcastService,
    protected readonly interventionService: InterventionService,
    protected readonly appDrmSumbissionPipe: DrmSubmissionNumberFormatPipe,
    protected readonly dialogsService: DialogsService,
    protected readonly priorityScenarioService: PriorityScenarioService,
    public readonly programBookService: ProgramBookService,
    protected readonly userPreferenceService: UserPreferenceService
  ) {
    super(userPreferenceService, priorityScenarioService, dialogsService, programBookService);
  }

  public ngOnInit(): void {
    this.initTaxonomies();
    this.initHandleProgramBookChange();
  }

  protected initTaxonomies(): void {
    combineLatest(
      this.taxonomiesService.group(this.TaxonomyGroup.programType),
      this.taxonomiesService.group(this.TaxonomyGroup.borough)
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(([programTaxonomies, boroughTaxonomies]) => {
        this.programTaxonomies = programTaxonomies;
        this.boroughTaxonomies = boroughTaxonomies;
      });
  }

  protected abstract initProjects(): void;

  protected async expandProjects(): Promise<void> {
    if (!this.canProgramBookContainPni()) {
      return;
    }
    const interventionIds: string[] = flatten(
      this.projects
        .filter(p => p.projectTypeId === ProjectType.nonIntegrated)
        .map(p => {
          return p.interventionIds.length ? p.interventionIds[0] : null;
        })
        .filter(x => x)
    );
    if (!interventionIds.length) {
      return;
    }
    const interventions = await this.interventionService
      .searchInterventionsPost({
        id: interventionIds,
        limit: interventionIds.length,
        fields: 'programId,project'
      })
      .toPromise();

    const projects = this.projects.map(p => {
      const projectInterventions = interventions.filter(i => i.project?.id === p.id);
      return { ...p, interventions: projectInterventions };
    });
    this.setProjects(projects);
  }

  protected abstract setProjects(projects: IEnrichedProject[]): void;

  protected initHandleProgramBookChange(): void {
    this.programBook$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initProjects();
    });
  }

  protected initTableItemsChange(): void {
    this.sortProjectsByColumn(this.sortedColumn, this.sortedDirection);
  }

  protected abstract get projects(): IEnrichedProject[];

  protected abstract getFields(): string;

  protected abstract cancel(): void;

  public handleSortChange(event: IAppSort): void {
    const sortedColumn = this.columnConfig.columns.find(column => {
      return ProgramBookTableColumnLabels[column.columnName] === event.columnName;
    });
    this.sortedColumn = sortedColumn ? sortedColumn.columnName : this.sortedColumn;
    this.sortedDirection = event.direction as TDirection;
    this.initColumnConfig();
    this.sortProjectsByColumn(this.sortedColumn, this.sortedDirection);
  }

  protected abstract get defaultColumns(): IColumn[];

  public get columns(): IColumn[] {
    const columns = this.shouldDisplayProgram
      ? this.defaultColumns
      : this.defaultColumns.filter(el => el.columnName !== ProgramBookTableColumns.PROGRAM);
    return columns.map(el => {
      el.sorting = el.columnName === this.sortedColumn ? SortingStatus.active : SortingStatus.inactive;
      return el;
    });
  }

  protected initColumnConfig(): void {
    this.columnConfigSubject.next({
      hiddenColumns: [],
      columns: this.columns
    });
  }

  protected canProgramBookContainPni(): boolean {
    return this.programBook.projectTypes.includes(ProjectType.nonIntegrated);
  }

  public get shouldDisplayProgram(): boolean {
    const pniProjects = this.projects.filter(el => el.projectTypeId === ProjectType.nonIntegrated);
    const nonPniProjects = this.projects.filter(el => el.projectTypeId !== ProjectType.nonIntegrated);
    // show program column when program book  pni and non pni projects
    if (pniProjects.length && nonPniProjects.length) {
      return true;
    }

    const programTypes = uniq(
      flatten(
        pniProjects.map(proj => {
          return (proj.interventions || [])
            .map(intervention => (!isNil(intervention.programId) ? intervention.programId : null))
            .filter(x => x);
        })
      )
    );
    // Should display program when projects are pni and there is more than 1 program type
    return pniProjects.length > 1 && programTypes.length > 1;
  }

  public sortProjectsByColumn(column: string, direction: TDirection): void {
    switch (column) {
      case ProgramBookTableColumns.BOROUGH:
        this.sortProjectsByBoroughId(direction);
        break;
      case ProgramBookTableColumns.LABEL:
        this.sortProjectsByProjectName(direction);
        break;
      case ProgramBookTableColumns.PROJECT_ID:
        this.sortProjectsByIds(direction);
        break;
      case ProgramBookTableColumns.PROGRAM:
        this.sortProjectsByProgram(direction);
        break;
      case ProgramBookTableColumns.SUBMISSION_NUMBER:
        this.sortProjectsBySubmissionNumber(direction);
        break;
      case ProgramBookTableColumns.STREET_NAME:
        this.sortProjectsByStreetName(direction);
        break;
      case ProgramBookTableColumns.STREET_FROM:
        this.sortProjectsByStreetFrom(direction);
        break;
      case ProgramBookTableColumns.STREET_TO:
        this.sortProjectsByStreetTo(direction);
        break;
      default:
        break;
    }
  }

  protected getProgramCode(code: string): string {
    if (!code) {
      return null;
    }
    const programTaxonomy = this.programTaxonomies.find(taxo => taxo.code === code);
    return programTaxonomy?.properties?.acronym?.fr || programTaxonomy?.label.fr;
  }

  public abstract columnOptions(project: IEnrichedProject): IColumnOptions;

  private sortProjectsByIds(direction: TDirection): void {
    const projectIdsOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      projectIdsOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value
      });
    });

    this.orderProjectsByProps(projectIdsOrderProps, direction);
  }

  private sortProjectsByBoroughId(direction: TDirection): void {
    const boroughsOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      const boroughTaxonomy = this.boroughTaxonomies.find(
        taxo => taxo.code === this.columnOptions(item)[ProgramBookTableColumns.BOROUGH].value
      );

      boroughsOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: trim(boroughTaxonomy.label.fr)
      });
    });

    this.orderProjectsByProps(boroughsOrderProps, direction);
  }

  private sortProjectsByProjectName(direction: TDirection): void {
    const labelsOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      labelsOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: trim(this.columnOptions(item)[ProgramBookTableColumns.LABEL].value)
      });
    });

    this.orderProjectsByProps(labelsOrderProps, direction);
  }

  private sortProjectsByProgram(direction: TDirection): void {
    const programOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      if (!this.columnOptions(item)[ProgramBookTableColumns.PROGRAM].value) {
        return;
      }
      programOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: trim(this.columnOptions(item)[ProgramBookTableColumns.PROGRAM].value)
      });
    });

    this.orderProjectsByProps(programOrderProps, direction);
  }

  private sortProjectsBySubmissionNumber(direction: TDirection): void {
    const submissionNumbersOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      submissionNumbersOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: trim(this.columnOptions(item)[ProgramBookTableColumns.SUBMISSION_NUMBER]?.value)
      });
    });

    this.orderProjectsByProps(submissionNumbersOrderProps, direction);
  }
  private sortProjectsByStreetName(direction: TDirection): void {
    const submissionNumbersOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      submissionNumbersOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: trim(this.columnOptions(item)[ProgramBookTableColumns.STREET_NAME]?.value)
      });
    });

    this.orderProjectsByProps(submissionNumbersOrderProps, direction);
  }
  private sortProjectsByStreetFrom(direction: TDirection): void {
    const submissionNumbersOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      submissionNumbersOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: trim(this.columnOptions(item)[ProgramBookTableColumns.STREET_FROM]?.value)
      });
    });

    this.orderProjectsByProps(submissionNumbersOrderProps, direction);
  }
  private sortProjectsByStreetTo(direction: TDirection): void {
    const submissionNumbersOrderProps: IProjectOrderProps[] = [];
    this.projects.forEach(item => {
      submissionNumbersOrderProps.push({
        id: this.columnOptions(item)[ProgramBookTableColumns.PROJECT_ID].value,
        value: trim(this.columnOptions(item)[ProgramBookTableColumns.STREET_TO]?.value)
      });
    });

    this.orderProjectsByProps(submissionNumbersOrderProps, direction);
  }

  protected abstract orderProjectsByProps(props: IProjectOrderProps[], direction: TDirection): void;
}

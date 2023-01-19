import { Component, Input, NgZone, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import {
  IEnrichedAnnualProgram,
  IEnrichedObjective,
  IEnrichedPaginatedProjects,
  IEnrichedProgramBook,
  IEnrichedProject,
  IOrderedProject,
  Permission,
  ProgramBookObjectiveType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep } from 'lodash';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { HiddenColumns } from 'src/app/shared/models/menu/hidden-columns';
import { IMenuItemConfig } from 'src/app/shared/models/menu/menu-item-config';
import { ProgramBookTableColumnLabels, ProgramBookTableColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumnConfig } from 'src/app/shared/models/table/column-config-interfaces';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { ObjectiveService } from 'src/app/shared/services/objective.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';

import { BaseComponent } from '../../shared/components/base/base.component';
import { ProgramBookTableItemComponent } from '../program-book-table-item/program-book-table-item.component';
const ORDERED_COLUMNS: string[] = [ProgramBookTableColumns.RANK, ProgramBookTableColumns.PRIORITY_LEVEL];
@Component({
  selector: 'app-program-book-table',
  templateUrl: './program-book-table.component.html',
  styleUrls: [
    './program-book-table.component.scss',
    '../program-book-table-item/program-book-table-item.component.scss'
  ]
})
export class ProgramBookTableComponent extends BaseComponent implements OnInit, OnChanges {
  public HiddenColumns = HiddenColumns;
  public ProgramBookTableColumnLabels = ProgramBookTableColumnLabels;
  public ProgramBookTableColumns = ProgramBookTableColumns;
  public columnOptions: { [columnName: string]: { permission?: Permission } };

  private readonly INITIAL_PAGE = 1;
  private readonly PAGE_SIZE = 20;
  private readonly SCROLL_DEBOUNCE_TIME_MS = 100;

  private readonly pageChangeSubject = new Subject();

  @Input() public columnConfig: IColumnConfig;
  @Input() public fetchProjects: (pagination: IPagination) => Observable<IEnrichedPaginatedProjects>;
  @Input() public fetchOrderedProjects: (pagination: IPagination) => Observable<IEnrichedProgramBook>;
  @Input() public menuItemConfig?: IMenuItemConfig;
  @Input() public programBook: IEnrichedProgramBook;
  @Input() public annualProgram: IEnrichedAnnualProgram;
  @Input() public isOrdered: boolean;
  @Input() public projectCalculationUpdated$: Observable<IEnrichedProgramBook>;

  @ViewChildren('programBookTableItems')
  public programBookTableItems: QueryList<ProgramBookTableItemComponent>;

  public projects: IEnrichedProject[];
  public orderedProjects: IOrderedProject[];
  public projectsAchievedObjectives: {
    objectives: IEnrichedObjective[];
    performanceIndicators: IEnrichedObjective[];
  }[];
  public notAchievedObjectives: { objectives: IEnrichedObjective[]; performanceIndicators: IEnrichedObjective[] };

  public pagination: IPagination = {
    currentPage: this.INITIAL_PAGE,
    limit: this.PAGE_SIZE,
    offset: 0,
    pageSize: this.PAGE_SIZE,
    totalCount: 0
  };

  public isInitializingProgramBookTable = true;
  public isProgramBookLastPage = false;
  public lastOrderedProjectFromPreviousPage: IOrderedProject;

  constructor(
    public zone: NgZone,
    private programBookService: ProgramBookService,
    private readonly projectService: ProjectService,
    private readonly objectiveService: ObjectiveService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.updateColumnHeaders(this.columnConfig);
    this.updateProjectCalculationSubscription();
    this.listenScrollEvent();
    this.initProgramBookEvents();
  }

  private initProgramBookEvents(): void {
    this.programBookService.programBookSelected$.subscribe(() => {
      this.pagination = {
        currentPage: this.INITIAL_PAGE,
        limit: this.PAGE_SIZE,
        offset: 0,
        pageSize: this.PAGE_SIZE,
        totalCount: 0
      };
      this.isInitializingProgramBookTable = true;
      this.isProgramBookLastPage = false;
    });

    merge(
      this.programBookService.programBookChanged$,
      this.projectService.projectChanged$,
      this.objectiveService.objectivesChanged$
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isOrdered ? this.getOrderedProjects() : this.getProjects();
      });
  }

  private listenScrollEvent(): void {
    fromEvent(document.querySelector('.main'), 'scroll')
      .pipe(takeUntil(this.destroy$), debounceTime(this.SCROLL_DEBOUNCE_TIME_MS))
      .subscribe(() => {
        this.programBookTableItems.forEach(item => item.moreOptions.dropdownMenuComponent.dropdown.close());
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.programBook) {
      this.onChangePage(this.pagination.currentPage);
    }
    this.updateColumnHeaders(changes.columnConfig?.currentValue);
  }

  private updateColumnHeaders(columnConfig: IColumnConfig): void {
    if (!columnConfig || !columnConfig.columns) {
      return;
    }
    this.columnConfig.columns.sort(column => column.displayOrder);
    this.columnOptions = {
      [ProgramBookTableColumns.BUDGET]: { permission: this.Permission.PROJECT_BUDGET_READ }
    };
    this.columnConfig.columns = this.columnConfig.columns.filter(
      el => this.isOrdered || !ORDERED_COLUMNS.includes(el.columnName)
    );
  }

  public onChangePage(pageNumber: number): void {
    this.isInitializingProgramBookTable = true;
    this.pageChangeSubject.next();
    this.updatePaginationProperties(pageNumber);
    this.isOrdered ? this.getOrderedProjects() : this.getProjects();
  }

  public getProjects(): void {
    this.fetchProjects(this.pagination)
      .pipe(takeUntil(this.destroy$))
      .subscribe(projects => {
        this.zone.run(() => {
          this.isInitializingProgramBookTable = false;
          this.projects = projects.items;
          this.pagination.totalCount = projects.paging.totalCount;
        });
      });
  }

  public getOrderedProjects(): void {
    this.fetchOrderedProjects(this.pagination)
      .pipe(takeUntil(this.destroy$))
      .subscribe(programBook => {
        this.zone.run(() => {
          this.isInitializingProgramBookTable = false;
          this.updatePageItems(programBook);
          this.isProgramBookLastPage = this.isLastPage();
          this.updateProjectObjectives();
        });
      });
  }

  public updateProjectCalculationSubscription(): void {
    if (this.isOrdered) {
      this.projectCalculationUpdated$.pipe(takeUntil(this.destroy$)).subscribe(programBook => {
        this.zone.run(() => {
          this.updatePageItems(programBook);
          this.updateProjectObjectives();
        });
      });
    }
  }

  public getAchievedObjectives(
    lastOrderedProjectInput: IOrderedProject,
    actualOrderedProject: IOrderedProject,
    orderedProjectsIndex: number
  ): IEnrichedObjective[] {
    const objectives: IEnrichedObjective[] = [];
    let lastOrderedProject = lastOrderedProjectInput;
    if (this.isFirstProjectAfterFirstPage(orderedProjectsIndex)) {
      lastOrderedProject = this.lastOrderedProjectFromPreviousPage;
    }

    this.programBook.objectives.forEach(objective => {
      const updatedObjective = cloneDeep(objective);
      const lastProjectObjectiveCalculation = lastOrderedProject?.objectivesCalculation.find(
        oc => oc.objectiveId === updatedObjective.id
      );
      const actualProjectObjectiveCalculation = actualOrderedProject?.objectivesCalculation.find(
        oc => oc.objectiveId === updatedObjective.id
      );

      if (
        updatedObjective.objectiveType === ProgramBookObjectiveType.threshold &&
        (!lastOrderedProject || lastProjectObjectiveCalculation.objectivePercent < 100) &&
        (!actualOrderedProject || actualProjectObjectiveCalculation.objectivePercent >= 100)
      ) {
        updatedObjective.values.calculated = lastProjectObjectiveCalculation?.objectiveSum || 0;
        objectives.push(updatedObjective);
      }
    });
    return objectives;
  }

  public getPerformanceIndicators(actualOrderedProject: IOrderedProject): IEnrichedObjective[] {
    const performanceIndicators: IEnrichedObjective[] = [];
    this.programBook.objectives
      .filter(o => o.objectiveType === ProgramBookObjectiveType.performanceIndicator)
      .forEach(pi => {
        const updatedPerformanceIndicator = cloneDeep(pi);
        const actualProjectObjectiveCalculation = actualOrderedProject?.objectivesCalculation.find(
          oc => oc.objectiveId === updatedPerformanceIndicator.id
        );
        updatedPerformanceIndicator.values.calculated = actualProjectObjectiveCalculation?.objectiveSum || 0;
        performanceIndicators.push(updatedPerformanceIndicator);
      });
    return performanceIndicators;
  }

  private updatePageItems(programBook: IEnrichedProgramBook): void {
    this.programBook = programBook;
    this.isInitializingProgramBookTable = false;

    // remove last element from previous page if page greater than 1. Used to calculate objectives in the table
    if (this.pagination.currentPage === 1) {
      this.projects = programBook.projects?.items;
    } else {
      this.projects = programBook.projects?.items.slice(1);
      this.lastOrderedProjectFromPreviousPage = programBook.priorityScenarios[0].orderedProjects.items.shift();
    }

    this.orderedProjects = programBook.priorityScenarios[0].orderedProjects.items;
    this.pagination.totalCount = programBook.projects?.paging.totalCount;
  }

  // Check if the current page is last page. Used to show the objectifs that did not achieve 100% in the programBook last page
  private isLastPage(): boolean {
    return this.pagination.currentPage === Math.ceil(this.pagination.totalCount / this.pagination.pageSize);
  }

  private isFirstProjectAfterFirstPage(orderedProjectsIndex: number): boolean {
    return orderedProjectsIndex === 0 && this.pagination.currentPage > 1;
  }

  private updatePaginationProperties(pageNumber: number): void {
    const offset = this.pagination.pageSize * (this.pagination.currentPage - 1);

    this.pagination.currentPage = pageNumber;
    // get last element from previous page if page greater than 1. Used to calculate objectives in the table
    this.pagination.offset = pageNumber === 1 ? offset : offset - 1;
    this.pagination.limit = pageNumber === 1 ? this.PAGE_SIZE : this.PAGE_SIZE + 1;
  }

  private updateProjectObjectives(): void {
    const projectsAchievedObjectives = [];
    this.projects.forEach((_, i) => {
      const performanceIndicators = this.getPerformanceIndicators(this.orderedProjects[i - 1]);
      const objectives = this.getAchievedObjectives(this.orderedProjects[i - 1], this.orderedProjects[i], i);
      projectsAchievedObjectives.push({ objectives, performanceIndicators });
    });
    this.projectsAchievedObjectives = projectsAchievedObjectives;

    if (this.isProgramBookLastPage) {
      const lastIndex = this.projects.length - 1;
      const objectives = this.getAchievedObjectives(this.orderedProjects[lastIndex], undefined, lastIndex);
      const performanceIndicators = this.getPerformanceIndicators(this.orderedProjects[lastIndex]);
      this.notAchievedObjectives = { objectives, performanceIndicators };
    }
  }
}

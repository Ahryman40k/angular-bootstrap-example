import { Component, Input, OnInit, Optional } from '@angular/core';
import {
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  IEnrichedProject,
  ProjectExpand,
  ProjectType
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { filter, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { MapNavigationService } from 'src/app/shared/services/map-navigation.service';
import { ProjectMenuService } from 'src/app/shared/services/project-menu.service';
import { ProjectService } from 'src/app/shared/services/project.service';

import { BaseObjectCardComponent } from '../../shared/components/card/base-object-card.component';

@Component({
  selector: 'app-project-card',
  templateUrl: 'project-card.component.html'
})
export class ProjectCardComponent extends BaseObjectCardComponent implements OnInit {
  public ProjectType = ProjectType;
  private _project: IEnrichedProject;
  private readonly projectChangedSubject = new Subject<IEnrichedProject>();
  public programBookToDisplay: IEnrichedProgramBook;
  public menuItems$: Observable<IMoreOptionsMenuItem[]>;
  public projectProgram$: Observable<string>;

  public get project(): IEnrichedProject {
    return this._project;
  }
  @Input()
  public set project(v: IEnrichedProject) {
    this._project = v;
    this.projectChangedSubject.next(v);
  }
  @Input() public disableAddProjectToProgramBook: boolean = false;
  @Input() public compatibleAnnualPrograms: IEnrichedAnnualProgram[];

  public get projectProgramBooks(): IEnrichedProgramBook[] {
    return this.project.annualDistribution.annualPeriods.filter(period => period.programBookId).map(p => p.programBook);
  }

  public get projectCategory(): string {
    return this.project.annualDistribution.annualPeriods.find(period => period.year === this.projectService.fromYear)
      ?.categoryId;
  }

  constructor(
    private readonly projectMenuService: ProjectMenuService,
    private readonly projectService: ProjectService,
    @Optional() mapNavigationService: MapNavigationService
  ) {
    super(mapNavigationService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initItemsToDisplay();
    this.projectService.projectChanged$.pipe(takeUntil(this.destroy$)).subscribe(async () => {
      this.project = await this.projectService.getProject(this.project.id, [ProjectExpand.programBook]);
      this.setProgramBookToDisplay();
    });
  }

  private initItemsToDisplay(): void {
    this.projectChangedSubject.pipe(startWith(null), takeUntil(this.destroy$)).subscribe(async () => {
      await this.setProjectProgram();
      this.initMenuItems();
      this.initProgramBookToDisplay();
    });
  }

  private async setProjectProgram(): Promise<void> {
    if (this.project.projectTypeId !== ProjectType.nonIntegrated) {
      return;
    }
    let intervention;

    if (this.project.interventions?.length) {
      intervention = this.project.interventions[0];
    }
    if (intervention) {
      this.projectProgram$ = this.projectService
        .getProjectProgram(this.project, intervention)
        .pipe(takeUntil(this.destroy$));
    }
  }

  private initProgramBookToDisplay(): void {
    this.setProgramBookToDisplay();
    this.projectService.fromYearChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => this.setProgramBookToDisplay());
  }

  private setProgramBookToDisplay(): void {
    this.programBookToDisplay = null;
    const programBooks = this.projectProgramBooks;
    if (isEmpty(programBooks)) {
      return;
    }
    if (this.projectService.isProjectFuture(this.project)) {
      this.programBookToDisplay = programBooks[0];
    } else if (this.projectService.isProjectPast(this.project)) {
      this.programBookToDisplay = programBooks[programBooks.length - 1];
    } else {
      this.programBookToDisplay = this.project.annualDistribution.annualPeriods
        .filter(period => period.year === this.projectService.fromYear)
        .map(p => p.programBook)[0];
    }
  }

  private initMenuItems(): void {
    this.menuItems$ = this.projectChangedSubject.pipe(
      startWith(this.project),
      filter(p => !!p),
      switchMap(p =>
        this.projectMenuService.getMenuItems(p, this.destroy$, {
          disableAddProjectToProgramBook: this.disableAddProjectToProgramBook,
          compatibleAnnualPrograms: this.compatibleAnnualPrograms
        })
      )
    );
  }

  protected onClick(): void {
    this.navigateToSelection(this.project);
  }
}

import { Component, NgZone, OnInit } from '@angular/core';
import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import { merge, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { HiddenColumns } from 'src/app/shared/models/menu/hidden-columns';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';
import { BaseProgramBookTabComponent, DEFAULT_SCENARIO_INDEX } from '../base-program-book-tab.component';

@Component({
  selector: 'app-program-book-details-programmed-projects',
  styleUrls: ['./program-book-details-programmed-projects.scss'],
  templateUrl: './program-book-details-programmed-projects.html'
})
export class ProgramBookDetailsProgrammedProjectsComponent extends BaseProgramBookTabComponent implements OnInit {
  public HiddenColumns = HiddenColumns;

  private readonly projectCalculationUpdatedSubject = new Subject<IEnrichedProgramBook>();
  public projectCalculationUpdated$ = this.projectCalculationUpdatedSubject.asObservable();

  constructor(
    public zone: NgZone,
    programBookService: ProgramBookService,
    private readonly projectService: ProjectService,
    dialogsService: DialogsService,
    priorityScenarioService: PriorityScenarioService,
    userPreferenceService: UserPreferenceService
  ) {
    super(userPreferenceService, priorityScenarioService, dialogsService, programBookService);
  }

  public ngOnInit(): void {
    this.initColumnConfig();
    this.initPriorityScenariosOutdated();
  }

  private initPriorityScenariosOutdated(): void {
    merge(this.programBookService.programBookChanged$, this.projectService.projectChanged$, this.programBook$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.zone.run(() => {
          this.priorityScenariosOutdated = this.arePriorityScenariosOutdated();
        });
      });
  }

  public async calculatePriorityScenario(): Promise<void> {
    if (this.hasProjectManuallyOrdered()) {
      const isCalculationConfirmed = await this.updateCalculationConfirmationModal();
      if (!isCalculationConfirmed) {
        return;
      }
    }

    await this.updatePriorityScenario(this.programBook, this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX]);

    this.baseCalculatePriorityScenario()
      .pipe(takeUntil(this.destroy$))
      .subscribe(programBook => {
        this.zone.run(() => {
          this.programBookService.setSelectedProgramBooksDetails(programBook);
        });
      });
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.programBookService.selectedProgramBookDetails.isAutomaticLoadingInProgress;
  }

  public getOrderedProjects = (pagination: IPagination): Observable<IEnrichedProgramBook> => {
    return this.priorityScenarioService.getOrderedProjects(
      this.programBook.id,
      this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].id,
      pagination.limit,
      pagination.offset
    );
  };
}

import { Component, OnInit } from '@angular/core';
import { IEnrichedObjective, ProgramBookObjectiveTargetType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { merge } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';
import { DialogsService } from '../../shared/dialogs/dialogs.service';
import { ObjectiveModalComponent } from '../../shared/dialogs/objective-modal/objective-modal.component';
import { SortDirection } from '../../shared/forms/sort/sort-utils';
import { ObjectiveService } from '../../shared/services/objective.service';
import { PriorityScenarioService } from '../../shared/services/priority-scenario.service';
import { ProgramBookService } from '../../shared/services/program-book.service';
import { BaseProgramBookTabComponent } from '../base-program-book-tab.component';

@Component({
  selector: 'app-program-book-objectives',
  templateUrl: './program-book-objectives.component.html'
})
export class ProgramBookObjectivesComponent extends BaseProgramBookTabComponent implements OnInit {
  public objectives: IEnrichedObjective[];

  public isInitializingProgramBookObjectives = true;

  constructor(
    private readonly objectiveService: ObjectiveService,
    programBookService: ProgramBookService,
    dialogsService: DialogsService,
    priorityScenarioService: PriorityScenarioService,
    userPreferenceService: UserPreferenceService
  ) {
    super(userPreferenceService, priorityScenarioService, dialogsService, programBookService);
  }

  public ngOnInit(): void {
    this.initObjectives();
    this.programBookService.programBookSelected$.subscribe(() => {
      this.isInitializingProgramBookObjectives = true;
    });
  }

  private initObjectives(): void {
    merge(this.objectiveService.objectivesChanged$, this.programBook$)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.objectiveService.getAll(this.programBook.id)),
        map(objectives => orderBy(objectives, o => o.audit?.createdAt)),
        map(objectives =>
          orderBy(objectives, o => o.targetType === ProgramBookObjectiveTargetType.bid, SortDirection.desc)
        )
      )
      .subscribe(objectives => {
        this.objectives = objectives;
        this.isInitializingProgramBookObjectives = false;
      });
  }

  public openObjectiveModal(): void {
    const modal = this.dialogsService.showModal(ObjectiveModalComponent);
    modal.componentInstance.title = 'Ajouter un objectif';
    modal.componentInstance.programBookId = this.programBook.id;
    modal.componentInstance.buttonLabel = 'Ajouter';
    modal.componentInstance.programBook = this.programBook;
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.programBookService.isAutomaticLoadingInProgress;
  }
}

import { OnInit } from '@angular/core';
import {
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  IPriorityScenario
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../shared/components/base/base.component';
import { CustomizeProgramBookTableViewModalComponent } from '../shared/dialogs/customize-program-book-table-view-modal/customize-program-book-table-view-modal.component';
import { DialogsService } from '../shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../shared/forms/confirmation-modal/confirmation-modal.component';
import { DEFAULT_PROGRAM_BOOK_TABLE_COLUMNS } from '../shared/models/table/column-config-enums';
import { IColumn, IColumnConfig } from '../shared/models/table/column-config-interfaces';
import { PriorityScenarioService } from '../shared/services/priority-scenario.service';
import { ProgramBookService } from '../shared/services/program-book.service';
import { UserPreferenceService } from '../shared/services/user-preference.service';
import { IRestrictionItem } from '../shared/user/user-restrictions.service';

export const DEFAULT_SCENARIO_INDEX = 0;
const tablePreferencesKey = 'programBook-projects-table';
export abstract class BaseProgramBookTabComponent extends BaseComponent implements OnInit {
  public annualProgram: IEnrichedAnnualProgram;

  public annualProgram$: Observable<IEnrichedAnnualProgram>;
  public get programBook$(): Observable<IEnrichedProgramBook> {
    return this.programBookService.selectedProgramBookDetails$;
  }
  public get programBook(): IEnrichedProgramBook {
    return this.programBookService.selectedProgramBookDetails;
  }

  public readonly DEFAULT_SCENARIO_INDEX = '0';
  public priorityScenariosOutdated = false;
  public isInitializingProgramBookSummary = true;
  public columnConfigSubject = new BehaviorSubject<IColumnConfig>({ columns: [], hiddenColumns: [] });
  public columnConfig$ = this.columnConfigSubject.asObservable();

  public get columnConfig(): IColumnConfig {
    return this.columnConfigSubject.getValue();
  }

  constructor(
    protected readonly userPreferenceService: UserPreferenceService,
    protected readonly priorityScenarioService: PriorityScenarioService,
    protected readonly dialogsService: DialogsService,
    public programBookService: ProgramBookService
  ) {
    super();
    this.programBook$.pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.annualProgram = this.programBook.annualProgram;
      this.isInitializingProgramBookSummary = false;
    });
  }

  public ngOnInit(): void {
    this.programBookService.programBookSelected$.subscribe(() => {
      this.isInitializingProgramBookSummary = true;
    });
  }
  public arePriorityScenariosOutdated(): boolean {
    return this.programBook.priorityScenarios.some(priorityScenario => priorityScenario.isOutdated);
  }

  public baseCalculatePriorityScenario(): Observable<IEnrichedProgramBook> {
    return this.priorityScenarioService.calculatePriorityScenario(
      this.programBook.id,
      this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].id
    );
  }

  protected async updatePriorityScenario(
    programBook: IEnrichedProgramBook,
    priorityScenario: IPriorityScenario
  ): Promise<void> {
    await this.priorityScenarioService.update(programBook.id, priorityScenario.id, priorityScenario.priorityLevels);
  }

  public async updateCalculationConfirmationModal(): Promise<boolean> {
    const modal = this.dialogsService.showConfirmationModal(
      `Actualiser l'ordonnancement`,
      'Les déplacements manuels seront réinitialisés, voulez-vous continuer?'
    );
    const result = await modal.result;
    return result === ConfirmationModalCloseType.confirmed;
  }

  public hasProjectManuallyOrdered(): boolean {
    return this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].orderedProjects.items.some(
      project => project.isManuallyOrdered
    );
  }

  public openCustomizeProgramBookTableViewModal(): void {
    this.getTableColumnsFromUserPreferences()
      .pipe(take(1))
      .subscribe(async columnsFromUserPreferences => {
        const modal = this.dialogsService.showModal(CustomizeProgramBookTableViewModalComponent);
        modal.componentInstance.initialize(columnsFromUserPreferences);
        const tableColumns = await modal.result;
        if (!tableColumns) {
          return;
        }
        this.columnConfigSubject.next({ ...this.columnConfig, columns: tableColumns });
        await this.saveUserTableColumnsPreferences(tableColumns);
        modal.close();
      });
  }

  protected getTableColumnsFromUserPreferences(): Observable<IColumn[]> {
    return this.userPreferenceService.get(tablePreferencesKey);
  }

  protected initColumnConfig(): void {
    this.getTableColumnsFromUserPreferences()
      .pipe(take(1))
      .subscribe(columnConfig => {
        this.columnConfigSubject.next({
          hiddenColumns: [],
          columns: columnConfig || DEFAULT_PROGRAM_BOOK_TABLE_COLUMNS
        });
      });
  }

  private async saveUserTableColumnsPreferences(columns: IColumn[]): Promise<void> {
    await this.userPreferenceService.set(tablePreferencesKey, columns);
  }

  public get restrictionItems(): IRestrictionItem[] {
    return [
      { entity: this.annualProgram, entityType: 'ANNUAL_PROGRAM' },
      { entity: this.programBook, entityType: 'PROGRAM_BOOK' }
    ];
  }
}

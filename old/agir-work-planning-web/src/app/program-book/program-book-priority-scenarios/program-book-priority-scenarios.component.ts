import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import {
  IEnrichedPriorityLevel,
  InterventionType,
  IPriorityLevelCriteria,
  IPriorityLevelSortCriteria,
  IPriorityScenario,
  ITaxonomyList,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, concat, isEqual, uniqBy } from 'lodash';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { swapArrayPositionsAndRanks } from 'src/app/shared/files/utils';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';

import { BaseProgramBookTabComponent, DEFAULT_SCENARIO_INDEX } from '../base-program-book-tab.component';

export interface IFilterTaxonomies {
  projectCategories?: ITaxonomyList;
  projectSubCategories?: ITaxonomyList;
  assetWorkTypes?: ITaxonomyList;
  requestors?: ITaxonomyList;
  assetTypes?: ITaxonomyList;
  interventionTypes?: ITaxonomyList;
  services?: ITaxonomyList;
  priorityTypes?: ITaxonomyList;
}

@Component({
  selector: 'app-program-book-priority-scenarios',
  templateUrl: './program-book-priority-scenarios.component.html',
  styleUrls: ['./program-book-priority-scenarios.component.scss']
})
export class ProgramBookPriorityScenariosComponent extends BaseProgramBookTabComponent implements OnInit {
  public taxonomies: IFilterTaxonomies = {};
  public priorityScenarios: IPriorityScenario[];
  public submitted = false;
  public programBookDeleted = false;
  public priorityLevelsChanged = false;
  public isInitializingProgramBookScenarios = true;
  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly notificationsService: NotificationsService,
    programBookService: ProgramBookService,
    dialogsService: DialogsService,
    priorityScenarioService: PriorityScenarioService,
    userPreferenceService: UserPreferenceService
  ) {
    super(userPreferenceService, priorityScenarioService, dialogsService, programBookService);
  }

  public get lastModified(): { displayName: string; date: string } {
    const priorityScenario = this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX];
    return {
      displayName: priorityScenario.audit.lastModifiedBy?.displayName,
      date: priorityScenario.audit.lastModifiedAt
    };
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.programBookService.isAutomaticLoadingInProgress;
  }

  public arePriorityLevelsChanged(): boolean {
    const priorityLevelsChanged = !isEqual(this.programBook.priorityScenarios, this.priorityScenarios);
    this.priorityScenarioService.priorityScenarioUnsavedSubject.next(priorityLevelsChanged);
    return priorityLevelsChanged;
  }
  public async ngOnInit(): Promise<void> {
    await this.loadTaxonomies();
    this.initSubscriptions();
    this.programBookService.programBookSelected$.subscribe(() => {
      this.isInitializingProgramBookScenarios = true;
    });
  }

  public initSubscriptions(): void {
    this.programBook$.pipe(takeUntil(this.destroy$)).subscribe(programBook => {
      this.priorityScenarios = cloneDeep(programBook.priorityScenarios);
      this.isInitializingProgramBookScenarios = false;
      this.updateValidators();
    });

    this.priorityScenarioService.priorityScenarioChanged$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.programBookService.getProgramBookById(this.programBook.id))
      )
      .subscribe(programBook => {
        this.priorityScenarios = cloneDeep(programBook.priorityScenarios);
        this.programBook.priorityScenarios = programBook.priorityScenarios;
      });

    this.programBookService.programBookDeleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.programBookDeleted = true));
  }

  private updateValidators(): void {
    this.priorityLevelsChanged = this.arePriorityLevelsChanged();
    this.priorityScenariosOutdated = this.arePriorityScenariosOutdated();
  }

  public async loadTaxonomies(): Promise<void> {
    const groups = await this.taxonomiesService
      .groups(
        TaxonomyGroup.projectCategory,
        TaxonomyGroup.projectSubCategory,
        TaxonomyGroup.workType,
        TaxonomyGroup.requestor,
        TaxonomyGroup.assetType,
        TaxonomyGroup.interventionType,
        TaxonomyGroup.service,
        TaxonomyGroup.priorityType
      )
      .pipe(take(1))
      .toPromise();

    this.taxonomies = {
      projectCategories: groups[0],
      projectSubCategories: groups[1],
      assetWorkTypes: groups[2],
      requestors: groups[3],
      assetTypes: groups[4],
      interventionTypes: groups[5].filter(group => group.code === InterventionType.initialNeed),
      services: groups[6],
      priorityTypes: groups[7]
    };
  }

  public onDragPriorityLevelRank(event: CdkDragDrop<string[]>, scenarioIndex: number): void {
    if (event.currentIndex === 0 || event.previousIndex === 0) {
      return;
    }

    // move element in array
    const priorityLevels = this.priorityScenarios[scenarioIndex].priorityLevels;
    const levelToMove = priorityLevels.splice(event.previousIndex, 1);
    priorityLevels.splice(event.currentIndex, 0, levelToMove[0]);
    priorityLevels.forEach((priorityLevel, index) => {
      priorityLevel.rank = index + 1;
    });
    this.updateValidators();
  }

  public onChangePriorityLevelRank(level: { actualRank: number; newRank: number }, scenarioIndex: number): void {
    swapArrayPositionsAndRanks(
      this.priorityScenarios[scenarioIndex].priorityLevels,
      --level.actualRank,
      --level.newRank
    );
    this.updateValidators();
  }

  public onChangePriorityLevelCriteria(
    criteria: IPriorityLevelCriteria,
    scenarioIndex: number,
    priorityLevelIndex: number
  ): void {
    setTimeout(() => {
      this.priorityScenarios[scenarioIndex].priorityLevels[priorityLevelIndex].criteria = criteria;
    });
    this.updateValidators();
  }

  public onChangePriorityLevelSortCriterias(
    sortCriterias: IPriorityLevelSortCriteria[],
    scenarioIndex: number,
    priorityLevelIndex: number
  ): void {
    this.priorityScenarios[scenarioIndex].priorityLevels[priorityLevelIndex].sortCriterias = sortCriterias;
    this.updateValidators();
  }

  public onDeletePriorityLevel(priorityLevelRank: number, scenarioIndex: number): void {
    this.priorityScenarios[scenarioIndex].priorityLevels = this.priorityScenarios[scenarioIndex].priorityLevels.filter(
      pl => pl.rank !== priorityLevelRank
    );

    this.reassignRanks(this.priorityScenarios[scenarioIndex].priorityLevels);
    this.updateValidators();
  }

  public onAddPriorityLevel(): void {
    const rank = this.priorityScenarios[DEFAULT_SCENARIO_INDEX].priorityLevels.length + 1;
    this.priorityScenarios[DEFAULT_SCENARIO_INDEX].priorityLevels.push({
      rank,
      criteria: {},
      isSystemDefined: false,
      projectCount: 0,
      sortCriterias: this.priorityScenarioService.getDefaultSortCriterias()
    });
    this.updateValidators();
  }

  public async onSavePriorityLevels(): Promise<void> {
    this.submitted = true;
    this.priorityScenarioService.priorityScenarioSubmittedSubject.next(true);

    const priorityScenario = this.priorityScenarios[DEFAULT_SCENARIO_INDEX];

    if (this.arePriorityLevelsInvalid(priorityScenario.priorityLevels)) {
      return;
    }

    if (this.hasProjectManuallyOrdered()) {
      const isCalculationConfirmed = await this.updateCalculationConfirmationModal();
      if (!isCalculationConfirmed) {
        return;
      }
    }

    await this.calculatePriorityScenario();
    this.submitted = false;
    this.notificationsService.showSuccess(`L'ordonnancement des projets sera fait selon les niveaux définis.`);
  }

  public async calculatePriorityScenario(): Promise<void> {
    await this.updatePriorityScenario(this.programBook, this.priorityScenarios[DEFAULT_SCENARIO_INDEX]);

    this.baseCalculatePriorityScenario()
      .pipe(takeUntil(this.destroy$))
      .subscribe(programBook => {
        this.programBookService.setSelectedProgramBooksDetails(programBook);
        this.priorityScenarios = programBook.priorityScenarios;
        this.updateValidators();
      });
  }

  private arePriorityLevelsInvalid(priorityLevels: IEnrichedPriorityLevel[]): boolean {
    const hasNoCriteria = this.priorityLevelHasNoCriteria(priorityLevels);
    const isRepeated = this.arePriorityLevelsRepeated(priorityLevels);

    if (isRepeated) {
      this.notificationsService.showError(`Détection de doublon. Impossible d’effectuer cette opération.`);
    }

    return hasNoCriteria || isRepeated;
  }

  private priorityLevelHasNoCriteria(priorityLevels: IEnrichedPriorityLevel[]): boolean {
    return priorityLevels.some(
      priorityLevel =>
        !priorityLevel.criteria.projectCategory?.length &&
        !priorityLevel.criteria.workTypeId?.length &&
        !priorityLevel.criteria.requestorId?.length &&
        !priorityLevel.criteria.assetTypeId?.length &&
        !priorityLevel.criteria.interventionType?.length &&
        !priorityLevel.criteria.servicePriorities?.length
    );
  }

  private arePriorityLevelsRepeated(priorityLevels: IEnrichedPriorityLevel[]): boolean {
    const priorityLevelCriterias = priorityLevels.map(pl =>
      concat(
        pl.criteria.assetTypeId,
        pl.criteria.requestorId,
        pl.criteria.workTypeId,
        pl.criteria.interventionType,
        JSON.stringify(pl.criteria.projectCategory),
        JSON.stringify(pl.criteria.servicePriorities)
      )
        .filter(criteria => criteria !== undefined)
        .sort()
    );
    const uniqPriorityLevelCriterias = uniqBy(priorityLevelCriterias, plc => plc.toString());
    return uniqPriorityLevelCriterias.length !== priorityLevelCriterias.length;
  }

  private reassignRanks(priorityLevels: IEnrichedPriorityLevel[]): void {
    priorityLevels.forEach((pl, index) => {
      pl.rank = index + 1;
    });
  }
}

import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {
  IEnrichedPriorityLevel,
  InterventionType,
  IPriorityLevelCriteria,
  IPriorityLevelSortCriteria,
  IProjectCategoryCriteria,
  IServicePriority
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { MultiSelectCheckboxComponent } from 'src/app/shared/components/multi-select-checkbox/multi-select-checkbox.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { PriorityLevelSortModalComponent } from 'src/app/shared/dialogs/priority-level-sort-modal/priority-level-sort-modal.component';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';

import { IFilterTaxonomies } from '../../program-book-priority-scenarios/program-book-priority-scenarios.component';
import { CategoryDropdownComponent } from './category-dropdown/category-dropdown.component';
import { PriorityServiceDropdownComponent } from './priority-service-dropdown/priority-service-dropdown.component';

export enum PriorityLevelCriteria {
  projectCategory = 'projectCategory',
  workTypeId = 'workTypeId',
  requestorId = 'requestorId',
  assetTypeId = 'assetTypeId',
  interventionType = 'interventionType',
  servicePriorities = 'servicePriorities'
}

@Component({
  selector: 'app-priority-level-card',
  templateUrl: './priority-level-card.component.html',
  styleUrls: ['./priority-level-card.component.scss']
})
export class PriorityLevelCardComponent extends BaseComponent implements OnInit {
  public readonly PriorityLevelCriteria = PriorityLevelCriteria;

  public readonly FIRST_RANK = 1;
  public readonly SECOND_RANK = 2;

  @ViewChild('workTypeId') public workTypeId: MultiSelectCheckboxComponent;
  @ViewChild('requestorId') public requestorId: MultiSelectCheckboxComponent;
  @ViewChild('assetTypeId') public assetTypeId: MultiSelectCheckboxComponent;
  @ViewChild('interventionType') public interventionType: MultiSelectCheckboxComponent;
  @ViewChildren('serviceDropdowns') public serviceDropdowns: QueryList<PriorityServiceDropdownComponent>;
  @ViewChildren('categoryDropdowns') public categoryDropdowns: QueryList<CategoryDropdownComponent>;

  @Input() public priorityLevel: IEnrichedPriorityLevel;
  @Input() public taxonomies: IFilterTaxonomies;
  @Input() public priorityLevelLength: number;
  @Input() public disabled: boolean;
  @Input() public submitted: boolean;
  @Input() public hasWriteAccess: boolean;
  @Input() public index: number;

  @Output() public priorityLevelRankChanged = new EventEmitter<{ actualRank: number; newRank: number }>();
  @Output() public priorityLevelDeleted = new EventEmitter<number>();
  @Output() public priorityLevelCriteriaChanged = new EventEmitter<IPriorityLevelCriteria>();
  @Output() public priorityLevelSortCriteriasChanged = new EventEmitter<IPriorityLevelSortCriteria[]>();
  public priorityLevelCriteriaRemoved = new Subject<void>();

  public criteria: IPriorityLevelCriteria = {};
  public interventionTypes = [];
  public isSubmitted = false;

  constructor(
    private readonly dialogsService: DialogsService,
    private readonly programBookService: ProgramBookService,
    public priorityScenarioService: PriorityScenarioService
  ) {
    super();
  }
  public ngOnInit(): void {
    this.priorityScenarioService.priorityScenarioSubmitted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSubmitted => (this.isSubmitted = isSubmitted));
    this.initPriorityLevelCardInfo();
  }

  private initPriorityLevelCardInfo(): void {
    this.initInterventionTypes();
  }

  public get isDisabled(): boolean {
    return (
      this.priorityLevel.rank === this.FIRST_RANK ||
      this.disabled ||
      !this.hasWriteAccess ||
      this.isAutomaticLoadingInProgress
    );
  }

  private initInterventionTypes(): void {
    this.interventionTypes = [
      {
        code: InterventionType.initialNeed,
        label: {
          fr: `Sélectionner les interventions de type\n "besoin initial" uniquement`
        }
      }
    ];
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.programBookService.isAutomaticLoadingInProgress;
  }

  public get priorityLevelHasNoCriteria(): boolean {
    return (
      !this.criteria.assetTypeId?.length &&
      !this.criteria.projectCategory?.length &&
      !this.criteria.requestorId?.length &&
      !this.criteria.workTypeId?.length &&
      !this.criteria.interventionType?.length &&
      !this.criteria.servicePriorities?.length
    );
  }

  public emitIncreaseRank(actualRank: number): void {
    this.priorityLevelRankChanged.emit({ actualRank, newRank: actualRank + 1 });
  }

  public emitDecreaseRank(actualRank: number): void {
    this.priorityLevelRankChanged.emit({ actualRank, newRank: actualRank - 1 });
  }

  public async emitDeleteRank(priorityLevelRank: number): Promise<void> {
    const title = "Supprimer le niveau d'ordonnancement";
    const message = `La suppression de ce niveau d'ordonnancement entrainera la perte des données. Êtes-vous certain de vouloir continuer?`;
    const modal = this.dialogsService.showDeleteModal(title, message);
    const result = await modal.result;
    if (result !== ConfirmationModalCloseType.confirmed) {
      return;
    }

    this.priorityLevelDeleted.emit(priorityLevelRank);
  }

  public emitNewCriteria(criterias: any[], criteriaType: PriorityLevelCriteria): void {
    this.criteria[criteriaType] = criterias;
    this.priorityLevelCriteriaChanged.emit(this.criteria);
  }

  public emitRemoveCriteria(
    criteria: string & IServicePriority & IProjectCategoryCriteria,
    criteriaType: PriorityLevelCriteria
  ): void {
    const index = this.criteria[criteriaType].indexOf(criteria);
    this.criteria[criteriaType].splice(index, 1);
    this[criteriaType]?.removeItem(criteria);
    this.priorityLevelCriteriaChanged.emit(this.criteria);
    this.priorityLevelCriteriaRemoved.next();
  }

  public async openPriorityLevelSortModal(priorityLevel: IEnrichedPriorityLevel): Promise<void> {
    const modal = this.dialogsService.showModal(PriorityLevelSortModalComponent);
    await modal.componentInstance.initialize(priorityLevel);
    const updatedPriorityLevel = await modal.result;
    if (!updatedPriorityLevel) {
      return;
    }
    this.priorityLevel = updatedPriorityLevel;
    this.priorityLevelSortCriteriasChanged.emit(this.priorityLevel.sortCriterias);
  }

  public getCriteriaLabel(
    criteriaCode: string & IServicePriority & IProjectCategoryCriteria,
    criteriaType: PriorityLevelCriteria
  ): string {
    switch (criteriaType) {
      case PriorityLevelCriteria.projectCategory:
        return this.getProjectCategoryLabel(criteriaCode);
      case PriorityLevelCriteria.workTypeId:
        return this.taxonomies.assetWorkTypes?.find(t => t.code === criteriaCode).label.fr;
      case PriorityLevelCriteria.assetTypeId:
        return this.taxonomies.assetTypes?.find(t => t.code === criteriaCode).label.fr;
      case PriorityLevelCriteria.requestorId:
        return this.taxonomies.requestors?.find(t => t.code === criteriaCode).label.fr;
      case PriorityLevelCriteria.interventionType:
        return this.taxonomies.interventionTypes?.find(t => t.code === criteriaCode).label.fr;
      case PriorityLevelCriteria.servicePriorities:
        return `${this.taxonomies.services?.find(t => t.code === criteriaCode.service)?.properties.acronym.fr}
          - ${this.taxonomies.priorityTypes?.find(t => t.code === criteriaCode.priorityId)?.label.fr}`;
      default:
        return '';
    }
  }

  public closeServiceDropdown(index: number): void {
    this.closeDropdownByIndex(this.serviceDropdowns, index);
  }

  public closeCategoryDropdown(index: number): void {
    this.closeDropdownByIndex(this.categoryDropdowns, index);
  }

  private closeDropdownByIndex(
    dropdowns: QueryList<PriorityServiceDropdownComponent | CategoryDropdownComponent>,
    index: number
  ): void {
    dropdowns.find(d => d.index === index)?.dropdown.close();
  }
  private getProjectCategoryLabel(criteriaCode: IProjectCategoryCriteria): string {
    const category = this.taxonomies.projectCategories?.find(t => t.code === criteriaCode.category)?.label.fr;
    const subCategory = this.taxonomies.projectSubCategories?.find(t => t.code === criteriaCode.subCategory)?.label.fr;
    return subCategory ? `${category} - ${subCategory}` : category;
  }
}

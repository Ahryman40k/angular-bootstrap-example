import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedPriorityLevel,
  IPriorityLevelSortCriteria,
  ProgramBookPriorityLevelSort,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep } from 'lodash';
import { take } from 'rxjs/operators';

import { BaseComponent } from '../../components/base/base.component';
import { swapArrayPositionsAndRanks } from '../../files/utils';
import { PriorityScenarioService } from '../../services/priority-scenario.service';
import { TaxonomiesService } from '../../services/taxonomies.service';

@Component({
  selector: 'app-priority-level-sort-modal',
  templateUrl: './priority-level-sort-modal.component.html'
})
export class PriorityLevelSortModalComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public isSubmitting = false;
  public modalTitle: string;
  public priorityLevel: IEnrichedPriorityLevel;
  public sortCriteriasToAdd: IPriorityLevelSortCriteria[];

  constructor(
    private readonly priorityScenarioService: PriorityScenarioService,
    private readonly taxonomiesService: TaxonomiesService,
    public activeModal: NgbActiveModal,
    public fb: FormBuilder
  ) {
    super();
  }

  public async initialize(priorityLevel: IEnrichedPriorityLevel): Promise<void> {
    this.priorityLevel = cloneDeep(priorityLevel);
    await this.initSortCriteriasToAdd();
  }

  public ngOnInit(): void {
    this.initForm();
    this.initModalInformation();
  }

  private async initSortCriteriasToAdd(): Promise<void> {
    const allCriterias = await this.getAllCriterias();
    this.sortCriteriasToAdd = allCriterias.filter(
      criteria =>
        !this.priorityLevel.sortCriterias.some(c => c.name === criteria.name && c.service === criteria.service)
    );
  }

  private async getAllCriterias(): Promise<IPriorityLevelSortCriteria[]> {
    const criterias = Object.values(ProgramBookPriorityLevelSort)
      .filter(name => name !== ProgramBookPriorityLevelSort.SERVICE_PRIORITY)
      .map(name => ({ rank: 0, name }));
    const services = await this.taxonomiesService
      .group(TaxonomyGroup.service)
      .pipe(take(1))
      .toPromise();
    const servicePriorityCriterias = services.map(s => ({
      rank: 0,
      name: ProgramBookPriorityLevelSort.SERVICE_PRIORITY,
      service: s.code
    }));
    return [...criterias, ...servicePriorityCriterias];
  }

  private initModalInformation(): void {
    this.modalTitle = `Tri du niveau ${this.priorityLevel.rank}`;
  }

  public initForm(): void {
    this.form = this.fb.group({});
  }

  public applyPriorityLevelSort(): void {
    this.activeModal.close(this.priorityLevel);
  }

  public async restartPriorityLevelSort(): Promise<void> {
    this.priorityLevel.sortCriterias = this.priorityScenarioService.getDefaultSortCriterias();
    await this.initSortCriteriasToAdd();
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  // swap ranks between actual and next criteria => ex: rank:1 => rank:2
  public decreaseRank(rank: number): void {
    this.modifyRank(rank, input => input + 1);
  }

  // swap ranks between previous and actual criteria => ex: rank:2 => rank:1
  public increaseRank(rank: number): void {
    this.modifyRank(rank, input => input - 1);
  }

  public modifyRank(rank: number, modifier: (input: number) => number): void {
    const actual = rank - 1;
    swapArrayPositionsAndRanks(this.priorityLevel.sortCriterias, actual, modifier(actual));
  }

  public removeCriteria(rank: number): void {
    const index = rank - 1;
    const removedCriteria = this.priorityLevel.sortCriterias.splice(index, 1)[0];
    this.priorityLevel.sortCriterias = this.priorityLevel.sortCriterias.map((sc, i) => {
      sc.rank = i + 1;
      return sc;
    });
    this.sortCriteriasToAdd.push(removedCriteria);
  }

  public addCriteria(criteria: IPriorityLevelSortCriteria): void {
    const index = this.sortCriteriasToAdd.findIndex(
      _criteria => _criteria.name === criteria.name && _criteria.rank === criteria.rank
    );
    this.sortCriteriasToAdd.splice(index, 1);
    criteria.rank = this.priorityLevel.sortCriterias.length + 1;
    this.priorityLevel.sortCriterias.push(criteria);
  }
}

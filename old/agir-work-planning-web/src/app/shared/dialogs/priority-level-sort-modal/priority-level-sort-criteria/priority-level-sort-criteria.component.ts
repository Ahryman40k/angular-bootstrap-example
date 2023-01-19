import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IPriorityLevelSortCriteria } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { PriorityLevelSortCriteriaLabels } from 'src/app/shared/models/program-book/priority-level-sort-criteria-labels';

@Component({
  selector: 'app-priority-level-sort-criteria',
  templateUrl: './priority-level-sort-criteria.component.html',
  styleUrls: ['./priority-level-sort-criteria.component.scss']
})
export class PriorityLevelSortCriteriaComponent extends BaseComponent {
  @Input() public sortCriteria: IPriorityLevelSortCriteria;
  @Input() public isLast: boolean;
  @Input() public isFirst: boolean;
  @Input() public isAddMode: boolean;

  @Output() public rankIncreased = new EventEmitter<number>();
  @Output() public rankDecreased = new EventEmitter<number>();
  @Output() public criteriaRemoved = new EventEmitter<number>();
  @Output() public criteriaAdded = new EventEmitter<IPriorityLevelSortCriteria>();

  public PriorityLevelSortCriteriaLabels = PriorityLevelSortCriteriaLabels;

  public emitIncreaseRank(): void {
    this.rankIncreased.emit(this.sortCriteria.rank);
  }

  public emitDecreaseRank(): void {
    this.rankDecreased.emit(this.sortCriteria.rank);
  }

  public emitRemove(): void {
    this.criteriaRemoved.emit(this.sortCriteria.rank);
  }

  public emitAdd(): void {
    this.criteriaAdded.emit(this.sortCriteria);
  }
}

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep } from 'lodash';

import { BaseComponent } from '../../components/base/base.component';

@Component({
  selector: 'app-customize-intervention-table-view-modal',
  templateUrl: './customize-intervention-table-view-modal.component.html',
  styleUrls: ['./customize-intervention-table-view-modal.component.scss']
})
export class CustomizeInterventionTableViewModalComponent extends BaseComponent {
  public selectedColumns = [];
  public unselectedColumns = [];
  public initFieldsSelected = [];
  public interventionTableColumnLabels = [];

  constructor(private readonly activeModal: NgbActiveModal) {
    super();
  }

  public drop(event: CdkDragDrop<string[]>) {
    if (event.currentIndex !== 0) {
      moveItemInArray(this.selectedColumns, event.previousIndex, event.currentIndex);
    }
  }

  public initialize(interventionAttributes, allInterventionList, initFields): void {
    this.interventionTableColumnLabels = allInterventionList;
    this.selectedColumns = this.getSelectedColumns(interventionAttributes, allInterventionList);
    this.unselectedColumns = this.getUnselectedColumns(interventionAttributes, allInterventionList);
    this.initFieldsSelected = initFields;
  }

  public saveTableView(): void {
    this.activeModal.close(this.selectedColumns.map(selected => selected.property));
  }

  public resetTableView(): void {
    this.selectedColumns = this.getSelectedColumns(this.initFieldsSelected, this.interventionTableColumnLabels);
    this.unselectedColumns = this.getUnselectedColumns(
      this.selectedColumns.map(el => el.property),
      this.interventionTableColumnLabels
    );
  }

  public cancel(): void {
    this.activeModal.close();
  }

  public moveColumFromUnselectedToSelected(column): void {
    const index = this.unselectedColumns.findIndex(cn => cn.property === column.property);
    this.unselectedColumns.splice(index, 1);
    this.selectedColumns.push({
      property: column.property,
      displayOrder: 1, // to do remove
      label: column.label
    });
  }

  public moveColumnFromSelectedToUnselected(columnName: string): void {
    const index = this.selectedColumns.findIndex(column => column.property === columnName);
    const removedColumns = this.selectedColumns.splice(index, 1);
    this.unselectedColumns.push(removedColumns[0]);
  }

  public getSelectedColumns(interventionAttributes, allInterventionList): [] {
    return interventionAttributes.map(inter => allInterventionList.find(fullInter => fullInter.property === inter));
  }

  private getUnselectedColumns(interventionAttributes, allInterventionList): [] {
    return allInterventionList.filter(inter => !interventionAttributes.includes(inter.property));
  }
}

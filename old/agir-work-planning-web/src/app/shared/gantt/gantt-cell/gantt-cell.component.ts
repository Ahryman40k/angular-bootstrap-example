import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'vdm-gantt-cell',
  templateUrl: './gantt-cell.component.html',
  styleUrls: ['./gantt-cell.component.scss']
})
export class GanttCellComponent {
  public hasDetails = false;
  public hasOptions = false;
  public isDetailsCollapsed = false;
  public isDetailCollapsible = true;
  @Output() public onCollapseClick = new EventEmitter<boolean>(this.isDetailsCollapsed);

  public toggleDetailsCollapse(): void {
    this.onCollapseClick.emit(!this.isDetailsCollapsed);
    this.isDetailsCollapsed = !this.isDetailsCollapsed;
  }
}

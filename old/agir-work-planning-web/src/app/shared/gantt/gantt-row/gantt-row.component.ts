import { AfterContentInit, Component, ContentChild, ContentChildren, Input, QueryList } from '@angular/core';
import { merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../components/base/base.component';
import { GanttCellComponent } from '../gantt-cell/gantt-cell.component';
import { GanttRowDetailComponent } from '../gantt-row-detail/gantt-row-detail.component';
import { GanttRowOptionsComponent } from '../gantt-row-options/gantt-row-options.component';

@Component({
  selector: 'vdm-gantt-row',
  templateUrl: './gantt-row.component.html',
  styleUrls: ['./gantt-row.component.scss']
})
export class GanttRowComponent extends BaseComponent implements AfterContentInit {
  private _isDetailCollapsible: boolean = true;
  public get isDetailCollapsible(): boolean {
    return this._isDetailCollapsible;
  }
  @Input()
  public set isDetailCollapsible(v: boolean) {
    this._isDetailCollapsible = v;
    if (this.cellComponents) {
      this.cellComponents.first.isDetailCollapsible = v;
    }
  }

  private _rowDetail: GanttRowDetailComponent;
  public get rowDetail(): GanttRowDetailComponent {
    return this._rowDetail;
  }
  @ContentChild(GanttRowDetailComponent)
  public set rowDetail(v: GanttRowDetailComponent) {
    this._rowDetail = v;
    if (this.cellComponents) {
      this.cellComponents.first.hasDetails = !!v;
    }
  }

  private _rowOptions: GanttRowOptionsComponent;
  public get rowOptions(): GanttRowOptionsComponent {
    return this._rowOptions;
  }
  @ContentChild(GanttRowOptionsComponent)
  public set rowOptions(v: GanttRowOptionsComponent) {
    this._rowOptions = v;
    if (this.cellComponents) {
      this.cellComponents.last.hasOptions = !!v;
    }
  }

  @ContentChildren(GanttCellComponent)
  public cellComponents: QueryList<GanttCellComponent>;

  public get hasDetails(): boolean {
    return !!this.rowDetail;
  }

  public isDetailsCollapsed = false;

  public ngAfterContentInit(): void {
    this.initCellComponents();
    this.cellComponents.changes.subscribe(() => {
      this.initCellComponents();
    });
  }

  private initCellComponents(): void {
    this.cellComponents.first.onCollapseClick
      .pipe(takeUntil(merge(this.destroy$, this.cellComponents.changes)))
      .subscribe(x => (this.isDetailsCollapsed = x));
    this.cellComponents.forEach(x => {
      x.hasDetails = this.cellComponents.first === x && !!this.rowDetail;
      x.isDetailCollapsible = this.cellComponents.first === x && this.isDetailCollapsible;
      x.hasOptions = this.cellComponents.last === x && !!this.rowOptions;
    });
  }
}

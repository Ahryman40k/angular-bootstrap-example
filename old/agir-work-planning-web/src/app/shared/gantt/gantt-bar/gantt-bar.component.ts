import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'vdm-gantt-bar',
  templateUrl: './gantt-bar.component.html',
  styleUrls: ['./gantt-bar.component.scss']
})
export class GanttBarComponent implements OnChanges, OnInit, AfterContentChecked {
  @Input() public span: number;
  @Input() public startIndex: number;
  @Input() public endIndex: number;
  public width: number;
  public cellWidth = this.elementRef.nativeElement.clientWidth / this.span;
  public spanArray: number[];

  public get ganttBarLeftSpacing(): number {
    return this.startIndex * this.cellWidth;
  }

  constructor(private readonly elementRef: ElementRef, private readonly changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.spanArray = Array(this.span).fill(1);
    this.computeWidth();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.startIndex || changes.endIndex) {
      this.computeWidth();
    }
  }

  public ngAfterContentChecked(): void {
    setTimeout(() => {
      this.cellWidth = this.elementRef.nativeElement.clientWidth / this.span;
      this.computeWidth();
    });
  }

  private computeWidth(): void {
    const width = (this.endIndex - this.startIndex) * this.cellWidth + this.cellWidth;
    if (this.width !== width) {
      this.width = width;
      this.changeDetectorRef.markForCheck();
    }
  }
}

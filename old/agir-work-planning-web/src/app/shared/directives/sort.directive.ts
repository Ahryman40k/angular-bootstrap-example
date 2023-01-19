import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges
} from '@angular/core';

import { SortDirection } from '../forms/sort/sort-utils';

export interface IAppSort {
  direction: SortDirection;
  columnName: string;
}

export enum SortingStatus {
  active = 'active',
  inactive = 'inactive'
}

@Directive({
  selector: '[appSort]'
})
export class SortDirective implements OnChanges {
  private readonly ASC = SortDirection.asc;
  private readonly DESC = SortDirection.desc;
  private readonly prefix = 'sorting-';

  @Input()
  public columnName: string;

  @Input()
  public sorting: SortingStatus;

  @Input()
  public direction: SortDirection;

  @Output()
  public sortChange = new EventEmitter<IAppSort>();

  constructor(private readonly renderer: Renderer2, private readonly el: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.sorting?.currentValue && changes.sorting?.firstChange) {
      this.renderer.addClass(this.el.nativeElement, `clickable`);
    }
    if (this.direction) {
      if (this.sorting === SortingStatus.active) {
        this.renderer.addClass(this.el.nativeElement, `${this.prefix}${this.direction}`);
      } else {
        this.renderer.removeClass(this.el.nativeElement, `${this.prefix}${this.ASC}`);
        this.renderer.removeClass(this.el.nativeElement, `${this.prefix}${this.DESC}`);
        this.direction = undefined;
      }
    }
  }

  @HostListener('click') public onMouseEnter(): void {
    if (!this.sorting) {
      return;
    }
    this.toggle();
    this.sortChange.next({
      direction: this.direction,
      columnName: this.columnName
    });
  }

  private toggle(): void {
    const removeClassName = `${this.prefix}${this.direction}`;
    this.direction = this.direction === this.ASC ? this.DESC : this.ASC;
    const addClassName = `${this.prefix}${this.direction}`;
    this.renderer.removeClass(this.el.nativeElement, removeClassName);
    this.renderer.addClass(this.el.nativeElement, addClassName);
  }
}

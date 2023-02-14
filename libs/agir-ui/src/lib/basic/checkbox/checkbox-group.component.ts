import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Unique ID for each checkbox group counter
 */
let checkboxGroupNextUniqueId = 0;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-checkbox-group, [vdm-checkbox-group]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox-group.component.html',
  styleUrls: ['./checkbox-group.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CheckboxGroupComponent  implements AfterViewInit {
  /**
   * The checkbox group ID. It is set dynamically with an unique ID by default
   */
  @Input() public id: string | null = null;

  @ViewChild('container', { static: false }) private staticContainer!: ElementRef;

  /**
   * The aria-describedby id for web accessibilty
   */
  public ariaDescribedby?: string = undefined;

  private _uniqueId = `vdm-checkbox-group-${++checkboxGroupNextUniqueId}`;

  constructor(private cdr: ChangeDetectorRef) {
    if (!this.id) {
      this.id = this._uniqueId;
    }
  }

  public ngAfterViewInit() {
    this.setAriaDescribedByToDescription();
    this.cdr.detectChanges();
  }

  public onContentChange() {
    this.setAriaDescribedByToDescription();
  }

  /**
   * Set the aria-describedby property to vdm-guiding-text if available
   */
  private setAriaDescribedByToDescription() {
    const children = Array.from(this.staticContainer.nativeElement.children);
    if (children.length === 0) {
      this.showAriaDescribedBy(false);
      return;
    }

    this.showAriaDescribedBy(true);
  }

  private showAriaDescribedBy(value: boolean) {
    this.ariaDescribedby = value ? `${this.id}-ariadescribedby` : undefined;
  }
}


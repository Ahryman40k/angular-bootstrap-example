import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import {NG_VALUE_ACCESSOR} from '@angular/forms';

export type CheckboxAriaState = 'true' | 'false' | 'mixed';

/**
 * Unique ID for each checkbox counter
 */
let checkboxNextUniqueId = 0;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-checkbox, [vdm-checkbox]',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
     {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
})
export class CheckboxComponent implements AfterViewInit, OnInit, OnDestroy {
  /**
   * The checkbox ID. It is set dynamically with an unique ID by default
   */
  @Input() public id: string | null = null;

  /**
   * The aria-label for web accessibility
   */
  @Input('aria-label') public ariaLabel?: string;

  /**
   * Whether the checkbox has a border and is considered as a card.
   */
  @Input() public brandBorder = false;

  /**
   * Whether the checkbox is inline.
   */
  @Input() public inline = false;

  /**
   * The name property of the checkbox
   */
  @Input() public name?: string;

  /**
   * The visible state of the label
   */
  @Input() public hiddenLabel = false;

  /**
   * Emitted object on change event
   */
  @Output() public readonly changed: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Inderminate value of the checkbox whenever
   */
  @Output() public readonly indeterminateChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Reference to the input html element
   */
  @ViewChild('input', { static: false })
  private inputElement!: ElementRef<HTMLInputElement>;

  /**
   * The aria-describedby id for web accessibilty
   */
  public ariaDescribedby?: string;

  /**
   * The aria-labeledby id for web accessibilty
   */
  public ariaLabelledby?: string;

  /**
   * The ID of the input html element
   */
  public inputID = '';

  private _disabled = false;
  private _checked = false;
  private _indeterminate = false;
  private _uniqueId = `vdm-checkbox-${++checkboxNextUniqueId}`;
  private _required = false;

  @HostBinding('class') hostClass = 'vdm-checkbox';
  @HostBinding('class.vdm-checkbox-inline') get isInline() {
    return this.inline;
  }
  @HostBinding('class.vdm-checkbox-checked') get isChecked() {
    return this._checked;
  }
  @HostBinding('class.vdm-checkbox-indeterminate') get isIndeterminated() {
    return this._indeterminate;
  }
  @HostBinding('class.vdm-checkbox-disabled') get isDisable() {
    return this._disabled;
  }
  @HostBinding('class.vdm-checkbox-card') get isBrandBordered() {
    return this.brandBorder;
  }
  @HostBinding('class.vdm-checkbox-required') get isRequired() {
    return this._required;
  }
  @HostBinding('class.vdm-checkbox-hidden-label') get isHiddenLable() {
    return this.hiddenLabel;
  }

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
    private focusMonitor: FocusMonitor
  ) {
    if (!this.id) {
      this.id = this._uniqueId;
    }
  }

  /**
   * Whether the checkbox is checked.  Default value : false
   */
  @Input()
  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    if (value !== this.checked) {
      this._checked = value;
      this.cdr.markForCheck();
    }
  }
  /**
   * Whether the checkbox is disabled. Default value : false
   */
  @Input()
  get disabled() {
    return this._disabled;
  }

  set disabled(value: boolean) {
    // In the case the value is string or boolean
    const newValue = value;

    if (newValue !== this.disabled) {
      this._disabled = newValue;
      this.cdr.markForCheck();
    }
  }
  /**
   * Whether the checkbox is required.  Default value : false
   */
  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = value;
  }

  /**
   * Whether the checkbox is indeterminate.  Default value : false
   */
  @Input()
  get indeterminate(): boolean {
    return this._indeterminate;
  }

  set indeterminate(value: boolean) {
    const newValue = value;

    if (newValue !== this._indeterminate) {
      this._indeterminate = newValue;
      this.indeterminateChange.emit(this._indeterminate);
    }
    // Update the inderteminate value of the html element object
    this.syncIndeterminate(this._indeterminate);
  }

  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  public ngOnInit() {
    // Set all unique ids for the html elements
    this.inputID = `${this.id}-input`;
    this.ariaLabelledby = `${this.id}-arialabelledby`;
  }

  public ngAfterViewInit() {
    this.focusMonitor.monitor(this.elementRef, true).subscribe((focusOrigin) => {
      if (!focusOrigin) {
        // When a focused element becomes disabled, the browser *immediately* fires a blur event.
        // Angular does not expect events to be raised during change detection, so any state change
        // (such as a form control's 'ng-touched') will cause a changed-after-checked error.
        // See https://github.com/angular/angular/issues/17793. To work around this, we defer
        // telling the form control it has been touched until the next tick.
        Promise.resolve()
          .then(() => {
            this.onTouch();
            this.cdr.markForCheck();
          })
          .catch(() => undefined);
      }
    });

    this.setAriaDescribedByToDescription();
    this.syncIndeterminate(this.indeterminate);
  }

  public ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.elementRef);
  }

  /**
   * Implement ControlValueAccessor
   */
  public writeValue(value: any) {
    this.checked = !!value;
  }

  /**
   * Implement ControlValueAccessor
   */
  public registerOnChange(fn: (value: any) => void) {
    this.onModelChange = fn;
  }

  /**
   * Implement ControlValueAccessor
   */
  public registerOnTouched(fn: any) {
    this.onTouch = fn;
  }

  /**
   * Implement ControlValueAccessor
   */
  public setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  public focus(origin?: FocusOrigin, options?: FocusOptions): void {
    if (origin) {
      this.focusMonitor.focusVia(this.inputElement, origin, options);
    } else {
      this.inputElement.nativeElement.focus(options);
    }
  }

  /**
   * Whenever there is change on the input html element
   */
  public onInteractionEvent(event: Event) {
    // We always have to stop propagation on the change event.
    // Otherwise the change event, from the input element, will bubble up and
    // emit its event object to the `change` output.
    event.stopPropagation();
  }

  /**
   * Whenever there is click event triggered on the checkbox
   */
  public onInputClick(event: Event) {
    event.stopPropagation();
    this.toggle();
    this.emitChangeEvent();
  }

  /**
   * Get the value for the aria-checked property (web accessibility)
   */
  public getAriaState(): CheckboxAriaState {
    if (this.checked) {
      return 'true';
    }

    return this.indeterminate ? 'mixed' : 'false';
  }

  /**
   * Emit new values whenever the checkbox object has change.
   */
  private emitChangeEvent() {
    this.onModelChange(this.checked);
    this.changed.emit(this.checked);
    this.syncChecked(this.checked);
  }

  /**
   * Set the checked property on the input html element
   */
  private syncChecked(value: boolean) {
    if (this.inputElement) {
      this.inputElement.nativeElement.checked = value;
    }
  }

  /**
   * Set the indeterminate property on the input html element
   */
  private syncIndeterminate(value: boolean) {
    if (this.inputElement) {
      this.inputElement.nativeElement.indeterminate = value;
    }
  }

  /**
   * Set the aria-describedby property to vdm-checkbox-description
   */
  private setAriaDescribedByToDescription() {
    const childNodes = Array.from(this.nativeElement.childNodes);
    const labelNode = childNodes.find((x) => {
      return x.nodeName === 'LABEL';
    });
    if (labelNode) {
      const labelChildNodes = Array.from(labelNode.childNodes);
      const descriptionNode = labelChildNodes.find((x) => {
        return x.nodeName === 'vdm-CHECKBOX-DESCRIPTION';
      });

      if (descriptionNode) {
        this.ariaDescribedby = `${this.id}-ariadescribedby`;
        (descriptionNode as HTMLElement).setAttribute('id', this.ariaDescribedby);
      } else {
        this.ariaDescribedby = undefined;
      }

      this.cdr.detectChanges();
    }
  }

  /**
   * Set checked value
   */
  private toggle() {
    this.checked = !this.checked;
  }

  private onModelChange: (value: any) => void = () => undefined;
  private onTouch: () => void = () => undefined;
}

@Directive({
  standalone: true,
  selector:
    // eslint-disable-next-line @angular-eslint/directive-selector
    'vdm-checkbox-description, [vdm-checkbox-description],  [vdmCheckboxDescription]',
})
export class CheckBoxDescriptionDirective {
  @HostBinding('class.vdm-checkbox-description') hostClass = true;
}

import { Component, ElementRef, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { FormComponent } from '../form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SliderComponent),
  multi: true
};

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  providers: [valueAccessorProvider]
})
export class SliderComponent extends FormComponent<number> implements OnInit {
  @Input() public min: number;
  @Input() public max: number;
  @Input() public step: number;
  @ViewChild('fill') public fill: ElementRef;
  @ViewChild('input') public input: ElementRef<HTMLInputElement>;

  public ngOnInit(): void {
    this.updateFillWidth(this.value);
  }

  public onInput(event: Event): void {
    this.value = +(event.target as HTMLInputElement).value;
    this.updateFillWidth(this.value);
  }

  public updateFillWidth(value: number): void {
    const delta: number = this.max - this.min;
    this.fill.nativeElement.style.width = this.value ? `${((value - this.min) / delta) * 100}%` : '50%';
  }

  public setDisabledState?(isDisabled: boolean): void {
    super.setDisabledState(isDisabled);
    if (isDisabled) {
      this.onChange(undefined);
      this.updateFillWidth(0);
    } else {
      const value = +this.input.nativeElement.value;
      this.onChange(value);
      this.updateFillWidth(value);
    }
  }

  public writeValue(value: number): void {
    super.writeValue(value);
    this.updateFillWidth(value);
  }
}

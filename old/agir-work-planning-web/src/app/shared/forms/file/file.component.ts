import { Component, ElementRef, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent } from 'rxjs';

import { FormComponent } from '../form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FileComponent),
  multi: true
};

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
  providers: [valueAccessorProvider]
})
export class FileComponent extends FormComponent<File> {
  @Input() public placeholder: string;
  @Input() public accept: string;

  private selectingFile = false;

  constructor(private readonly elementRef: ElementRef) {
    super();
  }

  public chooseFile(): void {
    this.selectingFile = true;
    const input = this.elementRef.nativeElement.querySelector('input.form-control');
    const sub = fromEvent(input, 'focus').subscribe(() => {
      this.selectingFile = false;
      sub.unsubscribe();
    });
  }

  public onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const [file] = (target.files as any) as File[];
      this.value = file;
    }
  }

  /**
   * Called when the input checkbox is blurred.
   */
  public insideBlur(): void {
    setTimeout(() => {
      if (!this.selectingFile && !this.elementRef.nativeElement.querySelector(':focus')) {
        this.touched();
      }
    }, 100);
  }
}

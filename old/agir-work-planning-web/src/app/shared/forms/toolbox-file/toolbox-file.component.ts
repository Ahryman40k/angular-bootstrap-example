import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { FormComponent } from '../form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ToolboxFileComponent),
  multi: true
};

@Component({
  selector: 'app-toolbox-file',
  templateUrl: './toolbox-file.component.html',
  styleUrls: ['./toolbox-file.component.scss'],
  providers: [valueAccessorProvider]
})
export class ToolboxFileComponent extends FormComponent<File> {
  @Input() public defaultValue: string;
  @Input() public buttonSizeClass = 'btn-sm';
  @Input() public selectorButtonClass = '';
  @Input() public isLabelStatic = false;
  @Input() public invalidBorderStyle = '';
  @Input() public uniqueId = 0;

  public get fileLabel(): string {
    return this.isLabelStatic
      ? this.defaultValue
      : this.value?.name || this.defaultValue || 'ou déposer votre fichier ici';
  }

  constructor() {
    super();
  }

  public onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const [file] = (target.files as any) as File[];
      this.value = file;
    }
    this.touched();
  }

  public onFileDragged(event: Event): void {
    this.value = event[0];
    this.touched();
  }
}

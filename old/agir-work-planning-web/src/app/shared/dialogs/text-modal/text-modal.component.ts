import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-text-modal',
  templateUrl: './text-modal.component.html'
})
export class TextModalComponent {
  @Input() public modalTitle: string;
  @Input() public textFieldLabel: string;
  @Input() public saveButtonText: string;
  @Input() public formControl: FormControl;

  constructor(private readonly modal: NgbActiveModal) {}

  public save(): void {
    this.formControl.markAsTouched();
    if (this.formControl.invalid) {
      return;
    }
    this.modal.close(this.formControl.value);
  }

  public cancel(): void {
    this.modal.close();
  }
}

import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IErrorDictionary } from '../../errors/error.service';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html'
})
export class ErrorModalComponent {
  @Input() public title: string;
  @Input() public errors: IErrorDictionary[];

  constructor(private readonly modal: NgbActiveModal) {}

  public cancel(): void {
    this.modal.close();
  }
}

import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfirmationModalCloseType } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-alert-modal',
  templateUrl: './alert-modal.component.html'
})
export class AlertModalComponent {
  @Input() public modalTitle: string;
  @Input() public type: string;
  @Input() public alertTitle: string;
  @Input() public alertMessage: string;
  @Input() public buttonLabel: string;
  @Input() public confirmLabel: string;
  @Input() public confirmButtonClass: string;
  @Input() public iconName: string = 'icon-warning';

  constructor(public activeModal: NgbActiveModal) {}

  public confirm(): void {
    this.activeModal.close(ConfirmationModalCloseType.confirmed);
  }
}

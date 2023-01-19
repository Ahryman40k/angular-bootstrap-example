import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { WindowService } from '../../services/window.service';

export enum ConfirmationModalCloseType {
  confirmed = 'confirmed',
  canceled = 'canceled'
}

export const BUTTON_LABEL_CONFIRM = 'Confirmer';
export const BUTTON_LABEL_SUPPRESS = 'Supprimer';
@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  providers: [WindowService]
})
export class ConfirmationModalComponent {
  public title: string;
  public message: string;
  public confirmLabel = BUTTON_LABEL_CONFIRM;
  public buttonType = 'btn-primary';

  constructor(private readonly activeModal: NgbActiveModal) {}

  public cancel(): void {
    this.activeModal.close(ConfirmationModalCloseType.canceled);
  }

  public confirm(): void {
    this.activeModal.close(ConfirmationModalCloseType.confirmed);
  }
}

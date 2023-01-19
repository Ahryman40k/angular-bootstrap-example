import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DialogType } from '../dialog-type';

@Component({
  selector: 'app-basic-modal',
  templateUrl: './basic-modal.component.html'
})
export class BasicModalComponent {
  public title: string;
  public content: string;
  public type: DialogType;
  public buttonAccept: string;
  public buttonReject: string;

  constructor(private readonly activeModal: NgbActiveModal) {}

  public accept(): void {
    this.activeModal.close(true);
  }

  public reject(): void {
    this.activeModal.close(false);
  }
}

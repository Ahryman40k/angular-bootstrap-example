import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-layout-modal',
  templateUrl: './layout-modal.component.html',
  styleUrls: ['./layout-modal.component.scss']
})
export class LayoutModalComponent {
  @Input() public modalTitle: string;
  @Input() public showCloseButton = true;
  @Input() public showFooter = true;
  @Input() public scrollable = true;

  constructor(public activeModal: NgbActiveModal) {}

  public reject(): void {
    this.activeModal.close();
  }
}

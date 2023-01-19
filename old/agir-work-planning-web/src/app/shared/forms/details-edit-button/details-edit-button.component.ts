import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-details-edit-button',
  templateUrl: './details-edit-button.component.html',
  styleUrls: ['./details-edit-button.component.scss']
})
export class DetailsEditButtonComponent {
  @Input() public disabled: boolean;
  @Output() public onEdit = new EventEmitter();

  public edit(): void {
    this.onEdit.emit();
  }
}

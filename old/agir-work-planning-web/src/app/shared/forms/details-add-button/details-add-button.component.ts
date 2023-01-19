import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-details-add-button',
  templateUrl: './details-add-button.component.html',
  styleUrls: ['./details-add-button.component.scss']
})
export class DetailsAddButtonComponent {
  @Input() public disabled: boolean;
  @Input() public ngClass: string;
  @Output() public onAdd = new EventEmitter();

  public add(): void {
    this.onAdd.emit();
  }
}

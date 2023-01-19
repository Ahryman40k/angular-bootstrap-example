import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-list-item-details-field',
  templateUrl: './list-item-details-field.component.html',
  styleUrls: ['./list-item-details-field.component.scss']
})
export class ListItemDetailsFieldComponent {
  @Input() public titleClass = 'field-title';
}

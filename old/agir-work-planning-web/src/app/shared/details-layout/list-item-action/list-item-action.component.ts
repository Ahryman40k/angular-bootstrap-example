import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-list-item-action',
  templateUrl: './list-item-action.component.html',
  styleUrls: ['./list-item-action.component.scss']
})
export class ListItemActionComponent {
  @Output() public action = new EventEmitter();
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-result',
  templateUrl: './no-result.component.html',
  styleUrls: ['./no-result.component.scss']
})
export class NoResultComponent {
  @Input() public message: string;
  @Input() public showEmtyIcon = false;
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-result-placeholder',
  templateUrl: './no-result-placeholder.component.html',
  styleUrls: ['./no-result-placeholder.component.scss']
})
export class NoResultPlaceholderComponent {
  @Input() public icon: string;
}

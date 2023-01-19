import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-radio-input',
  templateUrl: './radio-input.component.html',
  styleUrls: ['./radio-input.component.scss']
})
export class RadioInputComponent {
  @Input() public checked: boolean;
  @Input() public id: string;
  @Input() public label: string;
}

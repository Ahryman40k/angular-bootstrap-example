import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-circle',
  templateUrl: 'progress-circle.component.html',
  styleUrls: ['progress-circle.component.scss']
})
export class ProgressCircleComponent {
  @Input() public percentage = 0;
}

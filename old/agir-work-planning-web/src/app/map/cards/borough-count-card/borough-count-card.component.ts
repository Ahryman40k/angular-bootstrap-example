import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-borough-count-card',
  templateUrl: './borough-count-card.component.html',
  styleUrls: ['./borough-count-card.component.scss']
})
export class BoroughCountCardComponent {
  @Input() public projectCount: number;
  @Input() public interventionCount: number;
  @Input() public boroughName: string;
}

import { Component, Input } from '@angular/core';
import { IEnrichedObjective } from '@villemontreal/agir-work-planning-lib/dist/src';

@Component({
  selector: 'app-objective-preview',
  templateUrl: './objective-preview.component.html',
  styleUrls: ['./objective-preview.component.scss']
})
export class ObjectivePreviewComponent {
  @Input() public objective: IEnrichedObjective;
  @Input() public condition: boolean;
}

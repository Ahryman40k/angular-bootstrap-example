import { Component, Input } from '@angular/core';
import { IEnrichedIntervention, IEnrichedProject, IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ILabelProject } from '../../../map/panel/bottom-panel/bottom-panel.component';

@Component({
  selector: 'app-road-section-activity',
  templateUrl: './road-section-activity.component.html',
  styleUrls: ['./road-section-activity.component.scss']
})
export class RoadSectionActivityComponent {
  @Input() public labelProjects: ILabelProject<IEnrichedProject | IRtuProject>[];
  @Input() public years: number[];
  @Input() public interventions: IEnrichedIntervention[];
}

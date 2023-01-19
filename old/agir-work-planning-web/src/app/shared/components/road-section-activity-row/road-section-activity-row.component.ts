import { Component, Input } from '@angular/core';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IRtuProject,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { range } from 'lodash';

import { ILabelProject } from '../../../map/panel/bottom-panel/bottom-panel.component';
import { ObjectTypeService } from '../../services/object-type.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { BaseRoadSectionActivityComponent } from '../road-section-activity/base-road-section-activity';

@Component({
  selector: 'app-road-section-activity-row',
  templateUrl: './road-section-activity-row.component.html',
  styleUrls: ['./road-section-activity-row.component.scss']
})
export class RoadSectionActivityRowComponent extends BaseRoadSectionActivityComponent {
  @Input() public labelProject: ILabelProject<IEnrichedProject | IRtuProject>;
  @Input() public years: number[];
  @Input() public intervention: IEnrichedIntervention;

  public TaxonomyGroup = TaxonomyGroup;
  public ProjectType = ProjectType;

  constructor(objectTypeService: ObjectTypeService, taxonomiesService: TaxonomiesService) {
    super(objectTypeService, taxonomiesService);
  }

  public get projectYears(): number[] {
    if (!this.labelProject) {
      return [];
    }
    return range(this.startYear, this.endYear + 1);
  }

  public get labelYear(): number {
    return this.years.find(year => year >= this.startYear && year <= this.endYear);
  }
}

import { Component, Input, OnInit } from '@angular/core';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IRtuProject,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { range } from 'lodash';

import { ILabelProject } from '../../../map/panel/bottom-panel/bottom-panel.component';
import { ObjectTypeService } from '../../services/object-type.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { Utils } from '../../utils/utils';
import {
  BaseRoadSectionActivityComponent,
  LabelProjectType
} from '../road-section-activity/base-road-section-activity';

const ALLOWED_CHARACTER_LENGTH_BY_CELL = 5;

@Component({
  selector: 'app-road-section-activity-status',
  templateUrl: './road-section-activity-status.component.html',
  styleUrls: ['./road-section-activity-status.component.scss']
})
export class RoadSectionActivityStatusComponent extends BaseRoadSectionActivityComponent implements OnInit {
  @Input() public activeYear: number;
  @Input() public years: number[];
  @Input() public showLabel = false;
  @Input() public labelProject: ILabelProject<IEnrichedProject | IRtuProject>;
  @Input() public intervention: IEnrichedIntervention;

  public TaxonomyGroup = TaxonomyGroup;

  public get isStart(): boolean {
    return this.startYear === this.activeYear;
  }

  public get isEnd(): boolean {
    return this.endYear === this.activeYear;
  }

  public get isInterventionCurrentYear(): boolean {
    return this.intervention.planificationYear === this.activeYear;
  }

  public get isLastQuarter(): boolean {
    if (this.labelProjectType !== LabelProjectType.rtuProject) {
      return false;
    }
    const rtuProject = this.labelProject.project as IRtuProject;
    return Utils.getYearQuarter(new Date(rtuProject.dateStart)) === 4;
  }

  public get rtuProjectStatusLabel(): string {
    return this.rtuStatus?.find(t => t.code === this.rtuProject.status).label.fr;
  }

  public get marginClass(): any {
    const c = {};
    let yearQuarter: number;
    if (this.isStart) {
      yearQuarter = Utils.getYearQuarter(new Date(this.rtuProject.dateStart));
      c[`margin-left-${yearQuarter}`] = true;
    }
    if (this.isEnd) {
      yearQuarter = Utils.getYearQuarter(new Date(this.rtuProject.dateEnd));
      c[`margin-right-${yearQuarter}`] = true;
    }
    return c;
  }

  public get isToolTip(): boolean {
    if (!this.rtuStatus?.length) {
      return true;
    }
    return this.showTooltip();
  }

  constructor(objectTypeService: ObjectTypeService, taxonomiesService: TaxonomiesService) {
    super(objectTypeService, taxonomiesService);
  }

  /**
   * Returns wether or not we should show a tooltip on the badge, depending on the label's length and it's space to show it
   * Each quarter of a year can contain 5 characters
   * So we have to check how many quarters is the project in, to then return a boolean if we have to show the tooltip or not
   *
   * @private
   * @return {*}  {boolean}
   * @memberof RoadSectionActivityStatusComponent
   */
  private showTooltip(): boolean {
    const project = this.rtuProject;
    const startDate = new Date(project.dateStart);
    const endDate = new Date(project.dateEnd);

    const startQuarter = Utils.getYearQuarter(startDate);
    const endQuarter = Utils.getYearQuarter(endDate);

    const projectYears = range(this.startYear, this.endYear + 1);
    const projectYearsShown = this.years.filter(y => projectYears.includes(y));

    if (!this.years.includes(this.startYear) && !this.years.includes(this.endYear)) {
      return false;
    }

    if (!projectYearsShown.length) {
      return true;
    }

    // If the project is on 3 different years, it's well long enough to show the status
    if (projectYearsShown.length >= 3) {
      return false;
    }

    let quarterDiff: number;
    if (projectYearsShown.length === 2) {
      if (!projectYearsShown.includes(this.startYear) || !projectYearsShown.includes(this.endYear)) {
        return false;
      }
      // We do +5 because each year has 4 quarters and the end quarter must be in the 2nd year
      // So we get the quarter +4 (1 year)
      // And +1 to get it included in the range
      if (projectYearsShown.includes(this.startYear)) {
        if (projectYearsShown.includes(this.endYear)) {
          quarterDiff = range(startQuarter, endQuarter + 5).length;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else if (projectYearsShown.length === 1) {
      if (!projectYearsShown.includes(this.startYear) && !projectYearsShown.includes(this.endYear)) {
        return false;
      }
      if (projectYearsShown.includes(this.startYear)) {
        if (projectYearsShown.includes(this.endYear)) {
          quarterDiff = range(startQuarter, endQuarter + 1).length;
        }
        // 5 = 4 (quarters in a year) + 1 (to include it in the range)
        quarterDiff = range(startQuarter, 5).length;
      } else {
        quarterDiff = endQuarter;
      }
    }

    return this.rtuProjectStatusLabel.length > ALLOWED_CHARACTER_LENGTH_BY_CELL * quarterDiff;
  }
}

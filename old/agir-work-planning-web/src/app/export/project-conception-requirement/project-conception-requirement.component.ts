import { Component, Inject } from '@angular/core';
import { IRequirement, ISubmissionRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponentPortal } from 'src/app/shared/components/portals/base-column-portal';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';
@Component({
  selector: 'app-project-conception-requirement',
  templateUrl: './project-conception-requirement.component.html',
  styleUrls: ['./project-conception-requirement.component.scss']
})
export class ProjectConceptionRequirementComponent extends BaseComponentPortal<any> {
  constructor(@Inject(COLUMN_DATA) public data: any) {
    super(data);
  }
  public get requirementConceptions(): ISubmissionRequirement[] {
    return this.data.augmented.requirementConceptions;
  }

  public get requirementPlanifications(): IRequirement[] {
    return this.data.augmented.requirementPlanifications;
  }
}

import { Component, Inject } from '@angular/core';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponentPortal } from 'src/app/shared/components/portals/base-column-portal';
import { ProjectService } from 'src/app/shared/services/project.service';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';

@Component({
  selector: 'app-project-submission-number',
  templateUrl: './project-submission-number.component.html',
  styleUrls: ['./project-submission-number.component.css']
})
export class ProjectSubmissionNumberComponent extends BaseComponentPortal<any> {
  constructor(private projectService: ProjectService, @Inject(COLUMN_DATA) public data: any) {
    super(data);
  }
  public get submissionNumber(): string {
    try {
      if (this.data.submissionNumber) {
        return this.data.submissionNumber;
      }
      return this.data.drmNumber ? this.data.drmNumber + '00' : '';
    } catch (err) {
      return '';
    }
  }
}

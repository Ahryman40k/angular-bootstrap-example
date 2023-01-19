import { Component, Inject } from '@angular/core';
import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponentPortal } from 'src/app/shared/components/portals/base-column-portal';
import { ProjectService } from 'src/app/shared/services/project.service';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';

@Component({
  selector: 'app-project-link',
  templateUrl: './project-link.component.html',
  styleUrls: ['./project-link.component.css']
})
export class ProjectLinkComponent extends BaseComponentPortal<IEnrichedIntervention> {
  constructor(private projectService: ProjectService, @Inject(COLUMN_DATA) public data: IEnrichedIntervention) {
    super(data);
  }
  public get href() {
    try {
      return this.projectService.getProjectLink(this.data.project);
    } catch (err) {
      return '';
    }
  }
}

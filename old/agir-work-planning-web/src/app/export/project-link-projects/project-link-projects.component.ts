import { Component, Inject } from '@angular/core';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponentPortal } from 'src/app/shared/components/portals/base-column-portal';
import { ProjectService } from 'src/app/shared/services/project.service';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';

@Component({
  selector: 'app-project-link-projects',
  templateUrl: './project-link-projects.component.html',
  styleUrls: ['./project-link-projects.component.css']
})
export class ProjectLinkProjectsComponent extends BaseComponentPortal<IEnrichedProject> {
  constructor(private projectService: ProjectService, @Inject(COLUMN_DATA) public data: IEnrichedProject) {
    super(data);
  }
  public get projectLink(): string {
    return this.projectService.getProjectLink(this.data);
  }
}

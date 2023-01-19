import { Component } from '@angular/core';
import { IEnrichedProject, ProjectType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { ProjectService } from 'src/app/shared/services/project.service';

import { BasePopupComponent } from '../base-popup.component';

@Component({
  selector: 'app-project-popup',
  templateUrl: 'project-popup.component.html'
})
export class ProjectPopupComponent extends BasePopupComponent {
  public project: IEnrichedProject;

  constructor(private readonly projectService: ProjectService) {
    super();
  }

  public async init(projectId: string, projectType: string): Promise<void> {
    this.project =
      projectType === ProjectType.nonIntegrated
        ? await this.projectService.getFullProject(projectId)
        : await this.projectService.getProjectWithOutIntervention(projectId);
    this.initializedSubject.next();
  }
}

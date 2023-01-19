import { Component } from '@angular/core';
import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { RtuProjectService } from '../../../shared/services/rtu-project.service';
import { BasePopupComponent } from '../base-popup.component';

@Component({
  selector: 'app-rtu-project-popup',
  templateUrl: './rtu-project-popup.component.html'
})
export class RtuProjectPopupComponent extends BasePopupComponent {
  public rtuProject: IRtuProject;

  constructor(private readonly rtuProjectService: RtuProjectService) {
    super();
  }

  public async init(rtuProjectId: string): Promise<void> {
    this.rtuProject = await this.rtuProjectService.getRtuProject(rtuProjectId);
    this.initializedSubject.next();
  }
}

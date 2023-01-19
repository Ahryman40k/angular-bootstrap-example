import { Pipe, PipeTransform } from '@angular/core';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ProjectService } from '../services/project.service';

@Pipe({
  name: 'appProjectColor'
})
export class ProjectColorPipe implements PipeTransform {
  constructor(private readonly projectService: ProjectService) {}

  public transform(value: IEnrichedProject): string {
    return this.projectService.getProjectColor(value);
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';

@Pipe({
  name: 'appDrmSubmissionNumberFormat'
})
export class DrmSubmissionNumberFormatPipe implements PipeTransform {
  /**
   * Transform a project submissionNumber or drmNumber like 123456 to #123456
   * @param project
   * @returns string
   */
  public transform(project: IEnrichedProject): string {
    if (!project) {
      return undefined;
    }
    if (project.submissionNumber) {
      return `#${project.submissionNumber}`;
    }
    if (project.drmNumber) {
      return `#${project.drmNumber}00`;
    }
    return undefined;
  }
}

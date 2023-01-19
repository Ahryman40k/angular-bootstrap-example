import { IEnrichedProject, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { BaseSanitizer } from './baseSanitizer';
import { interventionSanitizer } from './interventionSanitizer';

class ProjectSanitizer extends BaseSanitizer<IEnrichedProject> {
  private readonly readPermissionList = [
    { permission: Permission.PROJECT_BUDGET_READ, property: 'globalBudget' },
    { permission: Permission.PROJECT_COMMENT_READ, property: 'comments' },
    { permission: Permission.PROJECT_DECISION_READ, property: 'decisions' },
    { permission: Permission.PROJECT_DOCUMENT_READ, property: 'documents' },
    { permission: Permission.PROJECT_INTERVENTIONS_READ, property: 'interventionIds' },
    { permission: Permission.PROJECT_INTERVENTIONS_READ, property: 'interventions' },
    { permission: Permission.PROJECT_ZONE_READ, property: 'geometry' }
  ];

  public sanitize(project: IEnrichedProject): IEnrichedProject {
    this.filterPropertiesByPermission(project, this.readPermissionList);
    this.filterPrivateComments(project);
    if (project.interventions?.length) {
      interventionSanitizer.sanitizeArray(project.interventions);
    }
    project.annualDistribution?.annualPeriods?.forEach(ap => {
      if (ap.programBookId) {
        ap.programBookId = ap.programBookId.toString();
      }
    });
    return project;
  }

  private filterPrivateComments(project: IEnrichedProject): void {
    if (!project.comments || this.user.hasPermission(Permission.PROJECT_COMMENT_READ_PRIVATE)) {
      return;
    }
    project.comments = project.comments.filter(comment => !!comment.isPublic);
  }
}
export const projectSanitizer = new ProjectSanitizer();

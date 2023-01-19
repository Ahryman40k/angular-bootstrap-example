import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { PermissionGuard } from '../shared/guards/permission.guard';
import { SubmissionWindowResolver } from '../shared/resolvers/submission-window-resolver';
import { InterventionAnnualPeriodsComponent } from './annual-periods/intervention-annual-periods/intervention-annual-periods.component';
import { ProjectAnnualPeriodsComponent } from './annual-periods/project-annual-periods/project-annual-periods.component';
import { AssetDetailsComponent } from './asset-details/asset-details.component';
import { InterventionCommentsComponent } from './comments/intervention-comments/intervention-comments.component';
import { ProjectCommentsComponent } from './comments/project-comments/project-comments.component';
import { DocumentsInterventionComponent } from './documents/intervention/documents.intervention.component';
import { DocumentsProjectComponent } from './documents/project/documents.project.component';
import { InterventionConceptionDataComponent } from './intervention-conception-data/intervention-conception-data.component';
import { InterventionDecisionsComponent } from './intervention-decisions/intervention-decisions.component';
import { InterventionDetailsComponent } from './intervention-details/intervention-details.component';
import { InterventionMoreInformationComponent } from './intervention-more-information/intervention-more-information.component';
import { InterventionRequirementComponent } from './intervention-requirement/intervention-requirement.component';
import { OpportunityNoticeAssetsWithInterventionComponent } from './opportunity-notices/opportunity-notice-assets/opportunity-notice-assets-with-intervention.component';
import { OpportunityNoticeAssetsWithoutInterventionComponent } from './opportunity-notices/opportunity-notice-assets/opportunity-notice-assets-without-intervention.component';
import { OpportunityNoticesCreateComponent } from './opportunity-notices/opportunity-notices-create/opportunity-notices-create.component';
import { OpportunityNoticesResponseComponent } from './opportunity-notices/opportunity-notices-response/opportunity-notices-response.component';
import { OpportunityNoticesComponent } from './opportunity-notices/opportunity-notices/opportunity-notices.component';
import { ProjectDecisionsComponent } from './project-decisions/project-decisions.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectMoreInformationComponent } from './project-more-information/project-more-information.component';
import { ProjectRequirementComponent } from './project-requirement/project-requirement.component';
import { RtuProjectDetailsComponent } from './rtu-project-details/rtu-project-details.component';
import { SubmissionContentComponent } from './submission-window/submission-content/submission-content.component';
import { SubmissionDocumentsComponent } from './submission-window/submission-documents/submission-documents.component';
import { SubmissionHistoryComponent } from './submission-window/submission-history/submission-history.component';
import { SubmissionProjectsComponent } from './submission-window/submission-projects/submission-projects.component';
import { SubmissionRequirementsComponent } from './submission-window/submission-requirements/submission-requirements.component';
import { WindowContentInterventionsComponent } from './window-content-interventions/window-content-interventions.component';
import { WindowContentProjectsComponent } from './window-content-projects/window-content-projects.component';

/**
 * Reminder: path order is important.
 * The path ':id' must be after 'filter' otherwise 'filter' will not be accessible.
 */
const routes: Routes = [
  { path: 'projects', loadChildren: '../projects/projects.module#ProjectsModule' },
  {
    canActivate: [PermissionGuard],
    path: 'projects/:id',
    component: WindowContentProjectsComponent,
    children: [
      {
        canActivate: [PermissionGuard],
        path: 'requirements',
        component: ProjectRequirementComponent,
        data: { permission: Permission.REQUIREMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'opportunity-notices/overview',
        component: OpportunityNoticesComponent,
        data: { permission: Permission.OPPORTUNITY_NOTICE_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'opportunity-notices',
        component: OpportunityNoticesCreateComponent,
        data: { permission: Permission.OPPORTUNITY_NOTICE_READ },
        children: [
          { path: 'assets-with-intervention', component: OpportunityNoticeAssetsWithInterventionComponent },
          { path: 'assets-without-intervention', component: OpportunityNoticeAssetsWithoutInterventionComponent },
          {
            path: '',
            redirectTo: 'assets-without-intervention',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'overview',
        component: ProjectDetailsComponent
      },
      {
        canActivate: [PermissionGuard],
        path: 'decisions',
        component: ProjectDecisionsComponent,
        data: { permission: Permission.PROJECT_DECISION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'documents',
        component: DocumentsProjectComponent,
        data: { permission: Permission.PROJECT_DOCUMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'comments',
        component: ProjectCommentsComponent,
        data: { permission: Permission.PROJECT_COMMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'annual-periods',
        component: ProjectAnnualPeriodsComponent,
        data: { permission: Permission.PROJECT_ANNUAL_DISTRIBUTION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'more-information',
        component: ProjectMoreInformationComponent,
        data: { permission: Permission.PROJECT_MORE_INFORMATION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/overview',
        component: InterventionDetailsComponent,
        data: { permission: Permission.INTERVENTION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/requirements',
        component: InterventionRequirementComponent,
        data: { permission: Permission.REQUIREMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/decisions',
        component: InterventionDecisionsComponent,
        data: { permission: Permission.INTERVENTION_DECISION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/documents',
        component: DocumentsInterventionComponent,
        data: { permission: Permission.INTERVENTION_DOCUMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/comments',
        component: InterventionCommentsComponent,
        data: { permission: Permission.INTERVENTION_COMMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/annual-periods',
        component: InterventionAnnualPeriodsComponent,
        data: { permission: Permission.PROJECT_ANNUAL_DISTRIBUTION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/more-information',
        component: InterventionMoreInformationComponent,
        data: { permission: Permission.INTERVENTION_MORE_INFORMATION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'interventions/:interventionId/conception-data',
        component: InterventionConceptionDataComponent,
        data: { permission: Permission.INTERVENTION_MORE_INFORMATION_READ }
      }
    ],
    data: { permission: Permission.PROJECT_READ }
  },
  {
    path: 'submissions/:id',
    canActivate: [PermissionGuard],
    data: { permission: Permission.SUBMISSION_READ },
    component: SubmissionContentComponent,
    resolve: {
      submission: SubmissionWindowResolver
    },
    children: [
      {
        path: 'projects',
        component: SubmissionProjectsComponent
      },
      {
        path: 'submission-requirements',
        component: SubmissionRequirementsComponent
      },
      {
        path: 'history',
        component: SubmissionHistoryComponent
      },
      {
        path: 'documents',
        component: SubmissionDocumentsComponent,
        data: { permission: Permission.SUBMISSION_DOCUMENT_READ }
      }
    ]
  },
  {
    canActivate: [PermissionGuard],
    path: 'assets/:type/:id/overview',
    component: AssetDetailsComponent,
    data: { permission: Permission.ASSET_READ }
  },
  {
    canActivate: [PermissionGuard],
    path: 'rtuProjects/:id',
    component: RtuProjectDetailsComponent,
    data: { permission: Permission.RTU_PROJECT_READ }
  },
  { path: 'interventions', loadChildren: '../interventions/interventions.module#InterventionsModule' },
  {
    canActivate: [PermissionGuard],
    path: 'interventions/:id',
    component: WindowContentInterventionsComponent,
    children: [
      {
        canActivate: [PermissionGuard],
        path: 'requirements',
        component: InterventionRequirementComponent,
        data: { permission: Permission.REQUIREMENT_READ }
      },
      {
        path: 'overview',
        component: InterventionDetailsComponent
      },
      {
        canActivate: [PermissionGuard],
        path: 'decisions',
        component: InterventionDecisionsComponent,
        data: { permission: Permission.INTERVENTION_DECISION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'documents',
        component: DocumentsInterventionComponent,
        data: { permission: Permission.INTERVENTION_DOCUMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'comments',
        component: InterventionCommentsComponent,
        data: { permission: Permission.INTERVENTION_COMMENT_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'annual-periods',
        component: InterventionAnnualPeriodsComponent,
        data: { permission: Permission.PROJECT_ANNUAL_DISTRIBUTION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'more-information',
        component: InterventionMoreInformationComponent,
        data: { permission: Permission.INTERVENTION_MORE_INFORMATION_READ }
      },
      {
        canActivate: [PermissionGuard],
        path: 'conception-data',
        component: InterventionConceptionDataComponent,
        data: { permission: Permission.INTERVENTION_MORE_INFORMATION_READ }
      }
    ],
    data: { permission: Permission.INTERVENTION_READ }
  },
  {
    canActivate: [PermissionGuard],
    path: 'projects/:id/opportunity-notices/:opportunityNoticeId/response',
    component: OpportunityNoticesResponseComponent,
    data: { permission: Permission.OPPORTUNITY_NOTICE_WRITE }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WindowRoutingModule {}

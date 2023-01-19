import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AnyPermissionGuard } from '../shared/guards/any-permission.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { PriorityScenariosGuard } from '../shared/guards/priority-scenarios.guard';
import { ProgramBookDetailsDrmComponent } from './program-book-details-drm/program-book-details-drm';
import { ProgramBookDetailsProgrammedProjectsComponent } from './program-book-details-programmed-projects/program-book-details-programmed-projects';
import { ProgramBookDetailsRemovedProjectsComponent } from './program-book-details-removed-projects/program-book-details-removed-projects.component';
import { ProgramBookDetailsSummaryComponent } from './program-book-details-summary/program-book-details-summary.component';
import { ProgramBookDetailsComponent } from './program-book-details/program-book-details.component';
import { ProgramBookObjectivesComponent } from './program-book-objectives/program-book-objectives.component';
import { ProgramBookPriorityScenariosComponent } from './program-book-priority-scenarios/program-book-priority-scenarios.component';
import { ProgramBookSubmissionListComponent } from './program-book-submission-list/program-book-submission-list.component';
import { ProgramBookSubmissionComponent } from './program-book-submission/program-book-submission.component';

/**./program-book-details-removed-projects/program-book-removed-projects.component
 * Reminder: path order is important.
 * The path ':id' must be after 'filter' otherwise 'filter' will not be accessible.
 */
const routes: Routes = [
  {
    path: ':id',
    canActivate: [AnyPermissionGuard],
    component: ProgramBookDetailsComponent,
    children: [
      { path: 'programmed', component: ProgramBookDetailsProgrammedProjectsComponent, data: { name: 'programmed' } },
      { path: 'removed', component: ProgramBookDetailsRemovedProjectsComponent, data: { name: 'removed' } },
      { path: 'summary', component: ProgramBookDetailsSummaryComponent },
      {
        path: 'sequencing',
        component: ProgramBookPriorityScenariosComponent,
        data: { name: 'sequencing' },
        canDeactivate: [PriorityScenariosGuard]
      },
      {
        canActivate: [PermissionGuard],
        path: 'objectives',
        component: ProgramBookObjectivesComponent,
        data: { permission: Permission.PROGRAM_BOOK_OBJECTIVE_READ }
      },
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full'
      },
      {
        canActivate: [PermissionGuard],
        path: 'drm',
        component: ProgramBookDetailsDrmComponent,
        data: { permission: Permission.PROJECT_DRM_WRITE, name: 'drm' }
      },
      {
        canActivate: [PermissionGuard],
        path: 'submission',
        component: ProgramBookSubmissionComponent,
        data: { permission: Permission.SUBMISSION_WRITE, name: 'submission' }
      },
      {
        canActivate: [PermissionGuard],
        path: 'submission-list',
        component: ProgramBookSubmissionListComponent,
        data: { permission: Permission.PROGRAM_BOOK_SUBMISSIONS_READ, name: 'submission-list' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramBookRoutingModule {}

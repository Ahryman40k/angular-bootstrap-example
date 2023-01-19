import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { PermissionGuard } from '../shared/guards/permission.guard';
import { AnnualProgramDetailsProgrambooksComponent } from './annual-program-details-programbooks/annual-program-details-programbooks.component';
import { AnnualProgramDetailsProjectsToScheduleComponent } from './annual-program-details-projects-to-schedule/annual-program-details-projects-to-schedule.component';
import { AnnualProgramDetailsSubmittedInterventionsComponent } from './annual-program-details-submitted-interventions/annual-program-details-submitted-interventions.component';
import { AnnualProgramDetailsSummaryComponent } from './annual-program-details-summary/annual-program-details-summary.component';
import { AnnualProgramExecutorDetailsComponent } from './annual-program-executor-details/annual-program-executor-details.component';
import { AnnualProgramsExecutorComponent } from './annual-programs-executor/annual-programs-executor.component';
import { AnnualProgramsComponent } from './annual-programs/annual-programs.component';

/**
 * Reminder: path order is important.
 * The path ':id' must be after 'filter' otherwise 'filter' will not be accessible.
 */
const routes: Routes = [
  {
    canActivate: [PermissionGuard],
    path: '',
    component: AnnualProgramsComponent,
    children: [{ path: 'executor/:code', component: AnnualProgramsExecutorComponent }],
    data: { permission: Permission.ANNUAL_PROGRAM_READ }
  },
  {
    canActivate: [PermissionGuard],
    path: ':id',
    component: AnnualProgramExecutorDetailsComponent,
    children: [
      { path: 'summary', component: AnnualProgramDetailsSummaryComponent },
      { path: 'program-books', component: AnnualProgramDetailsProgrambooksComponent },
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full'
      },
      {
        path: 'submitted-interventions',
        component: AnnualProgramDetailsSubmittedInterventionsComponent,
        data: { permission: Permission.PROGRAM_BOOK_PROGRAM }
      },
      {
        path: 'projects-to-schedule',
        component: AnnualProgramDetailsProjectsToScheduleComponent,
        data: { permission: Permission.PROGRAM_BOOK_PROGRAM }
      }
    ],
    data: { permission: Permission.ANNUAL_PROGRAM_READ }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnnualProgramRoutingModule {}

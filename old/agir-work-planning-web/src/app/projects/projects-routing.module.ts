import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AnyPermissionGuard } from '../shared/guards/any-permission.guard';
import { ProjectFormComponent } from './project-form/project-form.component';

/**
 * Reminder: path order is important.
 * The path ':id' must be after 'filter' otherwise 'filter' will not be accessible.
 */

const routes: Routes = [
  { path: 'create', canActivate: [AnyPermissionGuard], component: ProjectFormComponent },
  { path: 'create/:interventionId', canActivate: [AnyPermissionGuard], component: ProjectFormComponent },
  { path: 'edit/:id', canActivate: [AnyPermissionGuard], component: ProjectFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectsRoutingModule {}

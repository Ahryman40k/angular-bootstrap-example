import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InterventionDataTableComponent } from './intervention-data-table/intervention-data-table.component';
import { ProjectDataTableComponent } from './project-data-table/project-data-table.component';

/**
 * Reminder: path order is important.
 * The path ':id' must be after 'filter' otherwise 'filter' will not be accessible.
 */
const routes: Routes = [
  {
    path: 'interventions',
    component: InterventionDataTableComponent
  },
  {
    path: 'projects',
    component: ProjectDataTableComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExportRoutingModule {}

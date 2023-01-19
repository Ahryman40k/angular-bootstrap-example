import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { PermissionGuard } from '../shared/guards/permission.guard';
import { ImportInternalComponent } from './import-internal/import-internal.component';

/**
 * Reminder: path order is important.
 * The path ':id' must be after 'filter' otherwise 'filter' will not be accessible.
 */
const routes: Routes = [
  {
    canActivate: [PermissionGuard],
    path: '',
    component: ImportInternalComponent,
    data: { permission: Permission.IMPORT_WRITE }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImportRoutingModule {}

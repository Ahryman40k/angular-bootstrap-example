import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MtlAuthenticationAuthorizeComponent, MtlAuthenticationGuard } from '@villemontreal/core-security-angular-lib';

import { NotFoundComponent } from './not-found/not-found.component';
import { AnyPermissionGuard } from './shared/guards/any-permission.guard';
import { RtuImportExportLogReadGuard } from './shared/guards/rtu-import-export-logs-read.guard';
import { TaxonomyWriteGuard } from './shared/guards/taxonomy-write-permission.guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const routes: Routes = [
  { path: 'authorize', component: MtlAuthenticationAuthorizeComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'logout', redirectTo: '' },
  {
    path: '',
    canActivate: [MtlAuthenticationGuard],
    children: [
      { path: 'export', loadChildren: './export/export.module#ExportModule', canLoad: [AnyPermissionGuard] },
      { path: 'map', loadChildren: './map/map.module#MapModule', canLoad: [AnyPermissionGuard] },
      { path: 'import', loadChildren: './import/import.module#ImportModule', canLoad: [AnyPermissionGuard] },
      { path: 'window', loadChildren: './window/window.module#WindowModule', canLoad: [AnyPermissionGuard] },
      {
        path: 'annual-programs',
        loadChildren: './annual-program/annual-program.module#AnnualProgramModule',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'program-books',
        loadChildren: './program-book/program-book.module#ProgramBookModule',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'taxonomies',
        loadChildren: './taxonomy/taxonomy.module#TaxonomyModule',
        canLoad: [TaxonomyWriteGuard]
      },
      {
        path: 'pre-planification',
        loadChildren: './pre-planification/pre-planification.module#PrePlanificationModule',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'rtu-transmissions',
        loadChildren: './rtu-transmissions/rtu-transmissions.module#RtuTransmissionsModule',
        canLoad: [RtuImportExportLogReadGuard]
      },
      {
        path: '',
        redirectTo: 'map',
        pathMatch: 'full'
      }
    ]
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

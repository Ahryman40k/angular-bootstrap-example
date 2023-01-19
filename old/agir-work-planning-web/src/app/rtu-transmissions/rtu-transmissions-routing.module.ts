import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RtuImportExportLogReadGuard } from '../shared/guards/rtu-import-export-logs-read.guard';
import { TransmissionsExportDetailsComponent } from './transmissions-export-details/transmissions-export-details.component';
import { TransmissionsExportsComponent } from './transmissions-exports/transmissions-exports.component';
import { TransmissionsImportDetailsComponent } from './transmissions-import-details/transmissions-import-details.component';
import { TransmissionsImportsComponent } from './transmissions-imports/transmissions-imports.component';
import { TransmissionsComponent } from './transmissions/transmissions.component';

const routes: Routes = [
  {
    canActivate: [RtuImportExportLogReadGuard],
    path: '',
    component: TransmissionsComponent,
    children: [
      {
        path: 'exports/:id',
        component: TransmissionsExportDetailsComponent
      },
      { path: 'exports', component: TransmissionsExportsComponent },
      {
        path: 'imports/:id',
        component: TransmissionsImportDetailsComponent
      },
      { path: 'imports', component: TransmissionsImportsComponent },
      {
        path: '',
        redirectTo: 'imports',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RtuTransmissionsRoutingModule {}

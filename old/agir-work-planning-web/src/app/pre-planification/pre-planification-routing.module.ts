import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { PermissionGuard } from '../shared/guards/permission.guard';
import { ImportNexoHistoryComponent } from './import-nexo-history/import-nexo-history.component';
import { NexoBookCorrespondanceComponent } from './nexo-book-correspondance/nexo-book-correspondance.component';
import { NexoCorrespondanceComponent } from './nexo-correspondance/nexo-correspondance.component';
import { TaxonomyNexoCorrespondanceComponent } from './taxonomy-nexo-correspondance/taxonomy-nexo-correspondance.component';

const routes: Routes = [
  {
    canActivate: [PermissionGuard],
    path: '',
    component: ImportNexoHistoryComponent,
    data: { permission: Permission.NEXO_IMPORT_LOG_READ }
  },
  {
    canActivate: [PermissionGuard],
    path: 'correspondance',
    component: NexoCorrespondanceComponent,
    data: { permission: Permission.TAXONOMY_WRITE },
    children: [
      { path: 'borough', component: TaxonomyNexoCorrespondanceComponent },
      { path: 'executor', component: TaxonomyNexoCorrespondanceComponent },
      { path: 'requestor', component: TaxonomyNexoCorrespondanceComponent },
      { path: 'assetType', component: TaxonomyNexoCorrespondanceComponent },
      { path: 'roadNetworkType', component: TaxonomyNexoCorrespondanceComponent },
      { path: 'workType', component: TaxonomyNexoCorrespondanceComponent },
      { path: 'nexoBook', component: NexoBookCorrespondanceComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrePlanificationRoutingModule {}

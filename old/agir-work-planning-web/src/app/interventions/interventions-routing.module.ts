import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AnyPermissionGuard } from '../shared/guards/any-permission.guard';
import { InterventionCreationMultipleAssetComponent } from './intervention-form/intervention-creation/geolocated-multiple-asset/intervention-creation-multiple-asset.component';
import { InterventionCreationOpportunityNoticeComponent } from './intervention-form/intervention-creation/geolocated-opportunity-notice/intervention-creation-opportunity-notice.component';
import { InterventionCreationAssetComponent } from './intervention-form/intervention-creation/geolocated/intervention-creation-asset.component';
import { InterventionCreationNonGeolocatedAssetComponent } from './intervention-form/intervention-creation/non-geolocated/intervention-creation-non-geolocated-asset.component';
import { InterventionUpdateComponent } from './intervention-form/intervention-update/intervention-update.component';

/**
 * Reminder: path order is important.
 * The path ':id' must be after 'filter' otherwise 'filter' will not be accessible.
 */
const routes: Routes = [
  { path: 'create', canActivate: [AnyPermissionGuard], component: InterventionCreationNonGeolocatedAssetComponent },
  {
    path: 'create/:assetType/:assetId',
    canActivate: [AnyPermissionGuard],
    component: InterventionCreationAssetComponent
  },
  {
    path: 'create/opportunity-notice',
    canActivate: [AnyPermissionGuard],
    component: InterventionCreationOpportunityNoticeComponent
  },
  {
    path: 'create/multiple-asset',
    canActivate: [AnyPermissionGuard],
    component: InterventionCreationMultipleAssetComponent
  },
  { path: 'edit/:interventionId', canActivate: [AnyPermissionGuard], component: InterventionUpdateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InterventionsRoutingModule {}

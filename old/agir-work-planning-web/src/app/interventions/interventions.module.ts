import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskModule } from 'ngx-mask';

import { MapModule } from '../map/map.module';
import { SharedModule } from '../shared/shared.module';
import { InterventionCreationMultipleAssetComponent } from './intervention-form/intervention-creation/geolocated-multiple-asset/intervention-creation-multiple-asset.component';
import { InterventionCreationOpportunityNoticeComponent } from './intervention-form/intervention-creation/geolocated-opportunity-notice/intervention-creation-opportunity-notice.component';
import { InterventionCreationAssetComponent } from './intervention-form/intervention-creation/geolocated/intervention-creation-asset.component';
import { InterventionCreationNonGeolocatedAssetComponent } from './intervention-form/intervention-creation/non-geolocated/intervention-creation-non-geolocated-asset.component';
import { InterventionFormLayoutComponent } from './intervention-form/intervention-form-layout/intervention-form-layout.component';
import { InterventionUpdateComponent } from './intervention-form/intervention-update/intervention-update.component';
import { InterventionInfoComponent } from './intervention-info/intervention-info.component';
import { InterventionsRoutingModule } from './interventions-routing.module';

@NgModule({
  declarations: [
    InterventionCreationNonGeolocatedAssetComponent,
    InterventionCreationAssetComponent,
    InterventionCreationOpportunityNoticeComponent,
    InterventionFormLayoutComponent,
    InterventionInfoComponent,
    InterventionUpdateComponent,
    InterventionCreationMultipleAssetComponent
  ],
  imports: [
    CommonModule,
    InterventionsRoutingModule,
    NgbTooltipModule,
    NgxMaskModule.forChild(),
    ReactiveFormsModule,
    SharedModule,
    MapModule
  ],
  exports: [InterventionInfoComponent]
})
export class InterventionsModule {}

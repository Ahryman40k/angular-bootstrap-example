import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskModule } from 'ngx-mask';

import { SharedModule } from '../shared/shared.module';
import { RtuTransmissionsRoutingModule } from './rtu-transmissions-routing.module';
import { TransmissionStatusBadgeComponent } from './transmission-status-badge/transmission-status-badge.component';
import { TransmissionsExportDetailsComponent } from './transmissions-export-details/transmissions-export-details.component';
import { TransmissionsExportsComponent } from './transmissions-exports/transmissions-exports.component';
import { TransmissionsImportDetailsComponent } from './transmissions-import-details/transmissions-import-details.component';
import { TransmissionsImportsComponent } from './transmissions-imports/transmissions-imports.component';
import { TransmissionsTableComponent } from './transmissions-table/transmissions-table.component';
import { TransmissonsTabsComponent } from './transmissions-tabs/transmissions-tabs.component';
import { TransmissionsComponent } from './transmissions/transmissions.component';

@NgModule({
  declarations: [
    TransmissionsComponent,
    TransmissionsTableComponent,
    TransmissionsImportsComponent,
    TransmissionsExportsComponent,
    TransmissionsImportDetailsComponent,
    TransmissonsTabsComponent,
    TransmissionStatusBadgeComponent,
    TransmissionsExportDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    NgbModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgxMaskModule.forChild(),
    RtuTransmissionsRoutingModule
  ],
  entryComponents: [TransmissionsImportsComponent]
})
export class RtuTransmissionsModule {}

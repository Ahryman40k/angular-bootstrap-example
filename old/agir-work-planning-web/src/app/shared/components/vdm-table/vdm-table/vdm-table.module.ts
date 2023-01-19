import { PortalModule } from '@angular/cdk/portal';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { VdmTableComponent } from './vdm-table.component';

@NgModule({
  declarations: [],
  exports: [],
  imports: [CommonModule, CdkTableModule, PortalModule]
})
export class VdmTableModule {}

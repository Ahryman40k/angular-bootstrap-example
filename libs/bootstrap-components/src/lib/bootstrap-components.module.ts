import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdmButtonModule } from './vdm-button/vdm-button.module';
import { VdmHeaderBarModule } from './vdm-header-bar/vdm-header-bar.module';


@NgModule({
  imports: [CommonModule, VdmButtonModule, VdmHeaderBarModule ],
  declarations: [],
  exports: [VdmButtonModule, VdmHeaderBarModule],
})
export class BootstrapComponentsModule {}

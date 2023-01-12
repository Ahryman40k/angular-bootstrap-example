import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdmButtonModule } from './vdm-button/vdm-button.module';


@NgModule({
  imports: [CommonModule, VdmButtonModule ],
  declarations: [],
  exports: [VdmButtonModule],
})
export class BootstrapComponentsModule {}

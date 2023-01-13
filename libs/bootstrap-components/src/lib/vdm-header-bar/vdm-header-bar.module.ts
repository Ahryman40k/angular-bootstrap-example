import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdmHeaderBarComponent } from './vdm-header-bar.component';

@NgModule({
  declarations: [VdmHeaderBarComponent],
  imports: [CommonModule],
  exports: [VdmHeaderBarComponent],
})
export class VdmHeaderBarModule {}

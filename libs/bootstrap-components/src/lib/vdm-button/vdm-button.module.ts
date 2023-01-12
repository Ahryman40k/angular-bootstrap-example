import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonDirective, ColorDirective, RaisedButtonDirective, StrokeButtonDirective } from './vdm-button.directive';


@NgModule({
  declarations: [ButtonDirective, StrokeButtonDirective, RaisedButtonDirective, ColorDirective],
  imports: [CommonModule],
  exports: [ ButtonDirective, StrokeButtonDirective, RaisedButtonDirective, ColorDirective],
})
export class VdmButtonModule {}

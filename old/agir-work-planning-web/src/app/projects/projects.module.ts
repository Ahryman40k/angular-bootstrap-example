import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';

import { MapModule } from '../map/map.module';
import { SharedModule } from '../shared/shared.module';
import { ProjectFormComponent } from './project-form/project-form.component';
import { ProjectsRoutingModule } from './projects-routing.module';

@NgModule({
  declarations: [ProjectFormComponent],
  imports: [
    CommonModule,
    MapModule,
    NgxMaskModule.forChild(),
    ProjectsRoutingModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers: [CurrencyPipe]
})
export class ProjectsModule {}

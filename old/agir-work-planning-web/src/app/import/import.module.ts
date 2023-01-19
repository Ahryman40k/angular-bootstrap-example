import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskModule } from 'ngx-mask';

import { SharedModule } from '../shared/shared.module';
import { ImportInternalComponent } from './import-internal/import-internal.component';
import { ImportRoutingModule } from './import-routing.module';

@NgModule({
  declarations: [ImportInternalComponent],

  imports: [CommonModule, ImportRoutingModule, SharedModule, ReactiveFormsModule, NgxMaskModule.forChild(), NgbModule],
  exports: [],
  providers: []
})
export class ImportModule {}

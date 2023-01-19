import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../shared/shared.module';
import { ImportNexoFileDetailComponent } from './import-nexo-file-detail/import-nexo-file-detail.component';
import { ImportNexoHistoryComponent } from './import-nexo-history/import-nexo-history.component';
import { ImportNexoLogDetailsComponent } from './import-nexo-log-details/import-nexo-log-details.component';
import { ImportNexoComponent } from './import-nexo/import-nexo.component';
import { NexoBookCorrespondanceComponent } from './nexo-book-correspondance/nexo-book-correspondance.component';
import { NexoBookCreationModalComponent } from './nexo-book-creation-modal/nexo-book-creation-modal.component';
import { NexoBookUpdateModalComponent } from './nexo-book-update-modal/nexo-book-update-modal.component';
import { NexoCorrespondanceComponent } from './nexo-correspondance/nexo-correspondance.component';
import { PrePlanificationRoutingModule } from './pre-planification-routing.module';
import { TaxonomyNexoCorrespondanceComponent } from './taxonomy-nexo-correspondance/taxonomy-nexo-correspondance.component';

@NgModule({
  imports: [CommonModule, FormsModule, NgbModule, PrePlanificationRoutingModule, SharedModule],
  exports: [],
  declarations: [
    ImportNexoComponent,
    ImportNexoHistoryComponent,
    ImportNexoLogDetailsComponent,
    ImportNexoFileDetailComponent,
    NexoBookCorrespondanceComponent,
    NexoCorrespondanceComponent,
    TaxonomyNexoCorrespondanceComponent,
    NexoBookCreationModalComponent,
    NexoBookUpdateModalComponent
  ],
  entryComponents: [ImportNexoComponent, NexoBookCreationModalComponent, NexoBookUpdateModalComponent]
})
export class PrePlanificationModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskModule } from 'ngx-mask';

import { SharedModule } from '../shared/shared.module';
import { TaxonomiesComponent } from './taxonomies/taxonomies.component';
import { TaxonomyAssetDataKeysInputComponent } from './taxonomy-asset-data-keys-input/taxonomy-asset-data-keys-input.component';
import { TaxonomyCategoryComponent } from './taxonomy-category/taxonomy-category.component';
import { TaxonomyGroupItemDetailComponent } from './taxonomy-group-item-detail/taxonomy-group-item-detail.component';
import { TaxonomyGroupItemModalComponent } from './taxonomy-group-item-modal/taxonomy-group-item-modal.component';
import { TaxonomyGroupTableComponent } from './taxonomy-group-table/taxonomy-group-table.component';
import { TaxonomyRoutingModule } from './taxonomy-routing.module';

@NgModule({
  declarations: [
    TaxonomiesComponent,
    TaxonomyCategoryComponent,
    TaxonomyGroupTableComponent,
    TaxonomyGroupItemDetailComponent,
    TaxonomyGroupItemModalComponent,
    TaxonomyAssetDataKeysInputComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    NgbModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgxMaskModule.forChild(),
    TaxonomyRoutingModule
  ],
  entryComponents: [TaxonomyGroupItemModalComponent]
})
export class TaxonomyModule {}

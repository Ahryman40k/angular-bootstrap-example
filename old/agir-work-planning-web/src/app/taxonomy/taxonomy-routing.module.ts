import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TaxonomyWriteGuard } from '../shared/guards/taxonomy-write-permission.guard';
import { TaxonomiesComponent } from './taxonomies/taxonomies.component';
import { TaxonomyCategoryComponent } from './taxonomy-category/taxonomy-category.component';

const routes: Routes = [
  {
    canActivate: [TaxonomyWriteGuard],
    path: '',
    component: TaxonomiesComponent,
    children: [
      { path: '', component: TaxonomyCategoryComponent },
      { path: ':id', component: TaxonomyCategoryComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaxonomyRoutingModule {}

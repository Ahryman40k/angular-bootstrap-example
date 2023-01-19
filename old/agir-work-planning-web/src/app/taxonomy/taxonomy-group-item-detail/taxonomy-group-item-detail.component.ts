import { Component, Input, OnInit } from '@angular/core';
import { ITaxonomy, ITaxonomyAssetTypeDataKey, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

@Component({
  selector: 'app-taxonomy-group-item-detail',
  templateUrl: './taxonomy-group-item-detail.component.html',
  styleUrls: ['./taxonomy-group-item-detail.component.scss']
})
export class TaxonomyGroupItemDetailComponent extends BaseComponent implements OnInit {
  @Input() public taxonomy: ITaxonomy;
  @Input() public group: ITaxonomy;

  public TaxonomyGroup = TaxonomyGroup;

  get orderedDataKeys(): ITaxonomyAssetTypeDataKey[] {
    return _.orderBy(this.taxonomy.properties.dataKeys, ['displayOrder'], ['asc']);
  }

  constructor() {
    super();
  }
}

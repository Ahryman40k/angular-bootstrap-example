import { Component } from '@angular/core';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';

@Component({
  selector: 'app-nexo-correspondance',
  templateUrl: './nexo-correspondance.component.html',
  styleUrls: ['./nexo-correspondance.component.scss']
})
export class NexoCorrespondanceComponent {
  public handledTaxonomyCodes = [
    TaxonomyGroup.borough,
    TaxonomyGroup.executor,
    TaxonomyGroup.requestor,
    TaxonomyGroup.assetType,
    TaxonomyGroup.roadNetworkType,
    TaxonomyGroup.workType
  ];

  public TaxonomyGroup = TaxonomyGroup;
}

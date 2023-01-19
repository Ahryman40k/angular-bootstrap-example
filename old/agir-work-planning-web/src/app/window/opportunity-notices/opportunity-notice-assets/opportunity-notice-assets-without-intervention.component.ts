import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IAsset, IEnrichedProject, ISearchAssetsRequest } from '@villemontreal/agir-work-planning-lib/dist/src';
import { OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { TaxonomyAssetService } from '../../../shared/services/taxonomy-asset.service';
import { BaseDetailsComponent } from '../../base-details-component';

@Component({
  selector: 'app-opportunity-notices-without-intervention',
  templateUrl: './opportunity-notice-assets.component.html'
})
export class OpportunityNoticeAssetsWithoutInterventionComponent extends BaseDetailsComponent {
  public isAssetListWithIntervention = false;

  constructor(
    private readonly opportunityNoticeService: OpportunityNoticeService,
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    private readonly taxoAssetService: TaxonomyAssetService
  ) {
    super(windowService, activatedRoute);
  }

  public async fetchAssets(project: IEnrichedProject, searchAssetParams: ISearchAssetsRequest): Promise<IAsset[]> {
    return await this.opportunityNoticeService.searchAssetsWithoutIntervention(project, searchAssetParams);
  }
}

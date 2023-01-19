import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IAsset, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { BaseDetailsComponent } from '../../base-details-component';

@Component({
  selector: 'app-opportunity-notices-with-intervention',
  templateUrl: './opportunity-notice-assets.component.html'
})
export class OpportunityNoticeAssetsWithInterventionComponent extends BaseDetailsComponent {
  public isAssetListWithIntervention = true;

  constructor(
    private readonly opportunityNoticeService: OpportunityNoticeService,
    windowService: WindowService,
    activatedRoute: ActivatedRoute
  ) {
    super(windowService, activatedRoute);
  }

  public fetchAssets(project: IEnrichedProject): Promise<IAsset[]> {
    return this.opportunityNoticeService.searchAssetsWithIntervention(project);
  }
}

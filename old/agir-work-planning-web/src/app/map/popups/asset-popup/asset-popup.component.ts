import { Component } from '@angular/core';
import { AssetType, IAsset } from '@villemontreal/agir-work-planning-lib';
import { AssetService } from 'src/app/shared/services/asset.service';

import { BasePopupComponent } from '../base-popup.component';

@Component({
  selector: 'app-asset-popup',
  templateUrl: 'asset-popup.component.html'
})
export class AssetPopupComponent extends BasePopupComponent {
  public asset: IAsset;

  constructor(private readonly assetService: AssetService) {
    super();
  }

  public async init(assetType: AssetType, assetId: string): Promise<void> {
    this.asset = await this.assetService.get(assetType, assetId);
    this.initializedSubject.next();
  }
}

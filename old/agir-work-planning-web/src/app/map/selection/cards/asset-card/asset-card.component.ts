import { Component, Input, OnChanges, Optional, SimpleChanges } from '@angular/core';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  IPlainIntervention,
  ITaxonomy,
  ITaxonomyAssetDataKey,
  ITaxonomyAssetType,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapNavigationService } from 'src/app/shared/services/map-navigation.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

import { BaseObjectCardComponent } from '../../../../shared/components/card/base-object-card.component';
import { IPropertie, TaxonomyAssetService } from '../../../../shared/services/taxonomy-asset.service';

@Component({
  selector: 'app-asset-card',
  templateUrl: './asset-card.component.html',
  styleUrls: ['./asset-card.component.scss', '../card.component.scss']
})
export class AssetCardComponent extends BaseObjectCardComponent implements OnChanges {
  @Input() public asset: IAsset;
  @Input() public assetTaxonomies: ITaxonomy;
  @Input() public interventions: IPlainIntervention[] = [];

  private taxoSubscription: Subscription;
  public Permission = Permission;

  public showOptionsButton = false;
  public lastIntervention: IEnrichedIntervention = null;
  public properties: IPropertie[] = [];

  constructor(
    @Optional() mapNavigationService: MapNavigationService,
    private readonly taxoAssetService: TaxonomyAssetService,
    private readonly taxonomiesService: TaxonomiesService,
    public readonly interventionService: InterventionService,
    private readonly projectService: ProjectService
  ) {
    super(mapNavigationService);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.asset) {
      if (this.taxoSubscription) {
        this.taxoSubscription.unsubscribe();
      }
      this.taxoSubscription = this.taxonomiesService
        .group(TaxonomyGroup.assetDataKey)
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (assetDataKeys: ITaxonomyAssetDataKey[]) => {
          this.checkAccessOptionsButton(changes.asset.currentValue.typeId);
          this.properties = this.taxoAssetService.extractPropertiesList(changes.asset.currentValue, assetDataKeys);
          this.lastIntervention = await this.interventionService.getAssetLastIntervention(
            changes.asset.currentValue.id,
            this.projectService.fromYear - 1
          );
        });
    }
  }

  public interventionLink(id: string): string {
    return `window/interventions/edit/${id}`;
  }

  protected onClick(): void {
    this.navigateToSelection(this.asset);
  }

  private checkAccessOptionsButton(typeId: AssetType): void {
    this.taxoAssetService
      .getTaxonomyAsset(typeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((assetType: ITaxonomyAssetType) => {
        // if consultationOnly, do not show options button
        if (!assetType) {
          return;
        }
        this.showOptionsButton = !assetType.properties.consultationOnly;
      });
  }
}

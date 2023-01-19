import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  ITaxonomyAssetDataKey,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { remove } from 'lodash';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { roadwayAssetTypes } from '../../services/asset.service';

import { MapHighlightService } from '../../services/map-highlight/map-highlight.service';
import { ExternalReferenceIdType } from '../../services/nexo.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { TaxonomyAssetService } from '../../services/taxonomy-asset.service';
import { UserService } from '../../user/user.service';
import { BaseComponent } from '../base/base.component';

export interface ISelectedAsset {
  asset: IAsset;
  lastIntervention?: Pick<IEnrichedIntervention, 'id' | 'planificationYear'>;
  installationDate?: Date;
  highlighted?: boolean;
  assetId: string;
  geometry: any;
}

enum ListTypeAction {
  assetAdded = 'assetAdded',
  assetRemoved = 'assetRemoved'
}
@Component({
  selector: 'app-asset-list',
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss']
})
export class AssetListComponent extends BaseComponent {
  public selectedAssets: ISelectedAsset[] = [];
  public removedAssets: ISelectedAsset[] = [];
  public expandedIndex = [];
  public listTypeAction = ListTypeAction;
  private taxoSubscription: Subscription;
  @Input() public isAssetHasProperties;
  @Input() public isCreation = false;
  @Input() public isReadOnly = false;
  @Input() public set items(assets: ISelectedAsset[]) {
    this.selectedAssets = assets;
  }
  @Input() public isLoading = false;
  @Input() public isGeneratingArea = false;

  @Output() public resetEvent = new EventEmitter();
  @Output() public submitEvent = new EventEmitter<ISelectedAsset[]>();
  @Output() public assetListChangeEvent = new EventEmitter<ISelectedAsset[]>();
  @Output() public assetHoverEvent = new EventEmitter<ISelectedAsset>();

  public canViewAssetDetails: boolean = false;

  public properties = [];
  public get showButtons(): boolean {
    return (
      (this.selectedAssets?.length || this.removedAssets?.length) &&
      !this.isCreation &&
      !this.isLoading &&
      !this.isReadOnly
    );
  }

  constructor(
    private readonly highlightService: MapHighlightService,
    private readonly taxoAssetService: TaxonomyAssetService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly userService: UserService
  ) {
    super();

    this.userService
      .hasPermission(Permission.ASSET_READ)
      .then(hasPermissions => {
        this.canViewAssetDetails = hasPermissions;
      })
      .catch();
  }

  public collapse(index: number, asset: IAsset, listType: ListTypeAction): void {
    this.extractProperties(asset);
    this.expandedIndex.includes(index + listType)
      ? this.expandedIndex.splice(this.expandedIndex?.indexOf(index + listType), 1)
      : this.expandedIndex.push(index + listType);
  }

  public extractProperties(asset: IAsset): void {
    if (this.taxoSubscription) {
      this.taxoSubscription.unsubscribe();
    }
    this.taxoSubscription = this.taxonomiesService
      .group(TaxonomyGroup.assetDataKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe((assetDataKeys: ITaxonomyAssetDataKey[]) => {
        this.properties = this.taxoAssetService.extractPropertiesList(asset, assetDataKeys);
      });
  }
  public removeAsset(asset: ISelectedAsset): void {
    this.highlightService.unhighlight(asset.asset);
    remove(this.selectedAssets, selectedAsset => selectedAsset.assetId === asset.assetId);
    this.removedAssets.push(asset);
  }

  public deleteAsset(asset: ISelectedAsset): void {
    if (this.selectedAssets?.length <= 1) {
      return;
    }
    remove(this.selectedAssets, selectedAsset => selectedAsset.assetId === asset.assetId);
    this.assetListChangeEvent.emit(this.selectedAssets);
  }

  public addAsset(asset: ISelectedAsset): void {
    this.highlightService.highlight(asset.asset);
    remove(this.removedAssets, removedAsset => removedAsset.assetId === asset.assetId);
    this.selectedAssets.push(asset);
  }

  public get isAssetTypeRoadway(): boolean {
    return roadwayAssetTypes.includes(this.selectedAssets?.find(el => el)?.asset?.typeId as AssetType);
  }

  public reset(): void {
    this.resetLists();
    this.resetEvent.emit();
  }

  public submit(): void {
    this.submitEvent.emit(this.selectedAssets);
  }

  public resetLists(): void {
    this.selectedAssets = [];
    this.removedAssets = [];
  }

  public hoverAsset(asset?: ISelectedAsset): void {
    this.assetHoverEvent.emit(asset);
  }

  public highlightAsset(id: string, highlight: boolean): void {
    const asset = this.selectedAssets.find(item => item.assetId === id);
    asset.highlighted = highlight;
  }

  public hasNexoReferenceNumber(selectedAsset: ISelectedAsset): boolean {
    return selectedAsset?.asset?.externalReferenceIds?.some(
      el => el.type === ExternalReferenceIdType.nexoReferenceNumber
    );
  }
}

import {
  AssetExpand,
  IAsset,
  IAssetDesignData,
  IExternalReferenceId,
  ILength,
  OpportunityNoticeExpand,
  ProjectExpand
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { assetService } from '../../../services/assetService';
import { externalReferenceMapperDTO } from '../../../shared/domain/externalReferenceId/mappers/externalReferenceIdMapperDTO';
import { Result } from '../../../shared/logic/result';
import { FromModelToDtoMappings, IMapperOptions } from '../../../shared/mappers/fromModelToDtoMappings';
import { IKeyAndValue } from '../../../utils/utils';
import { assetDesignDataMapperDTO } from '../../assetDesignData/mappers/assetDesignDataMapperDTO';
import { lengthMapperDTO } from '../../length/mappers/lengthMapperDTO';
import { Asset } from '../models/asset';

export interface IAssetMapperOptions extends IMapperOptions {
  expand: AssetExpand[];
}

// Get asset expand according to other expand values
export function getAssetMapperExpandOptions(expands: string[] = []): AssetExpand[] {
  const expandAssets: string[] = [OpportunityNoticeExpand.assets];
  for (const expand of expands) {
    if (expandAssets.includes(expand)) {
      return [AssetExpand.assetDetails];
    }
  }
  return [];
}

export function getAssetExpandFromProjectExpand(expand: string | string[]): AssetExpand[] {
  const assetExpand: AssetExpand[] = [];
  if (!expand) {
    return assetExpand;
  }

  if (expand.includes(ProjectExpand.assets)) {
    assetExpand.push(AssetExpand.assetDetails);
  }
  return assetExpand;
}

class AssetMapperDTO extends FromModelToDtoMappings<Asset, IAsset, IAssetMapperOptions> {
  public async getFromModels(assets: Asset[], options?: IAssetMapperOptions): Promise<IAsset[]> {
    if (!assets) {
      return undefined;
    }
    let expandedAssets = assets;
    if (!isEmpty(options?.expand)) {
      expandedAssets = await this.expandAssets(expandedAssets, options.expand);
    }
    return Promise.all(expandedAssets.map(asset => this.getFromNotNullModel(asset)));
  }

  public async getFromModel(asset: Asset, options?: IAssetMapperOptions): Promise<IAsset> {
    return (await this.getFromModels([asset], options)).find(a => a);
  }

  protected async getFromNotNullModel(asset: Asset): Promise<IAsset> {
    const lengthDTO: ILength = await lengthMapperDTO.getFromModel(asset.length);
    let externalReferenceIdsDTO: IExternalReferenceId[];
    if (!isEmpty(asset.externalReferenceIds)) {
      externalReferenceIdsDTO = await externalReferenceMapperDTO.getFromModels(asset.externalReferenceIds);
    }
    return this.map(
      asset,
      lengthDTO,
      externalReferenceIdsDTO,
      await assetDesignDataMapperDTO.getFromModel(asset.assetDesignData)
    );
  }

  private map(
    asset: Asset,
    lengthDTO: ILength,
    externalReferenceIdsDTO: IExternalReferenceId[],
    assetDesignDataDTO: IAssetDesignData
  ): IAsset {
    return {
      id: asset.id,
      typeId: asset.typeId,
      ownerId: asset.ownerId,
      length: lengthDTO,
      geometry: asset.geometry,
      diameter: asset.diameter,
      material: asset.material,
      suggestedStreetName: asset.suggestedStreetName,
      roadSections: asset.roadSections,
      workArea: asset.workArea,
      properties: asset.properties,
      externalReferenceIds: externalReferenceIdsDTO,
      assetDesignData: assetDesignDataDTO
    };
  }

  protected async expandAssets(assets: Asset[], expand: AssetExpand[]): Promise<Asset[]> {
    // {assetId: Result<Asset>}
    const resultsAssetsByTypes: IKeyAndValue<Result<Asset>> = await assetService.getAssetsResults({
      assets: assets.map(el => {
        return { id: el.id, type: el.typeId };
      }),
      expand
    });

    return assets.map(asset => {
      const assetResult = resultsAssetsByTypes[asset.id];
      if (!assetResult || assetResult.isFailure) {
        return asset;
      }
      const assetValue = assetResult.getValue();
      assetValue.length = asset.length;
      assetValue.typeId = asset.typeId || assetValue.typeId;
      assetValue.ownerId = asset.ownerId || assetValue.ownerId;
      assetValue.material = asset.material || assetValue.material;
      assetValue.diameter = asset.diameter || assetValue.diameter;
      return assetValue;
    });
  }
}

export const assetMapperDTO = new AssetMapperDTO();

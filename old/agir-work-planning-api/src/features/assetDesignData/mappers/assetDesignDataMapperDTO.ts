import { IAssetDesignData } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { AssetDesignData } from '../models/assetDesignData';

class AssetDesignDataMapperDTO extends FromModelToDtoMappings<AssetDesignData, IAssetDesignData, void> {
  protected async getFromNotNullModel(assetDesignData: AssetDesignData): Promise<IAssetDesignData> {
    return await this.map(assetDesignData);
  }

  private async map(assetDesignData: AssetDesignData): Promise<IAssetDesignData> {
    return {
      upstreamAssetType: assetDesignData.upstreamAssetType,
      upstreamAssetId: assetDesignData.upstreamAssetId,
      upstreamDepth: assetDesignData.upstreamDepth,
      downstreamAssetType: assetDesignData.downstreamAssetType,
      downstreamAssetId: assetDesignData.downstreamAssetId,
      downstreamDepth: assetDesignData.downstreamDepth,
      numberOfConnections: assetDesignData.numberOfConnections,
      deformation: assetDesignData.deformation,
      hasInfiltration: assetDesignData.hasInfiltration,
      infiltrationChaining: assetDesignData.infiltrationChaining,
      infiltrationAssetId: assetDesignData.infiltrationAssetId,
      hasObstruction: assetDesignData.hasObstruction,
      obstructionChaining: assetDesignData.obstructionChaining,
      obstructionAssetId: assetDesignData.obstructionAssetId,
      comment: assetDesignData.comment,
      audit: await auditMapperDTO.getFromModel(assetDesignData.audit)
    };
  }
}

export const assetDesignDataMapperDTO = new AssetDesignDataMapperDTO();

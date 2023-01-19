import { IDesignData } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { DesignData } from '../models/designData';

class DesignDataMapperDTO extends FromModelToDtoMappings<DesignData, IDesignData, void> {
  protected async getFromNotNullModel(designData: DesignData): Promise<IDesignData> {
    return await this.map(designData);
  }

  private async map(designData: DesignData): Promise<IDesignData> {
    return {
      upstreamAssetType: designData.upstreamAssetType,
      upstreamAssetId: designData.upstreamAssetId,
      downstreamAssetType: designData.downstreamAssetType,
      downstreamAssetId: designData.downstreamAssetId,
      comment: designData.comment,
      contractRange: designData.contractRange,
      audit: await auditMapperDTO.getFromModel(designData.audit)
    };
  }
}

export const designDataMapperDTO = new DesignDataMapperDTO();

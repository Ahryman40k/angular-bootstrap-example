import { IAsset, IAssetsWorkArea } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { AssetsWorkArea } from '../models/assetsWorkArea';
import { assetMapperDTO } from './assetMapperDTO';

class AssetsWorkAreaMapperDTO extends FromModelToDtoMappings<AssetsWorkArea, IAssetsWorkArea, void> {
  protected async getFromNotNullModel(assetsWorkArea: AssetsWorkArea): Promise<IAssetsWorkArea> {
    const assetsDTO = await assetMapperDTO.getFromModels(assetsWorkArea.assets);
    return this.map(assetsWorkArea, assetsDTO);
  }

  private map(assetsWorkArea: AssetsWorkArea, assetsDTO: IAsset[]): IAssetsWorkArea {
    return {
      assets: assetsDTO,
      workArea: assetsWorkArea.workArea
    };
  }
}

export const assetsWorkAreaMapperDTO = new AssetsWorkAreaMapperDTO();

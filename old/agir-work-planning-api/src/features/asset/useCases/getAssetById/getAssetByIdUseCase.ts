import { AssetExpand, IAsset } from '@villemontreal/agir-work-planning-lib';

import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { assetService } from '../../../../services/assetService';
import { GetByIdUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByIdUseCase';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { Expand } from '../../../../shared/findOptions/expand';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../../utils/arrayUtils';
import { assetMapperDTO } from '../../mappers/assetMapperDTO';
import { Asset } from '../../models/asset';
import { AssetFindOptions } from '../../models/assetFindOptions';
import { AssetValidator } from '../../validators/assetValidator';
import { GetAssetByIdCommand, IGetAssetByIdCommandProps } from './getAssetByIdCommand';

export class GetAssetByIdUseCase extends GetByIdUseCase<Asset, IAsset, AssetFindOptions> {
  protected entityRepository: IBaseRepository<Asset, AssetFindOptions> = undefined;
  protected mapper = assetMapperDTO;

  protected createCommand(req: IGetAssetByIdCommandProps): Result<GetAssetByIdCommand> {
    return GetAssetByIdCommand.create(req);
  }

  protected getFindOptions(getAssetCmd: GetAssetByIdCommand): Result<AssetFindOptions> {
    return AssetFindOptions.create({
      criterias: {
        id: getAssetCmd.id,
        assetTypes: getAssetCmd.assetTypes
      },
      expand: getAssetCmd.expand
    });
  }

  protected async validateTaxonomies(req: IGetAssetByIdCommandProps): Promise<Result<IGuardResult>> {
    return AssetValidator.validateSearchAssetsRequestTaxonomy(req);
  }

  protected async getEntity(findOptions: AssetFindOptions): Promise<Result<Asset>> {
    const assetId = convertStringOrStringArray(findOptions.criterias.id).find(id => id);
    const assetResult = await assetService.getAssetsResults({
      assets: [
        {
          id: assetId,
          type: findOptions.criterias.assetTypes.find(type => type)
        }
      ],
      expand: findOptions.expandOptions?.map((option: Expand) => option.field as AssetExpand)
    });
    // UnexpectedError treated as NOT_FOUND
    if (!assetResult || !assetResult[assetId]) {
      return Result.ok();
    }
    // Not found
    if (assetResult[assetId].isFailure) {
      const errorValue = assetResult[assetId].errorValue() as any;
      if (errorValue?.code === ErrorCode.NOT_FOUND) {
        return Result.ok();
      }
    }
    return assetResult[assetId];
  }
}

// not use direct repository
export const getAssetByIdUseCase: GetAssetByIdUseCase = new GetAssetByIdUseCase();

import { AssetExpand, AssetType, IAssetsWorkAreaSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';

import { IAssetSearchItem } from '../../../../services/assetService';
import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { enumValues } from '../../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface ISearchAssetsWorkAreaCommandProps extends IAssetsWorkAreaSearchRequest {}

export class SearchAssetsWorkAreaCommand extends Command<ISearchAssetsWorkAreaCommandProps> {
  public static create(props: ISearchAssetsWorkAreaCommandProps): Result<SearchAssetsWorkAreaCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<SearchAssetsWorkAreaCommand>(guard);
    }
    const searchAssetsCommand = new SearchAssetsWorkAreaCommand(props);
    return Result.ok<SearchAssetsWorkAreaCommand>(searchAssetsCommand);
  }

  private static guard(props: ISearchAssetsWorkAreaCommandProps): IGuardResult {
    const guardAssetsAndExpand = Guard.guardBulk([
      {
        argument: props.assets,
        argumentName: 'assets',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ARRAY]
      },
      {
        argument: props.expand,
        argumentName: 'expand',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(AssetExpand)
      }
    ]);
    const guardAssetsAndExpandResult = Guard.combine(guardAssetsAndExpand);
    if (!guardAssetsAndExpandResult.succeeded) {
      return guardAssetsAndExpandResult;
    }
    const guardAssetTypes = Guard.guardBulk(
      props.assets.map(el => {
        return {
          argument: el.type,
          argumentName: 'assetType',
          guardType: [GuardType.IS_ONE_OF, GuardType.NULL_OR_UNDEFINED],
          values: enumValues(AssetType)
        };
      })
    );
    const guardAssetIds = Guard.guardBulk(
      props.assets.map(el => {
        return {
          argument: el.id,
          argumentName: 'assetId',
          guardType: [GuardType.NULL_OR_UNDEFINED]
        };
      })
    );
    return Guard.combine([...guardAssetTypes, ...guardAssetIds]);
  }

  public get assets(): IAssetSearchItem[] {
    return this.props.assets;
  }

  public get expand(): AssetExpand[] {
    return this.props.expand as AssetExpand[];
  }
}

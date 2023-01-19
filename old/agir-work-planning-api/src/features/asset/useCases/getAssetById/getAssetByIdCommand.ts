import { AssetExpand, AssetType } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';

import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../../utils/arrayUtils';
import { IAssetCriterias } from '../../models/assetFindOptions';

export interface IGetAssetByIdCommandProps extends IAssetCriterias, IByIdCommandProps {
  id: string;
}

export class GetAssetByIdCommand extends ByIdCommand<IGetAssetByIdCommandProps> {
  public static create(props: IGetAssetByIdCommandProps): Result<GetAssetByIdCommand> {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.assetTypes,
        argumentName: `assetType`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY]
      }
    ];

    let guardExpand: IGuardResult[] = [{ succeeded: true }];
    if (!isEmpty(props.expand)) {
      guardExpand = convertStringOrStringArray(props.expand).map(expand =>
        Guard.guard({
          argument: expand,
          argumentName: 'expand',
          guardType: [GuardType.IS_ONE_OF],
          values: Object.keys(AssetExpand)
        })
      );
    }

    const guard = Guard.combine([
      ByIdCommand.guard(props, GuardType.VALID_ASSET_ID),
      ...Guard.guardBulk(guardBulk),
      ...guardExpand
    ]);
    if (!guard.succeeded) {
      return Result.fail<GetAssetByIdCommand>(guard);
    }
    const getAssetByIdCommand = new GetAssetByIdCommand(props);
    return Result.ok<GetAssetByIdCommand>(getAssetByIdCommand);
  }

  public get assetTypes(): AssetType[] {
    return this.props.assetTypes as AssetType[];
  }
}

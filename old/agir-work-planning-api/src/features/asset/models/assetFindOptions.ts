import { IGeometry } from '@villemontreal/agir-work-planning-lib';
import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

export interface IAssetCriterias extends ICriterias {
  assetTypes?: string[];
  advancedIntersect?: boolean;
  geometry?: IGeometry;
}

export interface IAssetFindOptionsProps extends IFindOptionsProps {
  criterias: IAssetCriterias;
}

export class AssetFindOptions extends FindOptions<IAssetFindOptionsProps> {
  public static create(props: IAssetFindOptionsProps): Result<AssetFindOptions> {
    const guard = AssetFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AssetFindOptions>(guard);
    }
    const assetFindOptions = new AssetFindOptions(props);
    return Result.ok<AssetFindOptions>(assetFindOptions);
  }

  public static guard(props: IAssetFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = AssetFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IAssetCriterias): IGuardResult {
    let guardAssetTypes: IGuardResult[] = [{ succeeded: true }];
    if (criterias.assetTypes) {
      const guardAssetTypesArray = Guard.guard({
        argument: criterias.assetTypes,
        argumentName: 'assetTypes',
        guardType: [GuardType.IS_ARRAY]
      });
      if (guardAssetTypesArray.succeeded) {
        guardAssetTypes = criterias.assetTypes.map((assetType, idx) =>
          Guard.guard({
            argument: assetType,
            argumentName: `assetTypes[${idx}]`,
            guardType: [GuardType.EMPTY_STRING]
          })
        );
      }
      guardAssetTypes.push(guardAssetTypesArray);
    }

    const guardBulk: IGuardArgument[] = [
      {
        argument: criterias.advancedIntersect,
        argumentName: 'advancedIntersect',
        guardType: [GuardType.IS_BOOLEAN]
      },
      {
        argument: criterias.id,
        argumentName: `id`,
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: criterias.geometry,
        argumentName: 'geometry',
        guardType: [GuardType.VALID_POLYGON]
      }
    ];

    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardAssetTypes]);
  }

  public get criterias(): IAssetCriterias {
    return this.props.criterias;
  }
}

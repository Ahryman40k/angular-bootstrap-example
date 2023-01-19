import { ErrorCodes } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';
import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { AssetFindOptions, IAssetCriterias, IAssetFindOptionsProps } from './assetFindOptions';

export interface IAssetsPaginatedFindOptionsProps extends IFindPaginatedProps, IAssetFindOptionsProps {
  criterias: IAssetCriterias;
  limit: number;
  offset: number;
}

export class AssetFindPaginatedOptions extends FindPaginated<IAssetsPaginatedFindOptionsProps> {
  public static create(props: IAssetsPaginatedFindOptionsProps): Result<AssetFindPaginatedOptions> {
    // NOT SURE ABOUT THAT AS AN EMPRY SEARCH SHOULD SEARCH
    // BUT IT WAS NOT THE CASE IN PREVIOUS TESTS
    if (isEmpty(Object.keys(props.criterias).filter(key => props.criterias[key]))) {
      return Result.fail<AssetFindPaginatedOptions>(
        Guard.error('criterias', ErrorCodes.InvalidInput, 'criterias is empty')
      );
    }
    const guardFindOptions = AssetFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<AssetFindPaginatedOptions>(guard);
    }
    const assetFindOptions = new AssetFindPaginatedOptions(props);
    return Result.ok<AssetFindPaginatedOptions>(assetFindOptions);
  }

  public get criterias(): IAssetCriterias {
    return this.props.criterias;
  }
}

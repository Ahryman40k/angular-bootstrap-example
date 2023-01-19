import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  IUserPreferenceCriterias,
  IUserPreferenceFindOptionsProps,
  UserPreferenceFindOptions
} from './userPreferenceFindOptions';

export interface IUserPreferenceFindPaginatedOptionsProps extends IUserPreferenceFindOptionsProps, IFindPaginatedProps {
  criterias: IUserPreferenceCriterias;
  limit: number;
  offset: number;
}

export class UserPreferenceFindPaginatedOptions extends FindPaginated<IUserPreferenceFindPaginatedOptionsProps> {
  public static create(props: IUserPreferenceFindPaginatedOptionsProps): Result<UserPreferenceFindOptions> {
    const guardUserPrefs = UserPreferenceFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardUserPrefs, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<UserPreferenceFindOptions>(guard);
    }
    const userPreferenceFindOptions = new UserPreferenceFindOptions(props);
    return Result.ok<UserPreferenceFindOptions>(userPreferenceFindOptions);
  }
}

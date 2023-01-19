import { constants } from '../../../config/constants';
import { Guard, IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';
import { FindOptions, IFindOptionsProps } from './findOptions';

export interface IFindPaginatedProps extends IFindOptionsProps {
  offset: number;
  limit: number;
}

export class FindPaginated<C extends IFindPaginatedProps> extends FindOptions<C> {
  public static create(props: IFindPaginatedProps): Result<any> {
    const guard = FindPaginated.guard(props);

    if (!guard.succeeded) {
      return Result.fail<FindPaginated<any>>(guard);
    }
    const findPaginated = new FindPaginated(props);
    return Result.ok<FindPaginated<any>>(findPaginated);
  }

  public static guard(props: IFindPaginatedProps): IGuardResult {
    props.offset = props.offset ? props.offset : constants.PaginationDefaults.OFFSET;
    props.limit = props.limit ? props.limit : constants.PaginationDefaults.LIMIT;
    const guardFindOptionsBase = FindOptions.guard(props);
    return Guard.combine([guardFindOptionsBase]);
  }

  public constructor(props: C) {
    props.offset = props.offset ? props.offset : constants.PaginationDefaults.OFFSET;
    props.limit = props.limit ? props.limit : constants.PaginationDefaults.LIMIT;
    super(props);
  }
}

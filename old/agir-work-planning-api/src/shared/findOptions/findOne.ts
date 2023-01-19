import { Result } from '../logic/result';
import { FindOptions, IFindOptionsProps } from './findOptions';

// tslint:disable:no-empty-interface
export interface IFindOneProps extends IFindOptionsProps {}

export class FindOne<C extends IFindOneProps> extends FindOptions<C> {
  public static create(props: IFindOneProps): Result<any> {
    const guard = FindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<FindOne<any>>(guard);
    }
    const findPaginated = new FindOne(props);
    return Result.ok<FindOne<any>>(findPaginated);
  }

  public constructor(props: C) {
    props.offset = 0;
    props.limit = 1;
    super(props);
  }
}

import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IUserPreferenceCriterias extends ICriterias {
  userId?: string;
  key?: string;
}

export interface IUserPreferenceFindOptionsProps extends IFindOptionsProps {
  criterias: IUserPreferenceCriterias;
}

export class UserPreferenceFindOptions extends FindOptions<IUserPreferenceFindOptionsProps> {
  public static create(props: IUserPreferenceFindOptionsProps): Result<UserPreferenceFindOptions> {
    const guard = UserPreferenceFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<UserPreferenceFindOptions>(guard);
    }
    this.setDefaultValues(props);
    const userPreferenceFindOptions = new UserPreferenceFindOptions(props);
    return Result.ok<UserPreferenceFindOptions>(userPreferenceFindOptions);
  }

  public static guard(props: IUserPreferenceFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = UserPreferenceFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IUserPreferenceCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  public static setDefaultValues(props: IUserPreferenceFindOptionsProps) {
    this.setDefaultSort(props);
  }

  private static setDefaultSort(props: IUserPreferenceFindOptionsProps) {
    if (!props.orderBy) {
      props.orderBy = '-createdAt';
    }
  }
}

import { get } from 'lodash';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';
import { FindOptions, IFindOptionsProps } from './findOptions';

export interface IFindByIdCriterias {
  id: string;
}

export interface IFindByIdProps extends IFindOptionsProps {
  criterias: IFindByIdCriterias;
}

export class FindByIdOptions<C extends IFindByIdProps> extends FindOptions<C> {
  public static create(props: IFindByIdProps): Result<FindByIdOptions<any>> {
    const guardResult = FindByIdOptions.guard(props);

    if (!guardResult.succeeded) {
      return Result.fail<FindByIdOptions<any>>(guardResult);
    }
    const findById = new FindByIdOptions(props);
    return Result.ok<FindByIdOptions<any>>(findById);
  }

  public static guard(props: IFindByIdProps): IGuardResult {
    const guardBasic = FindOptions.guard(props);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.criterias,
        argumentName: 'id',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: get(props.criterias, 'id'),
        argumentName: 'id',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      }
    ];
    return Guard.combine([guardBasic, ...Guard.guardBulk(guardBulk)]);
  }

  public get id(): string {
    return this.props.criterias.id;
  }
}

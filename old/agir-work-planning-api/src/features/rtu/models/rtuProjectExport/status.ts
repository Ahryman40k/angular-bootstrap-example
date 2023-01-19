import { GenericEntity } from '../../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IStatusProps {
  name?: string;
  description?: string;
}

export class Status extends GenericEntity<IStatusProps> {
  public static create(props: IStatusProps): Result<Status> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<Status>(guardResult);
    }
    return Result.ok<Status>(new Status(props));
  }

  public static guard(props: IStatusProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.description,
        argumentName: 'description',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string {
    return this.props.description;
  }
}

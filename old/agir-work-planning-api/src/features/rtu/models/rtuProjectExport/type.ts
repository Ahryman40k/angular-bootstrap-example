import { GenericEntity } from '../../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface ITypeProps {
  value?: string;
  partnerId?: string;
  definition?: string;
}

export class Type extends GenericEntity<ITypeProps> {
  public static create(props: ITypeProps): Result<Type> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<Type>(guardResult);
    }
    return Result.ok<Type>(new Type(props));
  }

  public static guard(props: ITypeProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.value,
        argumentName: 'value',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.partnerId,
        argumentName: 'partnerId',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.definition,
        argumentName: 'definition',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get value(): string {
    return this.props.value;
  }

  public get partnerId(): string {
    return this.props.partnerId;
  }

  public get definition(): string {
    return this.props.definition;
  }
}

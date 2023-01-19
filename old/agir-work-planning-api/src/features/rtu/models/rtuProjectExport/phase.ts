import { GenericEntity } from '../../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IPhaseProps {
  value: string;
  definition: string;
}

export class Phase extends GenericEntity<IPhaseProps> {
  public static create(props: IPhaseProps): Result<Phase> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<Phase>(guardResult);
    }
    return Result.ok<Phase>(new Phase(props));
  }

  public static guard(props: IPhaseProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.value,
        argumentName: 'value',
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

  public get definition(): string {
    return this.props.definition;
  }
}

import { enumValues } from '../../utils/enumUtils';
import { GenericEntity } from '../domain/genericEntity';
import { Guard, GuardType, IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';

export enum ExpandOptionsEnum {
  NOPE = 'nope'
}

export interface IExpandProps {
  field: string;
}

export class Expand extends GenericEntity<IExpandProps> {
  public static create(props: IExpandProps): Result<Expand> {
    return Result.ok<Expand>(new Expand(props));
  }

  public static guard(expand: string): IGuardResult {
    let guardExpand = { succeeded: true };
    if (expand) {
      const guardExpandParam: IGuardResult = Guard.guard({
        argument: expand,
        argumentName: 'expand',
        guardType: [GuardType.IS_COMMA_SEPARATED]
      });
      const expandOptions: string[] = expand.split(',');
      const guardExpandValues: IGuardResult[] = expandOptions.map(expandValue =>
        Guard.guard({
          argument: expandValue,
          argumentName: 'expand',
          guardType: [GuardType.IS_ONE_OF],
          values: enumValues(ExpandOptionsEnum)
        })
      );
      guardExpand = Guard.combine([guardExpandParam, ...guardExpandValues]);
    }
    return guardExpand;
  }

  public get field(): string {
    return this.props.field;
  }
}

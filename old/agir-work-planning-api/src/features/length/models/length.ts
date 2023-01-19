import { ILength } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { ILengthAttributes } from '../mongo/lengthSchemas';

// tslint:disable:no-empty-interface
export interface ILengthProps extends ILength {}
export type lengthUnitType = 'm' | 'ft';
export enum LengthUnit {
  meter = 'm',
  feet = 'ft'
}

export class Length extends AggregateRoot<ILengthProps> {
  public static create(props: ILengthProps): Result<Length> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<Length>(guard);
    }
    const length = new Length(props, null);
    return Result.ok<Length>(length);
  }

  public static guard(props: ILengthProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.unit,
        argumentName: `${valueName}unit`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(LengthUnit)
      },
      {
        argument: props.value,
        argumentName: `${valueName}value`,
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_NUMBER]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: ILengthAttributes): Promise<Length> {
    return Length.create({
      unit: raw.unit as lengthUnitType,
      value: raw.value
    }).getValue();
  }

  public static toPersistance(length: Length): ILengthAttributes {
    return {
      unit: length.unit,
      value: length.value
    };
  }

  public get unit(): lengthUnitType {
    return this.props.unit;
  }

  public get value(): number {
    return this.props.value;
  }

  public equals(otherLength: Length): boolean {
    return super.equals(otherLength) && this.innerEquals(otherLength);
  }

  private innerEquals(otherLength: Length): boolean {
    return this.unit === otherLength.unit && this.value === otherLength.value;
  }
}

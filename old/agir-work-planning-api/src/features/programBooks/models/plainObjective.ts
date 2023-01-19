import {
  IPlainObjective,
  ProgramBookObjectiveTargetType,
  ProgramBookObjectiveType
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IPlainObjectiveProps extends IPlainObjective {
  targetType: ProgramBookObjectiveTargetType;
  objectiveType: ProgramBookObjectiveType;
}

export class PlainObjective<P extends IPlainObjectiveProps> extends AggregateRoot<P> {
  public static create(props: IPlainObjectiveProps): Result<PlainObjective<IPlainObjectiveProps>> {
    const guardPlain = PlainObjective.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainObjective<IPlainObjectiveProps>>(guard);
    }
    const plainObjective = new PlainObjective(props, undefined);
    return Result.ok<PlainObjective<IPlainObjectiveProps>>(plainObjective);
  }

  public static guard(props: IPlainObjectiveProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.objectiveType,
        argumentName: 'objectiveType',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(ProgramBookObjectiveType)
      },
      {
        argument: props.targetType,
        argumentName: 'targetType',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(ProgramBookObjectiveTargetType)
      },
      {
        argument: props.pin,
        argumentName: 'pin',
        guardType: [GuardType.IS_BOOLEAN]
      },
      {
        argument: props.referenceValue,
        argumentName: 'referenceValue',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get name(): string {
    return this.props.name;
  }

  public get objectiveType(): ProgramBookObjectiveType {
    return this.props.objectiveType;
  }

  public get targetType(): ProgramBookObjectiveTargetType {
    return this.props.targetType;
  }

  public get requestorId(): string {
    return this.props.requestorId;
  }

  public get assetTypeIds(): string[] {
    return this.props.assetTypeIds || [];
  }

  public get workTypeIds(): string[] {
    return this.props.workTypeIds || [];
  }

  public get pin(): boolean {
    return this.props.pin;
  }

  public get referenceValue(): number {
    return this.props.referenceValue;
  }

  public equals(otherObjective: PlainObjective<any>): boolean {
    return super.equals(otherObjective) && this.innerEquals(otherObjective);
  }

  private innerEquals(otherObjective: PlainObjective<any>): boolean {
    return (
      this.name === otherObjective.name &&
      this.targetType === otherObjective.targetType &&
      this.objectiveType === otherObjective.objectiveType &&
      this.referenceValue === otherObjective.referenceValue
    );
  }
}

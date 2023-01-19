import { IObjectiveValues } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IObjectiveValuesMongoAttributes } from '../mongo/objectiveValuesSchema';

// tslint:disable:no-empty-interface
export interface IObjectiveValuesProps extends IObjectiveValues {}

export class ObjectiveValues extends AggregateRoot<IObjectiveValuesProps> {
  public static create(props: IObjectiveValuesProps): Result<ObjectiveValues> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ObjectiveValues>(guard);
    }
    const objectiveValue = new ObjectiveValues(props, undefined);
    return Result.ok<ObjectiveValues>(objectiveValue);
  }

  public static guard(props: IObjectiveValuesProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.calculated,
        argumentName: 'calculated',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_NUMBER]
      },
      {
        argument: props.reference,
        argumentName: 'reference',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_NUMBER]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IObjectiveValuesMongoAttributes): Promise<ObjectiveValues> {
    const result = ObjectiveValues.create({
      calculated: raw.calculated,
      reference: raw.reference
    });
    return result.getValue();
  }

  public static toPersistence(objectiveValues: ObjectiveValues): IObjectiveValuesMongoAttributes {
    return {
      calculated: objectiveValues.calculated,
      reference: objectiveValues.reference
    };
  }

  public get calculated(): number {
    return this.props.calculated;
  }

  public get reference(): number {
    return this.props.reference;
  }

  public setCalculated(calculated: number): void {
    this.props.calculated = calculated;
  }
}

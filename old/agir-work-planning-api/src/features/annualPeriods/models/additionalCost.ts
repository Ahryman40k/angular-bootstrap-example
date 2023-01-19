import { AdditionalCostType, IAdditionalCost } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IAdditionalCostProps extends IAdditionalCost {
  type: AdditionalCostType;
}

export class AdditionalCost extends AggregateRoot<IAdditionalCostProps> {
  public static create(props: IAdditionalCostProps): Result<AdditionalCost> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AdditionalCost>(guard);
    }
    const additionalCost = new AdditionalCost(props, undefined);
    return Result.ok<AdditionalCost>(additionalCost);
  }

  public static guard(props: IAdditionalCostProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.type,
        argumentName: `${valueName}type`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(AdditionalCostType)
      },
      {
        argument: props.amount,
        argumentName: `${valueName}amount`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.accountId,
        argumentName: `${valueName}accountId`,
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get type(): AdditionalCostType {
    return this.props.type;
  }

  public get amount(): number {
    return this.props.amount;
  }

  public get accountId(): number {
    return this.props.accountId;
  }

  public equals(otherAdditionalCost: AdditionalCost): boolean {
    return super.equals(otherAdditionalCost) && this.innerEquals(otherAdditionalCost);
  }

  private innerEquals(otherAdditionalCost: AdditionalCost): boolean {
    return (
      this.type === otherAdditionalCost.type &&
      this.amount === otherAdditionalCost.amount &&
      this.accountId === otherAdditionalCost.accountId
    );
  }
}

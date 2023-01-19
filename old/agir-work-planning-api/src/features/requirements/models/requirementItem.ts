import { IRequirementItem, RequirementTargetType } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { IRequirementItemAttributes } from '../mongo/requirementModel';

// tslint:disable:no-empty-interface
export interface IRequirementItemProps extends IRequirementItem {}

export class RequirementItem extends AggregateRoot<IRequirementItemProps> {
  public static create(props: IRequirementItemProps, prefix?: string): Result<RequirementItem> {
    const guard = this.guard(props, prefix);
    if (!guard.succeeded) {
      return Result.fail<RequirementItem>(guard);
    }
    const requirementItem = new RequirementItem(props, props.id);
    return Result.ok<RequirementItem>(requirementItem);
  }

  public static guard(props: IRequirementItemProps, prefix: string): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.id,
        argumentName: `${prefix}.id`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.type,
        argumentName: `${prefix}.type`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(RequirementTargetType)
      }
    ];
    const guardBulkResult = Guard.combine([...Guard.guardBulk(guardBulk)]);
    const guardItemId = this.guardItemId(props.id, props.type);
    return Guard.combine([guardBulkResult, guardItemId]);
  }

  public static guardItemId(itemId: string, itemType: string): IGuardResult {
    if (!itemId) {
      return { succeeded: true };
    }
    let guardTypes = [GuardType.VALID_INTERVENTION_ID, GuardType.VALID_PROJECT_ID];

    switch (itemType) {
      case RequirementTargetType.intervention:
        guardTypes = [GuardType.VALID_INTERVENTION_ID];
        break;
      case RequirementTargetType.project:
        guardTypes = [GuardType.VALID_PROJECT_ID];
        break;
      default:
        break;
    }

    const guardResults = guardTypes.map((g, index) => {
      return Guard.guard({
        argument: itemId,
        argumentName: `itemId[${index}]`,
        guardType: [g]
      });
    });
    return guardResults.some(guardResult => guardResult.succeeded)
      ? { succeeded: true }
      : guardResults.find(guardResult => !guardResult.succeeded);
  }

  public static async toDomainModel(raw: IRequirementItemAttributes): Promise<RequirementItem> {
    return RequirementItem.create({
      id: raw.id,
      type: raw.type
    }).getValue();
  }

  public static toPersistance(requirementItem: RequirementItem): IRequirementItemAttributes {
    return {
      id: requirementItem.id,
      type: requirementItem.type
    };
  }

  public get type(): string {
    return this.props.type;
  }
}

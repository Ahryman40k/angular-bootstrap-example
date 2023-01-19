import { IPlainRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IRequirementItemProps, RequirementItem } from './requirementItem';

export interface IPlainRequirementProps extends IPlainRequirement {
  items: IRequirementItemProps[];
}

export class PlainRequirement<P extends IPlainRequirementProps> extends AggregateRoot<P> {
  public static create(props: IPlainRequirementProps): Result<PlainRequirement<IPlainRequirementProps>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<PlainRequirement<IPlainRequirementProps>>(guard);
    }
    const plainRequirement = new PlainRequirement(props);
    return Result.ok<PlainRequirement<IPlainRequirementProps>>(plainRequirement);
  }

  public static guard(props: IPlainRequirementProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.typeId,
        argumentName: 'typeId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.subtypeId,
        argumentName: 'subtypeId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.text,
        argumentName: 'text',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      }
    ];
    const guardRequirement = Guard.guard({
      argument: props.items,
      argumentName: 'items',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY, GuardType.MAX_LENGTH],
      values: [2]
    });

    let guardRequirementItemArray = { succeeded: true };
    if (guardRequirement.succeeded) {
      guardRequirementItemArray = Guard.combine(
        props.items.map((item, index) => RequirementItem.guard(item, `items[${index}]`))
      );
    }
    return Guard.combine([...Guard.guardBulk(guardBulk), guardRequirement, guardRequirementItemArray]);
  }

  private readonly _requirementItems: RequirementItem[];
  constructor(props: P, id: string = null) {
    super(props, id);
    if (!isEmpty(props.items)) {
      this._requirementItems = props.items.map(item => {
        return RequirementItem.create(item).getValue();
      });
    }
  }

  public get typeId(): string {
    return this.props.typeId;
  }

  public get subtypeId(): string {
    return this.props.subtypeId;
  }

  public get text(): string {
    return this.props.text;
  }

  public get items(): RequirementItem[] {
    return this._requirementItems;
  }
}

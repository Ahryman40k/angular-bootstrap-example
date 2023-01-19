import { IDate } from '@villemontreal/agir-work-planning-lib/dist/src';

import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Author } from '../../audit/author';
import { IStatusHistoryItemAttributes } from '../mongo/statusHistoryItemSchema';

export interface IStatusHistoryItemProps {
  status: string;
  comment: string;
  createdAt: IDate;
  createdBy: Author;
}

export class StatusHistoryItem extends GenericEntity<IStatusHistoryItemProps> {
  public static create(props: IStatusHistoryItemProps): Result<StatusHistoryItem> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<StatusHistoryItem>(guard);
    }
    const statusHistoryItem = new StatusHistoryItem(props);
    return Result.ok<StatusHistoryItem>(statusHistoryItem);
  }

  public static guard(props: IStatusHistoryItemProps, prefix = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: `${prefix}status`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.comment,
        argumentName: `${prefix}comment`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.createdAt,
        argumentName: `${prefix}createdAt`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.createdBy,
        argumentName: `${prefix}createdBy`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];

    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  public static async toDomainModel(raw: IStatusHistoryItemAttributes): Promise<StatusHistoryItem> {
    const createdBy = await Author.toDomainModel(raw.createdBy);
    const statusHistoryItemProps: IStatusHistoryItemProps = {
      status: raw.status,
      comment: raw.comment,
      createdAt: raw.createdAt,
      createdBy
    };
    return StatusHistoryItem.create(statusHistoryItemProps).getValue();
  }

  public static toPersistence(statusHistoryItem: StatusHistoryItem): IStatusHistoryItemAttributes {
    return {
      status: statusHistoryItem.status,
      comment: statusHistoryItem.comment,
      createdAt: statusHistoryItem.createdAt,
      createdBy: Author.toPersistance(statusHistoryItem.createdBy)
    };
  }

  public get status(): string {
    return this.props.status;
  }
  public get comment(): string {
    return this.props.comment;
  }
  public get createdAt(): string {
    return this.props.createdAt;
  }
  public get createdBy(): Author {
    return this.props.createdBy;
  }
}

export const isStatusHistoryItem = (v: any): v is StatusHistoryItem => {
  return v instanceof StatusHistoryItem;
};

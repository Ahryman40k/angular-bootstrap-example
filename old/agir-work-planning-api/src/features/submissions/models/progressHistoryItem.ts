import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { IProgressHistoryItemAttributes } from '../mongo/progressHistoryItemSchema';

export interface IProgressHistoryItemProps {
  progressStatus: string;
  audit: Audit;
}

export class ProgressHistoryItem extends GenericEntity<IProgressHistoryItemProps> {
  public static create(props: IProgressHistoryItemProps): Result<ProgressHistoryItem> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProgressHistoryItem>(guard);
    }
    const progressHistoryItem = new ProgressHistoryItem(props);
    return Result.ok<ProgressHistoryItem>(progressHistoryItem);
  }

  public static guard(props: IProgressHistoryItemProps, prefix = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.progressStatus,
        argumentName: `${prefix}progressStatus`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.audit,
        argumentName: `${prefix}audit`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];

    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  public static async toDomainModel(raw: IProgressHistoryItemAttributes): Promise<ProgressHistoryItem> {
    const progressHistoryItemProps: IProgressHistoryItemProps = {
      progressStatus: raw.progressStatus,
      audit: await Audit.toDomainModel(raw.audit)
    };
    return ProgressHistoryItem.create(progressHistoryItemProps).getValue();
  }

  public static toPersistence(progressHistoryItem: ProgressHistoryItem): IProgressHistoryItemAttributes {
    return {
      progressStatus: progressHistoryItem.progressStatus,
      audit: Audit.toPersistance(progressHistoryItem.audit)
    };
  }

  public get progressStatus(): string {
    return this.props.progressStatus;
  }

  public get audit(): Audit {
    return this.props.audit;
  }
}

export const isProgressHistoryItem = (v: any): v is ProgressHistoryItem => {
  return v instanceof ProgressHistoryItem;
};

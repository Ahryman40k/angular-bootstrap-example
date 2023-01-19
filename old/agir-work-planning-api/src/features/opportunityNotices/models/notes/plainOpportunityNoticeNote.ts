import { IPlainNote } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IPlainOpportunityNoticeNoteProps extends IPlainNote {}

export class PlainOpportunityNoticeNote<P extends IPlainOpportunityNoticeNoteProps> extends AggregateRoot<P> {
  public static create(
    props: IPlainOpportunityNoticeNoteProps
  ): Result<PlainOpportunityNoticeNote<IPlainOpportunityNoticeNoteProps>> {
    if (!props) {
      return Result.fail<PlainOpportunityNoticeNote<IPlainOpportunityNoticeNoteProps>>(`Empty body`);
    }
    const guardPlain = PlainOpportunityNoticeNote.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainOpportunityNoticeNote<IPlainOpportunityNoticeNoteProps>>(guard);
    }
    const plainOpportunityNotice = new PlainOpportunityNoticeNote(props, null);
    return Result.ok<PlainOpportunityNoticeNote<IPlainOpportunityNoticeNoteProps>>(plainOpportunityNotice);
  }

  public get text(): string {
    return this.props.text;
  }

  public static guard(props: IPlainOpportunityNoticeNoteProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.text,
        argumentName: 'text',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public equals(otherOpportunityNotice: PlainOpportunityNoticeNote<any>): boolean {
    return super.equals(otherOpportunityNotice) && this.innerEquals(otherOpportunityNotice);
  }

  private innerEquals(otherOpportunityNoticeNote: PlainOpportunityNoticeNote<any>): boolean {
    return this.text === otherOpportunityNoticeNote.text;
  }
}

import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IOpportunityNoticeNoteCommandProps,
  OpportunityNoticeNoteCommand
} from '../../../models/notes/opportunityNoticeNoteCommand';

// tslint:disable:no-empty-interface
export interface ICreateOpportunityNoticeNoteCommandProps extends IOpportunityNoticeNoteCommandProps {
  opportunityNoticeId: IUuid;
}

export class CreateOpportunityNoticeNoteCommand extends OpportunityNoticeNoteCommand<
  ICreateOpportunityNoticeNoteCommandProps
> {
  public static create(props: ICreateOpportunityNoticeNoteCommandProps): Result<CreateOpportunityNoticeNoteCommand> {
    const guardCommand = OpportunityNoticeNoteCommand.guard(props);
    const guardOpportunityNoticeId = Guard.guard({
      argument: props.opportunityNoticeId,
      argumentName: 'opportunityNoticeId',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
    });
    const guard = Guard.combine([guardOpportunityNoticeId, guardCommand]);
    if (!guard.succeeded) {
      return Result.fail<CreateOpportunityNoticeNoteCommand>(guard);
    }
    const createOpportunityNoticeNoteCommand = new CreateOpportunityNoticeNoteCommand(props, props.opportunityNoticeId);
    return Result.ok<CreateOpportunityNoticeNoteCommand>(createOpportunityNoticeNoteCommand);
  }

  public get opportunityNoticeId(): IUuid {
    return this.props.opportunityNoticeId;
  }
}

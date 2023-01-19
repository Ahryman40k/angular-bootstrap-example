import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';

import { IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IOpportunityNoticeNoteCommandProps,
  OpportunityNoticeNoteCommand
} from '../../../models/notes/opportunityNoticeNoteCommand';

export interface IUpdateOpportunityNoticeNoteCommandProps
  extends IOpportunityNoticeNoteCommandProps,
    IByIdCommandProps {
  opportunityNoticeNoteId: IUuid;
}

export class UpdateOpportunityNoticeNoteCommand extends OpportunityNoticeNoteCommand<
  IUpdateOpportunityNoticeNoteCommandProps
> {
  public static create(props: IUpdateOpportunityNoticeNoteCommandProps): Result<UpdateOpportunityNoticeNoteCommand> {
    const guardCommand = OpportunityNoticeNoteCommand.guard(props);
    const guardType = [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID];
    const guardOpportunityNoticeId = Guard.guard({
      argument: props.id,
      argumentName: 'opportunityNoticeId',
      guardType
    });
    const guardOpportunityNoticeNoteId = Guard.guard({
      argument: props.opportunityNoticeNoteId,
      argumentName: 'opportunityNoticeNoteId',
      guardType
    });
    const guard = Guard.combine([guardOpportunityNoticeId, guardOpportunityNoticeNoteId, guardCommand]);
    if (!guard.succeeded) {
      return Result.fail<UpdateOpportunityNoticeNoteCommand>(guard);
    }
    const updateOpportunityNoticeNoteCommand = new UpdateOpportunityNoticeNoteCommand(
      props,
      props.opportunityNoticeNoteId
    );
    return Result.ok<UpdateOpportunityNoticeNoteCommand>(updateOpportunityNoticeNoteCommand);
  }

  public get opportunityNoticeId(): IUuid {
    return this.props.id;
  }

  public get opportunityNoticeNoteId(): IUuid {
    return this.props.opportunityNoticeNoteId;
  }
}

import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';

import { IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { Guard, GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IOpportunityNoticeCommandProps, OpportunityNoticeCommand } from '../../models/opportunityNoticeCommand';

export interface IUpdateOpportunityNoticeCommandProps extends IOpportunityNoticeCommandProps, IByUuidCommandProps {
  status?: string;
}

export class UpdateOpportunityNoticeCommand extends OpportunityNoticeCommand<IUpdateOpportunityNoticeCommandProps> {
  public static create(props: IUpdateOpportunityNoticeCommandProps): Result<UpdateOpportunityNoticeCommand> {
    const guardCommand = OpportunityNoticeCommand.guard(props);
    const guardId = Guard.guard({
      argument: props.id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
    });
    const guard = Guard.combine([guardId, guardCommand]);
    if (!guard.succeeded) {
      return Result.fail<UpdateOpportunityNoticeCommand>(guard);
    }
    const updateOpportunityNoticeCommand = new UpdateOpportunityNoticeCommand(props, props.id);
    return Result.ok<UpdateOpportunityNoticeCommand>(updateOpportunityNoticeCommand);
  }

  public get id(): IUuid {
    return this.props.id;
  }
}

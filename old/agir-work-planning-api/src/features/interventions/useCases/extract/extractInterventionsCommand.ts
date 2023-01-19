import { IInterventionExtractSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';

import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IExtractInterventionsCommandProps extends IInterventionExtractSearchRequest {}

export class ExtractInterventionsCommand extends Command<IExtractInterventionsCommandProps> {
  public static create(props: IExtractInterventionsCommandProps): Result<ExtractInterventionsCommand> {
    const guard = ExtractInterventionsCommand.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ExtractInterventionsCommand>(guard);
    }

    const getCommand = new ExtractInterventionsCommand(props);
    return Result.ok<ExtractInterventionsCommand>(getCommand);
  }

  public static guard(props: IExtractInterventionsCommandProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.planificationYear,
        argumentName: 'planificationYear',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_POSITIVE_INTEGER]
      },
      {
        argument: props.fromEstimate,
        argumentName: 'fromEstimate',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.toEstimate,
        argumentName: 'toEstimate',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.fields,
        argumentName: 'fields',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }
}

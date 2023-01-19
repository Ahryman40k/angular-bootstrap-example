import { IProjectExtractSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';

import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IExtractProjectsCommandProps extends IProjectExtractSearchRequest {}

export class ExtractProjectsCommand extends Command<IExtractProjectsCommandProps> {
  public static create(props: IExtractProjectsCommandProps): Result<ExtractProjectsCommand> {
    const guard = ExtractProjectsCommand.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ExtractProjectsCommand>(guard);
    }

    const getCommand = new ExtractProjectsCommand(props);
    return Result.ok<ExtractProjectsCommand>(getCommand);
  }

  public static guard(props: IExtractProjectsCommandProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.year,
        argumentName: 'year',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_POSITIVE_INTEGER, GuardType.IN_RANGE],
        values: [2000, 3000]
      },
      {
        argument: props.fromBudget,
        argumentName: 'fromBudget',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.toBudget,
        argumentName: 'toBudget',
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

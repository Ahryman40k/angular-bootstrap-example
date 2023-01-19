import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IProgramBookCommandProps, ProgramBookCommand } from '../programBookCommand';

// tslint:disable:no-empty-interface
export interface IUpdateProgramBookCommandProps extends IProgramBookCommandProps {
  id: IUuid;
}

export class UpdateProgramBookCommand extends ProgramBookCommand<IUpdateProgramBookCommandProps> {
  public static create(props: IUpdateProgramBookCommandProps): Result<UpdateProgramBookCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<UpdateProgramBookCommand>(guard);
    }
    const programBookUpdateCommand = new UpdateProgramBookCommand(props, null);
    return Result.ok<UpdateProgramBookCommand>(programBookUpdateCommand);
  }

  public static guard(props: IUpdateProgramBookCommandProps) {
    const guardBase = ProgramBookCommand.guard(props);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.id,
        argumentName: 'id',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk), guardBase]);
  }

  public get id(): IUuid {
    return this.props.id;
  }
}

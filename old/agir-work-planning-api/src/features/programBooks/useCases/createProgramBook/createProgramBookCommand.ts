import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IProgramBookCommandProps, ProgramBookCommand } from '../programBookCommand';

// tslint:disable:no-empty-interface
export interface ICreateProgramBookCommandProps extends IProgramBookCommandProps {
  annualProgramId: IUuid;
}

export class CreateProgramBookCommand extends ProgramBookCommand<ICreateProgramBookCommandProps> {
  public static create(props: ICreateProgramBookCommandProps): Result<CreateProgramBookCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<CreateProgramBookCommand>(guard);
    }
    const programBookCreateCommand = new CreateProgramBookCommand(props, null);
    return Result.ok<CreateProgramBookCommand>(programBookCreateCommand);
  }

  public static guard(props: ICreateProgramBookCommandProps) {
    const guardBase = ProgramBookCommand.guard(props);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.annualProgramId,
        argumentName: 'annualProgramId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk), guardBase]);
  }

  public get annualProgramId(): IUuid {
    return this.props.annualProgramId;
  }
}

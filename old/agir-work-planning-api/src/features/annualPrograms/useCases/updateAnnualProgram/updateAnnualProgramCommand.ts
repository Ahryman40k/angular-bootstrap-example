import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { AnnualProgramCommand, IAnnualProgramCommandProps } from '../annualProgramCommand';

// tslint:disable:no-empty-interface
export interface IUpdateAnnualProgramCommandProps extends IAnnualProgramCommandProps {
  id: IUuid;
}

export class UpdateAnnualProgramCommand extends AnnualProgramCommand<IUpdateAnnualProgramCommandProps> {
  public static create(props: IUpdateAnnualProgramCommandProps): Result<UpdateAnnualProgramCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<UpdateAnnualProgramCommand>(guard);
    }
    const annualProgramUpdateCommand = new UpdateAnnualProgramCommand(props, null);
    return Result.ok<UpdateAnnualProgramCommand>(annualProgramUpdateCommand);
  }

  public static guard(props: IUpdateAnnualProgramCommandProps) {
    const guardBase = AnnualProgramCommand.guard(props);
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

import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType, IGuardResult } from '../../logic/guard';
import { Result } from '../../logic/result';
import { ByIdCommand, IByIdCommandProps } from './byIdCommand';

export interface IByUuidCommandProps extends IByIdCommandProps {
  id: IUuid;
}

export class ByUuidCommand extends ByIdCommand<IByUuidCommandProps> {
  public static create(props: IByUuidCommandProps): Result<ByUuidCommand> {
    const guardBase = ByIdCommand.guard(props);
    let guardId = { succeeded: true };
    if (guardBase.succeeded) {
      guardId = this.guardIdFormat(props.id);
    }
    const guard = Guard.combine([guardBase, guardId]);
    if (!guard.succeeded) {
      return Result.fail<ByIdCommand<any>>(guard);
    }

    const byUuidCommand = new ByUuidCommand(props);
    return Result.ok<ByUuidCommand>(byUuidCommand);
  }

  private static guardIdFormat(id: IUuid): IGuardResult {
    return Guard.guard({
      argument: id,
      argumentName: 'id',
      guardType: [GuardType.VALID_UUID]
    });
  }
}

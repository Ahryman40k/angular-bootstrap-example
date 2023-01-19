import { Guard, GuardType, IGuardResult } from '../../logic/guard';
import { Result } from '../../logic/result';
import { Command } from '../command';

export interface IByIdCommandProps {
  id: string;
  expand?: string;
  fields?: string | string[];
}

export class ByIdCommand<P extends IByIdCommandProps> extends Command<P> {
  public static create(
    props: IByIdCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<ByIdCommand<IByIdCommandProps>> {
    const guard = this.guard(props, entityIdGuardType);
    if (!guard.succeeded) {
      return Result.fail<ByIdCommand<any>>(guard);
    }

    const byUuidCommand = new ByIdCommand(props);
    return Result.ok<ByIdCommand<IByIdCommandProps>>(byUuidCommand);
  }

  public static guard(props: IByIdCommandProps, entityIdGuardType: GuardType = GuardType.VALID_UUID): IGuardResult {
    return Guard.guard({
      argument: props.id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, entityIdGuardType]
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get expand(): string {
    return this.props.expand;
  }

  public get fields(): string | string[] {
    return this.props.fields;
  }
}

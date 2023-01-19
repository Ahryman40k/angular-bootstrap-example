import { ByIdCommand, IByIdCommandProps } from '../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../utils/arrayUtils';

export class ByProjectIdCommand<P extends IByIdCommandProps> extends ByIdCommand<P> {
  public static create(props: IByIdCommandProps): Result<ByProjectIdCommand<IByIdCommandProps>> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<ByProjectIdCommand<IByIdCommandProps>>(guardResult);
    }

    const byProjectIdsCommand = new ByProjectIdCommand(props);
    return Result.ok<ByProjectIdCommand<IByIdCommandProps>>(byProjectIdsCommand);
  }

  public static guard(props: IByIdCommandProps): IGuardResult {
    // can handle multiple projects ids
    const ids = convertStringOrStringArray(props.id);
    const guardIds = ids.map((id, index) =>
      Guard.guard({
        argument: id,
        argumentName: `id[${index}]`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
      })
    );
    return Guard.combine(guardIds);
  }
}

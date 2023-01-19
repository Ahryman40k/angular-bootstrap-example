import { ByIdCommand, IByIdCommandProps } from '../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../utils/arrayUtils';

export class ByInterventionIdCommand<P extends IByIdCommandProps> extends ByIdCommand<P> {
  public static create(props: IByIdCommandProps): Result<ByInterventionIdCommand<IByIdCommandProps>> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<ByInterventionIdCommand<IByIdCommandProps>>(guardResult);
    }

    const byInterventionIdCommand = new ByInterventionIdCommand(props);
    return Result.ok<ByInterventionIdCommand<IByIdCommandProps>>(byInterventionIdCommand);
  }

  public static guard(props: IByIdCommandProps): IGuardResult {
    // can handle multiple interventions ids
    const ids = convertStringOrStringArray(props.id);
    const guardIds = ids.map((id, index) =>
      Guard.guard({
        argument: id,
        argumentName: `id[${index}]`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_INTERVENTION_ID]
      })
    );
    return Guard.combine(guardIds);
  }
}

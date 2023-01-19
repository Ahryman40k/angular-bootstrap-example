import { Result } from '../../../../shared/logic/result';
import { IObjectiveCommandProps, ObjectiveCommand } from '../programBookObjectiveCommand';

// tslint:disable:no-empty-interface
export interface ICreateProgramBookObjectiveCommandProps extends IObjectiveCommandProps {}

export class CreateProgramBookObjectiveCommand extends ObjectiveCommand<ICreateProgramBookObjectiveCommandProps> {
  public static create(props: ICreateProgramBookObjectiveCommandProps): Result<CreateProgramBookObjectiveCommand> {
    const guard = ObjectiveCommand.guard(props);
    if (!guard.succeeded) {
      return Result.fail<CreateProgramBookObjectiveCommand>(guard);
    }
    const objectiveCreateCommand = new CreateProgramBookObjectiveCommand(props, undefined);
    return Result.ok<CreateProgramBookObjectiveCommand>(objectiveCreateCommand);
  }
}

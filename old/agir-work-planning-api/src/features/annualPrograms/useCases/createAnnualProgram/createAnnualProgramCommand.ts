import { Result } from '../../../../shared/logic/result';
import { AnnualProgramCommand, IAnnualProgramCommandProps } from '../annualProgramCommand';

// tslint:disable:no-empty-interface
export interface ICreateAnnualProgramCommandProps extends IAnnualProgramCommandProps {}

export class CreateAnnualProgramCommand extends AnnualProgramCommand<ICreateAnnualProgramCommandProps> {
  public static create(props: ICreateAnnualProgramCommandProps): Result<CreateAnnualProgramCommand> {
    const guard = AnnualProgramCommand.guard(props);
    if (!guard.succeeded) {
      return Result.fail<CreateAnnualProgramCommand>(guard);
    }
    const annualProgramCreateCommand = new CreateAnnualProgramCommand(props, null);
    return Result.ok<CreateAnnualProgramCommand>(annualProgramCreateCommand);
  }
}

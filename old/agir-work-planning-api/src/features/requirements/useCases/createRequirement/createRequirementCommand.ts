import { Result } from '../../../../shared/logic/result';
import { IPlainRequirementProps, PlainRequirement } from '../../models/plainRequirement';

// tslint:disable:no-empty-interface
export interface ICreateRequirementCommandProps extends IPlainRequirementProps {}

export class CreateRequirementCommand extends PlainRequirement<IPlainRequirementProps> {
  public static create(props: ICreateRequirementCommandProps): Result<CreateRequirementCommand> {
    const guard = PlainRequirement.guard(props);
    if (!guard.succeeded) {
      return Result.fail<CreateRequirementCommand>(guard);
    }

    const requirementCommand = new CreateRequirementCommand(props, undefined);
    return Result.ok<CreateRequirementCommand>(requirementCommand);
  }
}

import { IPlainRequirement, IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';

import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { PlainRequirement } from '../../models/plainRequirement';

// tslint:disable:no-empty-interface
export interface IUpdateRequirementCommandProps extends IPlainRequirement {
  id: IUuid;
}

export class UpdateRequirementCommand extends PlainRequirement<IUpdateRequirementCommandProps> {
  public static create(props: IUpdateRequirementCommandProps): Result<UpdateRequirementCommand> {
    const guard = Guard.combine([PlainRequirement.guard(props), this.guardId(props)]);
    if (!guard.succeeded) {
      return Result.fail<UpdateRequirementCommand>(guard);
    }

    const requirementCommand = new UpdateRequirementCommand(props, props.id);
    return Result.ok<UpdateRequirementCommand>(requirementCommand);
  }

  public static guardId(props: IUpdateRequirementCommandProps): IGuardResult {
    return Guard.guard({
      argument: props.id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
    });
  }
}

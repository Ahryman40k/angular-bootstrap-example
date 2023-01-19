import { RequirementTargetType } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../utils/arrayUtils';
import { enumValues } from '../../../utils/enumUtils';
import { RequirementItem } from './requirementItem';

// tslint:disable:no-empty-interface
export interface IRequirementCriterias extends ICriterias {
  itemId?: string | string[];
  itemType?: string;
}

export interface IRequirementFindOptionsProps extends IFindOptionsProps {
  criterias: IRequirementCriterias;
}

export class RequirementFindOptions extends FindOptions<IRequirementFindOptionsProps> {
  public static create(props: IRequirementFindOptionsProps): Result<RequirementFindOptions> {
    const guard = RequirementFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<RequirementFindOptions>(guard);
    }
    const requirementFindOptions = new RequirementFindOptions(props);
    return Result.ok<RequirementFindOptions>(requirementFindOptions);
  }

  public static guard(props: IRequirementFindOptionsProps): IGuardResult {
    const findOptionsGuard = FindOptions.guard(props);
    const guardItemType = Guard.guard({
      argument: props.criterias.itemType,
      argumentName: `itemType`,
      guardType: [GuardType.IS_ONE_OF],
      values: enumValues(RequirementTargetType)
    });

    const itemIds = convertStringOrStringArray(props.criterias.itemId);
    const guardIds = itemIds.map(itemId => RequirementItem.guardItemId(itemId, props.criterias.itemType));

    return Guard.combine([guardItemType, ...guardIds, findOptionsGuard]);
  }
}

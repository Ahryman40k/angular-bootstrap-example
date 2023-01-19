import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface ITaxonomyCriterias extends ICriterias {
  id?: string | string[];
  group?: string | string[];
  code?: string | string[];
  properties?: { [key: string]: any };
}

export interface ITaxonomyFindOptionsProps extends IFindOptionsProps {
  criterias: ITaxonomyCriterias;
}

export class TaxonomyFindOptions extends FindOptions<ITaxonomyFindOptionsProps> {
  public static create(props: ITaxonomyFindOptionsProps): Result<TaxonomyFindOptions> {
    const guard = TaxonomyFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<TaxonomyFindOptions>(guard);
    }
    const taxonomyFindOptions = new TaxonomyFindOptions(props);
    return Result.ok<TaxonomyFindOptions>(taxonomyFindOptions);
  }

  public static guard(props: ITaxonomyFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = TaxonomyFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: ITaxonomyCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    let guardGroup = [{ succeeded: true }];
    if (criterias.group) {
      const groups = Array.isArray(criterias.group) ? criterias.group : [criterias.group];
      guardGroup = this.guardGroup(groups);
    }
    const guardBulk: IGuardArgument[] = [];
    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardGroup]);
  }

  protected static guardGroup(groups: string[]): IGuardResult[] {
    return groups.map((group, index) =>
      Guard.guard({
        argument: group,
        argumentName: `group[${index}]`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(TaxonomyGroup)
      })
    );
  }
}

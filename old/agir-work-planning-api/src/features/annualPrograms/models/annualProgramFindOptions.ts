import { AnnualProgramStatus, Role } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IAnnualProgramCriterias extends ICriterias {
  id?: string;
  sharedRoles?: Role[];
  year?: number;
  fromYear?: number;
  toYear?: number;
  executorId?: string | string[];
  status?: AnnualProgramStatus[];
}

export interface IAnnualProgramFindOptionsProps extends IFindOptionsProps {
  criterias: IAnnualProgramCriterias;
}

export class AnnualProgramFindOptions extends FindOptions<IAnnualProgramFindOptionsProps> {
  public static create(props: IAnnualProgramFindOptionsProps): Result<AnnualProgramFindOptions> {
    const guard = AnnualProgramFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AnnualProgramFindOptions>(guard);
    }
    const annualProgramFindOptions = new AnnualProgramFindOptions(props);
    return Result.ok<AnnualProgramFindOptions>(annualProgramFindOptions);
  }

  public static guard(props: IAnnualProgramFindOptionsProps): IGuardResult {
    const guardFindOptionsBase = FindOptions.guard(props);
    const guardCriterias = AnnualProgramFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardFindOptionsBase, guardCriterias]);
  }

  private static guardCriterias(criterias: IAnnualProgramCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [
      {
        argument: criterias.id,
        argumentName: 'id',
        guardType: [GuardType.VALID_UUID]
      },
      {
        argument: criterias.year,
        argumentName: 'year',
        guardType: [GuardType.VALID_YEAR]
      },
      {
        argument: criterias.fromYear,
        argumentName: 'year',
        guardType: [GuardType.VALID_YEAR]
      },
      {
        argument: criterias.toYear,
        argumentName: 'year',
        guardType: [GuardType.VALID_YEAR]
      },
      {
        argument: criterias.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(AnnualProgramStatus)
      }
    ];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }
}

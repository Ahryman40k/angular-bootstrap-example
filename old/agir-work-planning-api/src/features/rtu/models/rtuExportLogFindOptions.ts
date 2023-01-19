import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { RtuExportStatus } from './rtuExportLog';

export interface IRtuExportLogCriterias extends ICriterias {
  status?: RtuExportStatus;
}

export interface IRtuExportLogFindOptionsProps extends IFindOptionsProps {
  criterias: IRtuExportLogCriterias;
}

export class RtuExportLogFindOptions extends FindOptions<IRtuExportLogFindOptionsProps> {
  public static create(props: IRtuExportLogFindOptionsProps): Result<RtuExportLogFindOptions> {
    const guard = RtuExportLogFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<RtuExportLogFindOptions>(guard);
    }
    const rtuExportLogFindOptions = new RtuExportLogFindOptions(props);
    return Result.ok<RtuExportLogFindOptions>(rtuExportLogFindOptions);
  }

  public static guard(props: IRtuExportLogFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = RtuExportLogFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IRtuExportLogCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [
      {
        argument: criterias.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(RtuExportStatus)
      }
    ];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }
}

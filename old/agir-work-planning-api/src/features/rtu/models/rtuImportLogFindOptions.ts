import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { RtuImportStatus } from './rtuImportLog';

export interface IRtuImportLogCriterias extends ICriterias {
  status?: RtuImportStatus[];
}

export interface IRtuImportLogFindOptionsProps extends IFindOptionsProps {
  criterias: IRtuImportLogCriterias;
}

export class RtuImportLogFindOptions extends FindOptions<IRtuImportLogFindOptionsProps> {
  public static create(props: IRtuImportLogFindOptionsProps): Result<RtuImportLogFindOptions> {
    const guard = RtuImportLogFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<RtuImportLogFindOptions>(guard);
    }
    const rtuImportLogFindOptions = new RtuImportLogFindOptions(props);
    return Result.ok<RtuImportLogFindOptions>(rtuImportLogFindOptions);
  }

  public static guard(props: IRtuImportLogFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = RtuImportLogFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IRtuImportLogCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }
}

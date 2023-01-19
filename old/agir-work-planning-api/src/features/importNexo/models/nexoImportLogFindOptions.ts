import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

export interface INexoImportLogCriterias extends ICriterias {
  status?: string[];
  excludeIds?: string[];
}

export interface INexoImportLogFindOptionsProps extends IFindOptionsProps {
  criterias: INexoImportLogCriterias;
}

export class NexoImportLogFindOptions extends FindOptions<INexoImportLogFindOptionsProps> {
  public static create(props: INexoImportLogFindOptionsProps): Result<NexoImportLogFindOptions> {
    const guard = NexoImportLogFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<NexoImportLogFindOptions>(guard);
    }
    const constraintFindOptions = new NexoImportLogFindOptions(props);
    return Result.ok<NexoImportLogFindOptions>(constraintFindOptions);
  }

  public static guard(props: INexoImportLogFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = NexoImportLogFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: INexoImportLogCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }
}

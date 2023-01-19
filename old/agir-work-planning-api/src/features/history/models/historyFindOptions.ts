import { EntityType } from '../../../../config/constants';
import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IHistoryCriterias extends ICriterias {
  objectTypeId?: EntityType;
  referenceId?: string;
  statusFrom?: string | string[];
  statusTo?: string | string[];
}

export interface IHistoryFindOptionsProps extends IFindOptionsProps {
  criterias: IHistoryCriterias;
}

export class HistoryFindOptions extends FindOptions<IHistoryFindOptionsProps> {
  public static create(props: IHistoryFindOptionsProps): Result<HistoryFindOptions> {
    const guard = HistoryFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<HistoryFindOptions>(guard);
    }
    const historyFindOptions = new HistoryFindOptions(props);
    return Result.ok<HistoryFindOptions>(historyFindOptions);
  }

  public static guard(props: IHistoryFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = HistoryFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IHistoryCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }
}

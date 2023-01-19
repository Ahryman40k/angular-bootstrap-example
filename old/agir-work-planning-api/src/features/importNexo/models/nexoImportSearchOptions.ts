import { NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { INexoImportLogCriterias, INexoImportLogFindOptionsProps } from './nexoImportLogFindOptions';
export interface INexoImportLogPaginatedFindOptionsProps extends INexoImportLogFindOptionsProps, IFindPaginatedProps {
  criterias: INexoImportLogCriterias;
  limit: number;
  offset: number;
}

export class NexoImportSearchOptions extends FindPaginated<INexoImportLogPaginatedFindOptionsProps> {
  public static create(props: INexoImportLogPaginatedFindOptionsProps): Result<NexoImportSearchOptions> {
    const guard = NexoImportSearchOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<NexoImportSearchOptions>(guard);
    }
    this.setDefaultCriterias(props);
    const nexoImportSearchOptions = new NexoImportSearchOptions(props);
    return Result.ok<NexoImportSearchOptions>(nexoImportSearchOptions);
  }

  public static guard(props: INexoImportLogPaginatedFindOptionsProps): IGuardResult {
    const statusGuard = Guard.guard({
      argument: props.criterias.status,
      argumentName: 'status',
      guardType: [GuardType.IS_ONE_OF],
      values: enumValues(NexoImportStatus)
    });
    return Guard.combine([FindPaginated.guard(props), statusGuard]);
  }

  private static setDefaultCriterias(props: INexoImportLogPaginatedFindOptionsProps) {
    if (!props.criterias) {
      props.criterias = {};
    }
  }
}

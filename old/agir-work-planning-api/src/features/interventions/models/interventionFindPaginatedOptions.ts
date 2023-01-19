import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  IInterventionCriterias,
  IInterventionFindOptionsProps,
  InterventionFindOptions
} from './interventionFindOptions';

export interface IInterventionFindPaginatedOptionsProps extends IInterventionFindOptionsProps, IFindPaginatedProps {
  criterias: IInterventionCriterias;
  limit: number;
  offset: number;
}

export class InterventionFindPaginatedOptions extends FindPaginated<IInterventionFindPaginatedOptionsProps> {
  public static create(props: IInterventionFindPaginatedOptionsProps): Result<InterventionFindOptions> {
    const guardFindOptions = InterventionFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<InterventionFindOptions>(guard);
    }
    InterventionFindOptions.setDefaultValues(props);
    const interventionFindOptions = new InterventionFindOptions(props);
    return Result.ok<InterventionFindOptions>(interventionFindOptions);
  }
}

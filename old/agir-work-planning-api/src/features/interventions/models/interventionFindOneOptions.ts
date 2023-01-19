import { FindOne } from '../../../shared/findOptions/findOne';
import { Result } from '../../../shared/logic/result';
import { IInterventionFindOptionsProps, InterventionFindOptions } from './interventionFindOptions';

export class InterventionFindOneOptions extends FindOne<IInterventionFindOptionsProps> {
  public static create(props: IInterventionFindOptionsProps): Result<InterventionFindOptions> {
    const guard = InterventionFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<InterventionFindOptions>(guard);
    }
    InterventionFindOptions.setDefaultValues(props);
    const interventionFindOptions = new InterventionFindOptions(props);
    return Result.ok<InterventionFindOptions>(interventionFindOptions);
  }
}

import { FindOne } from '../../../shared/findOptions/findOne';
import { Result } from '../../../shared/logic/result';
import { AnnualProgramFindOptions, IAnnualProgramFindOptionsProps } from './annualProgramFindOptions';

export class AnnualProgramFindOneOptions extends FindOne<IAnnualProgramFindOptionsProps> {
  public static create(props: IAnnualProgramFindOptionsProps): Result<AnnualProgramFindOneOptions> {
    const guard = AnnualProgramFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AnnualProgramFindOptions>(guard);
    }
    const annualProgramFindOptions = new AnnualProgramFindOptions(props);
    return Result.ok<AnnualProgramFindOptions>(annualProgramFindOptions);
  }
}

import { FindOne } from '../../../shared/findOptions/findOne';
import { Result } from '../../../shared/logic/result';
import { IProgramBookFindOptionsProps, ProgramBookFindOptions } from './programBookFindOptions';

export class ProgramBookFindOneOptions extends FindOne<IProgramBookFindOptionsProps> {
  public static create(props: IProgramBookFindOptionsProps): Result<ProgramBookFindOneOptions> {
    const guard = ProgramBookFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProgramBookFindOneOptions>(guard);
    }
    ProgramBookFindOptions.setDefaultValues(props);
    const programBookFindOptions = new ProgramBookFindOneOptions(props);
    return Result.ok<ProgramBookFindOneOptions>(programBookFindOptions);
  }
}

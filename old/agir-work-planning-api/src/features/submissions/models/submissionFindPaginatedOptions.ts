import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { ISubmissionCriterias, ISubmissionFindOptionsProps, SubmissionFindOptions } from './submissionFindOptions';

export interface ISubmissionFindPaginatedOptionsProps extends ISubmissionFindOptionsProps, IFindPaginatedProps {
  criterias: ISubmissionCriterias;
  limit: number;
  offset: number;
}

export class SubmissionFindPaginatedOptions extends FindPaginated<ISubmissionFindPaginatedOptionsProps> {
  public static create(props: ISubmissionFindPaginatedOptionsProps): Result<SubmissionFindPaginatedOptions> {
    const guardFindOptions = SubmissionFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<SubmissionFindPaginatedOptions>(guard);
    }
    const submissionFindOptions = new SubmissionFindPaginatedOptions(props);
    return Result.ok<SubmissionFindPaginatedOptions>(submissionFindOptions);
  }
}

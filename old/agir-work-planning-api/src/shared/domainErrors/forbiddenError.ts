import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class ForbiddenError extends Result<UseCaseError> {
  public constructor(err: any) {
    super(false, {
      message: err ? err : `Forbidden Error`,
      error: err
    } as UseCaseError);
  }
}

import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class ConflictError extends Result<UseCaseError> {
  public constructor(err: any, message?: string) {
    super(false, {
      message: message ? message : `Conflict Error`,
      error: err
    } as UseCaseError);
  }
}

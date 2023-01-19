import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class AlreadyExistsError extends Result<UseCaseError> {
  public constructor(err: any, message?: string) {
    super(false, {
      message: message ? message : `Already Exists Error`,
      error: err
    } as UseCaseError);
  }
}

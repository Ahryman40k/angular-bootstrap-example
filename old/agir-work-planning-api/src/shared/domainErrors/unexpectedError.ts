import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class UnexpectedError extends Result<UseCaseError> {
  public static create(err: any, message?: string): UnexpectedError {
    return new UnexpectedError(err, message);
  }

  public constructor(err: any, msg?: string) {
    super(false, {
      message: msg ? msg : `Unexpected Error`,
      error: err
    } as UseCaseError);
  }
}

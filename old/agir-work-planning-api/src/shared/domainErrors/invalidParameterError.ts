import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class InvalidParameterError extends Result<UseCaseError> {
  public constructor(err: any, msg?: string) {
    super(false, {
      message: msg ? msg : `Invalid Parameter Error`,
      error: err
    } as UseCaseError);
  }
}

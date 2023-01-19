import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class NetworkRequestError extends Result<UseCaseError> {
  public constructor(err: any, message?: string) {
    super(false, {
      message: message ? message : `Network request error`,
      error: err
    } as UseCaseError);
  }
}

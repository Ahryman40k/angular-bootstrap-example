import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export const SHOULD_BE_UNPROCESSABLE_ERROR = 'should be UnprocessableEntityError';
export class UnprocessableEntityError extends Result<UseCaseError> {
  public constructor(err: any, msg?: string) {
    super(false, {
      message: msg ? msg : `Unprocessable Entity`,
      error: err
    } as UseCaseError);
  }
}

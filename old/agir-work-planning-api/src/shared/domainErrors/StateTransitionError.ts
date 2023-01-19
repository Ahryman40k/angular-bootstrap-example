import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class StateTransitionError extends Result<UseCaseError> {
  public static create(err: any, message?: string): StateTransitionError {
    return new StateTransitionError(err, message);
  }

  public constructor(err: any, msg?: string) {
    super(false, {
      message: msg ? msg : `Transition error`,
      error: err
    } as UseCaseError);
  }
}

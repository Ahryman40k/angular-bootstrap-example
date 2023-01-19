import { Result } from '../logic/result';
import { UseCaseError } from '../logic/useCaseError';

export class NotFoundError extends Result<UseCaseError> {
  public constructor(err: any) {
    super(false, {
      message: err ? err : `The requested ressource was not found`,
      error: err
    } as UseCaseError);
  }
}

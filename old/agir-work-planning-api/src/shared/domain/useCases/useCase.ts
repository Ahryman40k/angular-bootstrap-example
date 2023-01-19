import { Either } from '../../logic/either';
import { Result } from '../../logic/result';
import { UseCaseError } from '../../logic/useCaseError';
import { IUseCase } from '../iUseCase';

export type Response<O> = Either<Result<UseCaseError>, Result<O>>;

export abstract class UseCase<I, O> implements IUseCase<I, Response<O>> {
  public abstract execute(req: I): Promise<Response<O>>;
}

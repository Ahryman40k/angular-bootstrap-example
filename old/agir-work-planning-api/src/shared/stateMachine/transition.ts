import { Result } from '../logic/result';

export interface ITransition<T, O, R> {
  from: string;
  to: string;
  run(source: T, target: string, options?: O): Promise<Result<R>>;
}

export abstract class Transition<T, O, R> implements ITransition<T, O, R> {
  public from: string;
  public to: string;

  public abstract run(source: T, target: string, options?: O): Promise<Result<R>>;
}

import { Either } from './either';
import { Left } from './left';

export class Right<L, A> {
  public readonly value: A;

  constructor(value: A) {
    this.value = value;
  }

  public isLeft(): this is Left<L, A> {
    return false;
  }

  public isRight(): this is Right<L, A> {
    return true;
  }
}

export const right = <L, A>(a: A): Either<L, A> => {
  return new Right<L, A>(a);
};

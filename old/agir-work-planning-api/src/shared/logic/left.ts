import { Either } from './either';
import { Right } from './right';

export class Left<L, A> {
  public readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  public isLeft(): this is Left<L, A> {
    return true;
  }

  public isRight(): this is Right<L, A> {
    return false;
  }
}

export const left = <L, A>(l: L): Either<L, A> => {
  return new Left(l);
};

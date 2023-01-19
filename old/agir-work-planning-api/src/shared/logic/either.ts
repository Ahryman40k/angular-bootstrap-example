import { Left } from './left';
import { Right } from './right';

export type Either<L, A> = Left<L, A> | Right<L, A>;

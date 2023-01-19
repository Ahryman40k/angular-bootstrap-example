import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Guard } from '../logic/guard';
import { Result } from '../logic/result';
import { ITransition } from './transition';

export interface IStatuable {
  status?: string;
}

export abstract class StateMachineRunnable<T extends IStatuable, O, R> {
  public transitions: ITransition<T, O, R>[] = [];

  public async execute(source: T, target: string, options?: any): Promise<Result<R>> {
    const transition = this.findTransition(source.status, target);
    if (transition) {
      return transition.run(source, transition.to, options);
    }
    if (source.status === target) {
      return Result.ok();
    }
    return Result.fail(
      Guard.error(
        'status',
        ErrorCodes.InvalidStatusTransition,
        `Cannot transit status from "${source.status}" to "${target}".`
      )
    );
  }

  private findTransition(statusFrom: string, statusTo: string): ITransition<T, O, R> {
    return this.transitions.find(t => t.from.includes(statusFrom) && t.to === statusTo);
  }

  public isStateTransitionPossible(statusFrom: string, statusTo: string): boolean {
    const transition = this.findTransition(statusFrom, statusTo);
    return !isEmpty(transition);
  }
}

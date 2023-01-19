import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import { createUnprocessableEntityError } from '@villemontreal/core-utils-general-nodejs-lib/dist/src';
import * as _ from 'lodash';

export interface IStatuable {
  status?: string;
}

export interface ITransition2<T> {
  from: string | string[];
  to: string;
  transit: (source: T, target: string, options: any) => Promise<T> | T;
}

export class StateMachine2<T extends IStatuable> {
  public transitions: ITransition2<T>[] = [];

  public async transit(source: T, target: string, options?: any): Promise<T> {
    const statusFrom = source.status || null;
    const statusTo = target;

    const transition = this.findTransition(statusFrom, statusTo);
    if (transition) {
      return transition.transit(source, target, options);
    }
    if (statusFrom === statusTo) {
      return source;
    }

    throw createUnprocessableEntityError(`Invalid status transition.`, [
      {
        code: ErrorCodes.InvalidStatusTransition,
        message: `Cannot transit status from "${statusFrom}" to "${statusTo}".`,
        target: 'status'
      }
    ]);
  }

  private findTransition(statusFrom: string, statusTo: string): ITransition2<T> {
    return this.transitions.find(t => t.from.includes(statusFrom) && t.to === statusTo);
  }

  public isStateTransitionPossible(statusFrom: string, statusTo: string): boolean {
    if (statusFrom === statusTo) {
      return true;
    }
    const transition = this.findTransition(statusFrom, statusTo);
    return !_.isEmpty(transition);
  }
}

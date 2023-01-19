import { IProjectRank } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IProjectRankProps extends IProjectRank {}

export class ProjectRank extends AggregateRoot<IProjectRankProps> {
  public static create(props: IProjectRankProps): Result<ProjectRank> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProjectRank>(guard);
    }
    const orderedProject = new ProjectRank(props, undefined);
    return Result.ok<ProjectRank>(orderedProject);
  }

  public static guard(props: IProjectRankProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.newRank,
        argumentName: 'newRank',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.note,
        argumentName: 'note',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.isManuallyOrdered,
        argumentName: 'isManuallyOrdered',
        guardType: [GuardType.IS_BOOLEAN]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get newRank(): number {
    return this.props.newRank;
  }

  public get note(): string {
    return this.props.note;
  }

  public get isManuallyOrdered(): boolean {
    return this.props.isManuallyOrdered;
  }

  public equals(otherProjectRank: ProjectRank): boolean {
    return super.equals(otherProjectRank) && this.innerEquals(otherProjectRank);
  }

  private innerEquals(otherProjectRank: ProjectRank): boolean {
    return this.newRank === otherProjectRank.newRank;
  }
}

import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { isEmpty } from '../../../utils/utils';
import { IPriorityLevelMongoAttributes } from '../mongo/priorityLevelSchema';
import { IPlainPriorityLevelProps, PlainPriorityLevel } from './plainPriorityLevel';
import { PriorityLevelCriteria } from './priorityLevelCriteria';
import { PriorityLevelSortCriteria } from './priorityLevelSortCriteria';

// tslint:disable:no-empty-interface
export interface IPriorityLevelProps extends IPlainPriorityLevelProps {
  isSystemDefined?: boolean;
  projectCount?: number;
}

export class PriorityLevel extends PlainPriorityLevel<IPriorityLevelProps> {
  public static create(props: IPriorityLevelProps): Result<PriorityLevel> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<PriorityLevel>(guardResult);
    }
    const prioritylevel = new PriorityLevel(props);
    return Result.ok<PriorityLevel>(prioritylevel);
  }

  public static async toDomainModel(raw: IPriorityLevelMongoAttributes): Promise<PriorityLevel> {
    const criteria = await PriorityLevelCriteria.toDomainModel(raw.criteria);
    let sortCriterias: PriorityLevelSortCriteria[];
    if (!isEmpty(raw.sortCriterias)) {
      sortCriterias = await Promise.all(raw.sortCriterias.map(async c => PriorityLevelSortCriteria.toDomainModel(c)));
    }
    return PriorityLevel.create({
      rank: raw.rank,
      criteria,
      isSystemDefined: raw.isSystemDefined,
      projectCount: raw.projectCount,
      sortCriterias
    }).getValue();
  }

  public static guard(props: IPriorityLevelProps, valueName = ''): IGuardResult {
    const guardPlain = PlainPriorityLevel.guard(props, valueName);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.isSystemDefined,
        argumentName: `isSystemDefined`,
        guardType: [GuardType.IS_BOOLEAN]
      },
      {
        argument: props.projectCount,
        argumentName: `projectCount`,
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      }
    ];
    return Guard.combine([guardPlain, ...Guard.guardBulk(guardBulk)]);
  }

  public static toPersistence(priorityLevel: PriorityLevel): IPriorityLevelMongoAttributes {
    return {
      rank: priorityLevel.rank,
      criteria: PriorityLevelCriteria.toPersistence(priorityLevel.criteria),
      isSystemDefined: priorityLevel.isSystemDefined,
      projectCount: priorityLevel.projectCount,
      sortCriterias: priorityLevel.sortCriterias.map(criteria => PriorityLevelSortCriteria.toPersistance(criteria))
    };
  }

  public static getDefault(): PriorityLevel {
    const defaultProps: IPriorityLevelProps = {
      rank: 1,
      criteria: PriorityLevelCriteria.getDefault(),
      isSystemDefined: true,
      projectCount: 0,
      sortCriterias: PriorityLevelSortCriteria.getDefault()
    };
    return PriorityLevel.create(defaultProps).getValue();
  }

  public get isSystemDefined(): boolean {
    return this.props.isSystemDefined;
  }

  public get projectCount(): number {
    return this.props.projectCount;
  }
}

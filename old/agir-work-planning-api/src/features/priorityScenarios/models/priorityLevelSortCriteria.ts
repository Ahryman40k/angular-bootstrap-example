import { IPriorityLevelSortCriteria, ProgramBookPriorityLevelSort } from '@villemontreal/agir-work-planning-lib';
import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IPriorityLevelSortCriteriaMongoAttributes } from '../mongo/priorityLevelSortCriteriaSchema';

export enum OrderBy {
  ASC = 'asc',
  DESC = 'desc'
}

// tslint:disable:no-empty-interface
export interface IPriorityLevelSortCriteriaProps extends IPriorityLevelSortCriteria {}

export class PriorityLevelSortCriteria extends GenericEntity<IPriorityLevelSortCriteriaProps> {
  public static create(props: IPriorityLevelSortCriteriaProps): Result<PriorityLevelSortCriteria> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<PriorityLevelSortCriteria>(guard);
    }
    const priorityLevelSortCriteria = new PriorityLevelSortCriteria(props);
    return Result.ok<PriorityLevelSortCriteria>(priorityLevelSortCriteria);
  }

  public static guard(props: IPriorityLevelSortCriteriaProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.name,
        argumentName: `${valueName}name`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.rank,
        argumentName: `${valueName}rank`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_POSITIVE_INTEGER]
      },
      {
        argument: props.service,
        argumentName: `${valueName}service`,
        guardType: [GuardType.EMPTY_STRING]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(
    raw: IPriorityLevelSortCriteriaMongoAttributes
  ): Promise<PriorityLevelSortCriteria> {
    return PriorityLevelSortCriteria.create({
      name: raw.name,
      rank: raw.rank,
      service: raw.service
    }).getValue();
  }

  public static toPersistance(
    priorityLevelSortCriteria: PriorityLevelSortCriteria
  ): IPriorityLevelSortCriteriaMongoAttributes {
    return {
      name: priorityLevelSortCriteria.name,
      rank: priorityLevelSortCriteria.rank,
      service: priorityLevelSortCriteria.service
    };
  }

  public static getDefault(): PriorityLevelSortCriteria[] {
    return [
      {
        name: ProgramBookPriorityLevelSort.NUMBER_OF_INTERVENTIONS_PER_PROJECT,
        rank: 1
      },
      {
        name: ProgramBookPriorityLevelSort.NUMBER_OF_CONTRIBUTIONS_TO_THRESHOLD,
        rank: 2
      },
      {
        name: ProgramBookPriorityLevelSort.ROAD_NETWORK_TYPE,
        rank: 3
      },
      {
        name: ProgramBookPriorityLevelSort.PROJECT_BUDGET,
        rank: 4
      },
      {
        name: ProgramBookPriorityLevelSort.PROJECT_ID,
        rank: 5
      }
    ].map(sc => PriorityLevelSortCriteria.create(sc).getValue());
  }

  public get name(): string {
    return this.props.name;
  }

  public get rank(): number {
    return this.props.rank;
  }

  public get service(): string {
    return this.props.service;
  }

  public equals(otherPriorityLevelSortCriteria: PriorityLevelSortCriteria): boolean {
    return this.innerEquals(otherPriorityLevelSortCriteria);
  }

  private innerEquals(otherPriorityLevelSortCriteria: PriorityLevelSortCriteria): boolean {
    return (
      this.name === otherPriorityLevelSortCriteria.name &&
      this.rank === otherPriorityLevelSortCriteria.rank &&
      this.service === otherPriorityLevelSortCriteria.service
    );
  }
}

export const isPriorityLevelSortCriteria = (v: any): v is PriorityLevelSortCriteria => {
  return v instanceof PriorityLevelSortCriteria;
};

import { IObjectiveCalculation, IOrderedProject } from '@villemontreal/agir-work-planning-lib';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { IOrderedProjectMongoAttributes } from '../mongo/orderedProjectSchema';

export const ORDEREDPROJECTS_MANDATORY_FIELDS = ['projectId', 'audit'];
export interface IOrderedProjectProps extends IOrderedProject, IAuditableProps {
  projectId: string;
  audit: Audit;
}

export class OrderedProject extends Auditable(AggregateRoot)<IOrderedProjectProps> {
  public static create(props: IOrderedProjectProps): Result<OrderedProject> {
    const guardBasic = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guard = Guard.combine([guardBasic, guardAudit]);
    if (!guard.succeeded) {
      return Result.fail<OrderedProject>(guard);
    }
    const orderedProject = new OrderedProject(props, undefined);
    return Result.ok<OrderedProject>(orderedProject);
  }

  public static guard(props: IOrderedProjectProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.projectId,
        argumentName: 'projectId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
      },
      {
        argument: props.levelRank,
        argumentName: 'levelRank',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.initialRank,
        argumentName: 'initialRank',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.rank,
        argumentName: 'rank',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.isManuallyOrdered,
        argumentName: 'isManuallyOrdered',
        guardType: [GuardType.IS_BOOLEAN]
      },
      {
        argument: props.note,
        argumentName: 'note',
        guardType: [GuardType.EMPTY_STRING]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IOrderedProjectMongoAttributes): Promise<OrderedProject> {
    return OrderedProject.create({
      projectId: raw.projectId,
      levelRank: raw.levelRank,
      initialRank: raw.initialRank,
      rank: raw.rank,
      isManuallyOrdered: raw.isManuallyOrdered,
      note: raw.note,
      audit: await Audit.toDomainModel(raw.audit)
    }).getValue();
  }

  public static toPersistence(orderedProject: OrderedProject): IOrderedProjectMongoAttributes {
    return {
      projectId: orderedProject.projectId,
      levelRank: orderedProject.levelRank,
      initialRank: orderedProject.initialRank,
      rank: orderedProject.rank,
      isManuallyOrdered: orderedProject.isManuallyOrdered,
      note: orderedProject.note,
      audit: Audit.toPersistance(orderedProject.audit)
    };
  }

  public get projectId(): string {
    return this.props.projectId;
  }

  public get levelRank(): number {
    return this.props.levelRank;
  }

  public get initialRank(): number {
    return this.props.initialRank;
  }

  public get rank(): number {
    return this.props.rank;
  }

  public set rank(rank: number) {
    this.props.rank = rank;
  }

  public get isManuallyOrdered(): boolean {
    return this.props.isManuallyOrdered;
  }

  public get note(): string {
    return this.props.note;
  }

  public get objectivesCalculation(): IObjectiveCalculation[] {
    return this.props.objectivesCalculation;
  }

  public get audit(): Audit {
    return this.props.audit;
  }

  public setRank(rank: number) {
    this.props.rank = rank;
  }

  public equals(otherOrderedProject: OrderedProject): boolean {
    return super.equals(otherOrderedProject) && this.innerEquals(otherOrderedProject);
  }

  private innerEquals(otherOrderedProject: OrderedProject): boolean {
    return (
      this.projectId === otherOrderedProject.projectId &&
      this.rank === otherOrderedProject.rank &&
      this.initialRank === otherOrderedProject.initialRank &&
      this.levelRank === otherOrderedProject.levelRank
    );
  }
}

import { AnnualProgramStatus, IPlainAnnualProgram, Role } from '@villemontreal/agir-work-planning-lib';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IPlainAnnualProgramProps extends IPlainAnnualProgram {
  sharedRoles?: Role[];
  status?: AnnualProgramStatus;
}

export class PlainAnnualProgram<P extends IPlainAnnualProgramProps> extends AggregateRoot<P> {
  public static create(props: IPlainAnnualProgramProps): Result<PlainAnnualProgram<IPlainAnnualProgramProps>> {
    const guardPlain = PlainAnnualProgram.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainAnnualProgram<IPlainAnnualProgramProps>>(guard);
    }
    const plainAnnualProgram = new PlainAnnualProgram(props);
    return Result.ok<PlainAnnualProgram<IPlainAnnualProgramProps>>(plainAnnualProgram);
  }

  public static guard(props: IPlainAnnualProgramProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.executorId,
        argumentName: 'executorId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.year,
        argumentName: 'year',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_YEAR]
      },
      {
        argument: props.description,
        argumentName: 'description',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.budgetCap,
        argumentName: 'budgetCap',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(AnnualProgramStatus)
      },
      {
        argument: props.sharedRoles,
        argumentName: 'sharedRoles',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(Role)
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  constructor(props: P, id: string = null) {
    super(props, id);
  }

  public get executorId(): string {
    return this.props.executorId;
  }

  public get year(): number {
    return this.props.year;
  }

  public get description(): string {
    return this.props.description;
  }

  public get budgetCap(): number {
    return this.props.budgetCap;
  }

  public get sharedRoles(): Role[] {
    return this.props.sharedRoles;
  }

  public get status(): AnnualProgramStatus {
    return this.props.status;
  }

  public setStatus(status: AnnualProgramStatus) {
    this.props.status = status;
  }

  public equals(otherAnnualProgram: PlainAnnualProgram<any>): boolean {
    return super.equals(otherAnnualProgram) && this.innerEquals(otherAnnualProgram);
  }

  private innerEquals(otherAnnualProgram: PlainAnnualProgram<any>): boolean {
    return this.executorId === otherAnnualProgram.executorId && this.year === otherAnnualProgram.year;
  }
}

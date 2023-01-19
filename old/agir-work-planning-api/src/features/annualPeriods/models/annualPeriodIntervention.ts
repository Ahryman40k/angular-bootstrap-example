import { IAnnualPeriodInterventions } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IAnnualPeriodInterventionProps extends IAnnualPeriodInterventions {}

export class AnnualPeriodIntervention extends AggregateRoot<IAnnualPeriodInterventionProps> {
  public static create(props: IAnnualPeriodInterventionProps): Result<AnnualPeriodIntervention> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AnnualPeriodIntervention>(guard);
    }
    const annualperiodIntervention = new AnnualPeriodIntervention(props, undefined);
    return Result.ok<AnnualPeriodIntervention>(annualperiodIntervention);
  }

  public static guard(props: IAnnualPeriodInterventionProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.interventionId,
        argumentName: `${valueName}interventionId`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_INTERVENTION_ID]
      },
      {
        argument: props.year,
        argumentName: `${valueName}year`,
        guardType: [GuardType.VALID_YEAR]
      },
      {
        argument: props.annualAllowance,
        argumentName: `${valueName}annualAllowance`,
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.accountId,
        argumentName: `${valueName}accountId`,
        guardType: [GuardType.IS_POSITIVE_INTEGER]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get interventionId(): string {
    return this.props.interventionId;
  }

  public get year(): number {
    return this.props.year;
  }

  public get annualAllowance(): number {
    return this.props.annualAllowance;
  }

  public get accountId(): number {
    return this.accountId;
  }

  public equals(otherInterventionAnnualPeriod: AnnualPeriodIntervention): boolean {
    return super.equals(otherInterventionAnnualPeriod) && this.innerEquals(otherInterventionAnnualPeriod);
  }

  private innerEquals(otherInterventionAnnualPeriod: AnnualPeriodIntervention): boolean {
    return (
      this.interventionId === otherInterventionAnnualPeriod.interventionId &&
      this.year === otherInterventionAnnualPeriod.year &&
      this.annualAllowance === otherInterventionAnnualPeriod.annualAllowance &&
      this.accountId === otherInterventionAnnualPeriod.accountId
    );
  }
}

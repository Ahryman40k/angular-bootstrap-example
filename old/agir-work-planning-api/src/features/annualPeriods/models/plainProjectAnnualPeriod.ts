import { IPlainProjectAnnualPeriod } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { AdditionalCost, IAdditionalCostProps } from './additionalCost';
import { AnnualPeriodIntervention, IAnnualPeriodInterventionProps } from './annualPeriodIntervention';

// tslint:disable:no-empty-interface
export interface IPlainProjectAnnualPeriodProps extends IPlainProjectAnnualPeriod {
  additionalCosts: IAdditionalCostProps[];
  annualPeriodInterventions?: IAnnualPeriodInterventionProps[];
}

export class PlainProjectAnnualPeriod<P extends IPlainProjectAnnualPeriodProps> extends AggregateRoot<P> {
  public static create(
    props: IPlainProjectAnnualPeriodProps
  ): Result<PlainProjectAnnualPeriod<IPlainProjectAnnualPeriodProps>> {
    const guardPlain = PlainProjectAnnualPeriod.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainProjectAnnualPeriod<IPlainProjectAnnualPeriodProps>>(guard);
    }
    const plainProjectAnnualPeriod = new PlainProjectAnnualPeriod(props);
    return Result.ok<PlainProjectAnnualPeriod<IPlainProjectAnnualPeriodProps>>(plainProjectAnnualPeriod);
  }

  public static guard(props: IPlainProjectAnnualPeriodProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.year,
        argumentName: 'year',
        guardType: [GuardType.VALID_YEAR]
      },
      {
        argument: props.accountId,
        argumentName: 'accountId',
        guardType: [GuardType.IS_POSITIVE_INTEGER]
      },
      {
        argument: props.annualAllowance,
        argumentName: 'annualAllowance',
        guardType: [GuardType.IS_POSITIVE_INTEGER]
      }
    ];
    let guardAdditionalCosts = [{ succeeded: true }];
    if (!isEmpty(props.additionalCosts)) {
      guardAdditionalCosts = props.additionalCosts.map(cost => AdditionalCost.guard(cost));
    }
    let guardAnnualPeriodInterventions = [{ succeeded: true }];
    if (!isEmpty(props.annualPeriodInterventions)) {
      guardAnnualPeriodInterventions = props.annualPeriodInterventions.map(api => AnnualPeriodIntervention.guard(api));
    }
    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardAdditionalCosts, ...guardAnnualPeriodInterventions]);
  }

  public get annualAllowance(): number {
    return this.props.annualAllowance;
  }

  public get accountId(): number {
    return this.props.accountId;
  }

  public get year(): number {
    return this.props.year;
  }

  public get additionalCosts(): AdditionalCost[] {
    return this._additionalCosts;
  }

  public get annualPeriodInterventions(): AnnualPeriodIntervention[] {
    return this._annualPeriodInterventions;
  }

  private readonly _additionalCosts: AdditionalCost[] = [];
  private readonly _annualPeriodInterventions: AnnualPeriodIntervention[] = [];
  constructor(props: P, id: string = null) {
    super(props, id);
    if (!isEmpty(props.additionalCosts)) {
      this._additionalCosts = props.additionalCosts.map(cost => {
        return AdditionalCost.create(cost).getValue();
      });
    }
    if (!isEmpty(props.annualPeriodInterventions)) {
      this._annualPeriodInterventions = props.annualPeriodInterventions.map(period =>
        AnnualPeriodIntervention.create({
          ...period
        }).getValue()
      );
    }
  }

  public equals(otherProjectAnnualPeriod: PlainProjectAnnualPeriod<any>): boolean {
    return super.equals(otherProjectAnnualPeriod) && this.innerEquals(otherProjectAnnualPeriod);
  }

  private innerEquals(otherProjectAnnualPeriod: PlainProjectAnnualPeriod<any>): boolean {
    return this.accountId === otherProjectAnnualPeriod.accountId && this.year === otherProjectAnnualPeriod.year;
  }
}

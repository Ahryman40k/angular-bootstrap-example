import * as _ from 'lodash';

import { IEnrichedProjectAnnualDistribution, IEnrichedProjectAnnualPeriod } from '../planning';
import { BaseProjectBudgetCalculationService } from './base-project-budget-calculation.service';

export class NonGeoProjectBudgetCalculationService extends BaseProjectBudgetCalculationService {
  protected calculateDistributionSummary(annualDistribution: IEnrichedProjectAnnualDistribution): void {
    super.calculateDistributionSummary(annualDistribution);
    annualDistribution.distributionSummary.totalAnnualBudget.totalAllowance = _.sumBy(
      annualDistribution.annualPeriods,
      a => a.annualAllowance
    );
  }

  protected getAnnualPeriodBudget(annualPeriod: IEnrichedProjectAnnualPeriod): number {
    return annualPeriod.additionalCostsTotalBudget + annualPeriod.annualAllowance;
  }

  protected getTotalBudget(annualDistribution: IEnrichedProjectAnnualDistribution): number {
    return (
      annualDistribution.distributionSummary.totalAdditionalCosts +
      annualDistribution.distributionSummary.totalAnnualBudget.totalAllowance
    );
  }
}

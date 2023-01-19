import * as _ from 'lodash';

import {
  IAdditionalCost,
  IEnrichedProject,
  IEnrichedProjectAnnualDistribution,
  IEnrichedProjectAnnualPeriod
} from '../planning';
import { IBudgetCalculationService } from './budget-calculation.service';

export abstract class BaseProjectBudgetCalculationService implements IBudgetCalculationService<IEnrichedProject> {
  public calculate(project: IEnrichedProject): void {
    const annualDistribution = project.annualDistribution;

    for (const annualPeriod of annualDistribution.annualPeriods) {
      this.calculateAnnualPeriod(project, annualPeriod);
      annualPeriod.annualBudget = this.getAnnualPeriodBudget(annualPeriod);
    }

    this.calculateDistributionSummary(annualDistribution);
    annualDistribution.distributionSummary.totalBudget = this.getTotalBudget(annualDistribution);
  }

  protected calculateAnnualPeriod(_project: IEnrichedProject, annualPeriod: IEnrichedProjectAnnualPeriod): void {
    annualPeriod.additionalCostsTotalBudget = this.calculateAdditionalCostsBudget(annualPeriod.additionalCosts);
  }

  protected calculateDistributionSummary(annualDistribution: IEnrichedProjectAnnualDistribution): void {
    annualDistribution.distributionSummary.totalAdditionalCosts = _.sumBy(
      annualDistribution.annualPeriods,
      a => a.additionalCostsTotalBudget
    );

    this.calculateAdditionalCostTotals(annualDistribution);
  }

  private calculateAdditionalCostTotals(annualDistribution: IEnrichedProjectAnnualDistribution): void {
    annualDistribution.distributionSummary.additionalCostTotals.forEach(additionalCostTotal => {
      const additionalCosts = _.flatten(
        annualDistribution.annualPeriods.map(ap =>
          ap.additionalCosts.filter(ac => ac.type === additionalCostTotal.type)
        )
      );
      additionalCostTotal.amount = _.sumBy(additionalCosts, ac => ac.amount);
    });
  }

  protected abstract getAnnualPeriodBudget(annualPeriod: IEnrichedProjectAnnualPeriod): number;

  protected abstract getTotalBudget(annualDistribution: IEnrichedProjectAnnualDistribution): number;

  protected calculateAdditionalCostsBudget(additionalCosts: IAdditionalCost[]): number {
    return _.sumBy(additionalCosts, a => a.amount);
  }
}

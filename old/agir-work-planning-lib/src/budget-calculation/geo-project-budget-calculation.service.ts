import * as _ from 'lodash';

import {
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualDistribution,
  IEnrichedProjectAnnualPeriod
} from '../planning';
import { BaseProjectBudgetCalculationService } from './base-project-budget-calculation.service';
import { IBudgetCalculationService } from './budget-calculation.service';

export class GeoProjectBudgetCalculationService extends BaseProjectBudgetCalculationService {
  constructor(private interventionBudgetCalculationService: IBudgetCalculationService<IEnrichedIntervention>) {
    super();
  }

  public calculate(project: IEnrichedProject): void {
    if (!project.interventions) {
      throw Error('Geolocated project should have at least one intervention');
    }

    for (const intervention of project.interventions) {
      this.interventionBudgetCalculationService.calculate(intervention);
    }
    super.calculate(project);
  }

  protected calculateAnnualPeriod(project: IEnrichedProject, annualPeriod: IEnrichedProjectAnnualPeriod): void {
    super.calculateAnnualPeriod(project, annualPeriod);
    annualPeriod.interventionsTotalBudget = this.calculateInterventionsBudget(project.interventions, annualPeriod.year);
  }

  protected calculateDistributionSummary(annualDistribution: IEnrichedProjectAnnualDistribution): void {
    super.calculateDistributionSummary(annualDistribution);
    annualDistribution.distributionSummary.totalInterventionBudgets = _.sumBy(
      annualDistribution.annualPeriods,
      a => a.interventionsTotalBudget
    );
  }

  protected getAnnualPeriodBudget(annualPeriod: IEnrichedProjectAnnualPeriod): number {
    return annualPeriod.additionalCostsTotalBudget + annualPeriod.interventionsTotalBudget;
  }

  protected getTotalBudget(annualDistribution: IEnrichedProjectAnnualDistribution): number {
    return (
      annualDistribution.distributionSummary.totalAdditionalCosts +
      annualDistribution.distributionSummary.totalInterventionBudgets
    );
  }

  private calculateInterventionsBudget(interventions: IEnrichedIntervention[], annualPeriodYear: number): number {
    let interventionsBudgetSum = 0;
    interventions.forEach(intervention => {
      const annualPeriod = intervention.annualDistribution.annualPeriods.find(ap => ap.year === annualPeriodYear);
      const annualAllowance = annualPeriod ? annualPeriod.annualAllowance : 0;
      interventionsBudgetSum = interventionsBudgetSum + annualAllowance;
    });
    return interventionsBudgetSum;
  }
}

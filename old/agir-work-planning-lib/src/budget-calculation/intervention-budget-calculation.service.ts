import { sumBy } from 'lodash';

import { IEnrichedIntervention, IInterventionAnnualPeriod } from '../planning';
import { IBudgetCalculationService } from './budget-calculation.service';

const METERS_IN_KMS = 1000;
const ANNUAL_LENGTH_FRACTION_DIGITS = 3;

export class InterventionBudgetCalculationService implements IBudgetCalculationService<IEnrichedIntervention> {
  public calculate(intervention: IEnrichedIntervention): void {
    const annualPeriods = intervention.annualDistribution.annualPeriods;

    intervention.annualDistribution.distributionSummary.totalAllowance = sumBy(annualPeriods, a => a.annualAllowance);

    annualPeriods.forEach(annualPeriod => {
      annualPeriod.annualLength = this.calculateAnnualLength(annualPeriod, intervention);
    });

    intervention.annualDistribution.distributionSummary.totalLength = +sumBy(
      annualPeriods,
      a => a.annualLength
    ).toFixed(ANNUAL_LENGTH_FRACTION_DIGITS);
  }

  private calculateAnnualLength(annualPeriod: IInterventionAnnualPeriod, intervention: IEnrichedIntervention): number {
    if (!intervention.annualDistribution.distributionSummary.totalAllowance) {
      return 0;
    }
    const annualLengthMeters =
      (annualPeriod.annualAllowance / intervention.annualDistribution.distributionSummary.totalAllowance) *
      sumBy(intervention.assets, asset => asset.length.value);
    const annualLengthKms = annualLengthMeters / METERS_IN_KMS;
    return +annualLengthKms.toFixed(ANNUAL_LENGTH_FRACTION_DIGITS);
  }
}

import { assert } from 'chai';

import { getEnrichedIntervention } from '../test/data/interventionData';
import { InterventionBudgetCalculationService } from './intervention-budget-calculation.service';

describe('InterventionBudgetCalculationService', () => {
  const interventionBudgetCalculationService = new InterventionBudgetCalculationService();

  it('Positive - Calculate intervention budgets', async () => {
    const intervention = getEnrichedIntervention();

    interventionBudgetCalculationService.calculate(intervention);

    intervention.annualDistribution.annualPeriods.forEach(annualPeriod => {
      assert.deepEqual(annualPeriod.annualAllowance, 2000);
      assert.deepEqual(annualPeriod.annualLength, 0.002);
    });

    assert.deepEqual(intervention.annualDistribution.distributionSummary.totalAllowance, 4000);
    assert.deepEqual(intervention.annualDistribution.distributionSummary.totalLength, 0.004);
  });
});

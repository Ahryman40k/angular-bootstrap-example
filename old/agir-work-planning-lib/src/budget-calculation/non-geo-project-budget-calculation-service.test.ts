import { assert } from 'chai';

import { ProjectType } from '../projects';
import { getEnrichedProject } from '../test/data/projectData';
import { NonGeoProjectBudgetCalculationService } from './non-geo-project-budget-calculation.service';

describe('NonGeoProjectBudgetCalculationService', () => {
  const nonGeoProjectBudgetCalculationService = new NonGeoProjectBudgetCalculationService();

  it('Positive - Calculate non geolocated project budgets', async () => {
    const project = getEnrichedProject({ projectType: ProjectType.nonIntegrated });

    nonGeoProjectBudgetCalculationService.calculate(project);

    project.annualDistribution.annualPeriods.forEach(annualPeriod => {
      assert.deepEqual(annualPeriod.additionalCostsTotalBudget, 9000);
      assert.deepEqual(annualPeriod.annualAllowance, 6000);
    });

    project.annualDistribution.distributionSummary.additionalCostTotals.forEach(additionalCost => {
      if (additionalCost.type === 'professionalServices') {
        assert.deepEqual(additionalCost.amount, 4000);
      }
      if (additionalCost.type === 'contingency') {
        assert.deepEqual(additionalCost.amount, 5000);
      }
      if (additionalCost.type === 'others') {
        assert.deepEqual(additionalCost.amount, 3000);
      }
      if (additionalCost.type === 'workExpenditures') {
        assert.deepEqual(additionalCost.amount, 6000);
      }
    });

    assert.deepEqual(project.annualDistribution.distributionSummary.totalAdditionalCosts, 18000);
    assert.deepEqual(project.annualDistribution.distributionSummary.totalAnnualBudget.totalAllowance, 12000);
    assert.deepEqual(project.annualDistribution.distributionSummary.totalBudget, 30000);
  });
});

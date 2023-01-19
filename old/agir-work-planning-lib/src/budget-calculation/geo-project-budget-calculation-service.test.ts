import { assert } from 'chai';

import { ProjectType } from '../projects';
import { getEnrichedProject } from '../test/data/projectData';
import { GeoProjectBudgetCalculationService } from './geo-project-budget-calculation.service';
import { InterventionBudgetCalculationService } from './intervention-budget-calculation.service';

describe('GeoProjectBudgetCalculationService', () => {
  const interventionBudgetCalculationService = new InterventionBudgetCalculationService();
  const geoProjectBudgetCalculationService = new GeoProjectBudgetCalculationService(
    interventionBudgetCalculationService
  );

  it('Positive - Calculate geolocated project budgets', async () => {
    const project = getEnrichedProject({ projectType: ProjectType.integrated });

    geoProjectBudgetCalculationService.calculate(project);

    project.annualDistribution.annualPeriods.forEach(annualPeriod => {
      assert.deepEqual(annualPeriod.additionalCostsTotalBudget, 9000);
      assert.deepEqual(annualPeriod.interventionsTotalBudget, 4000);
      assert.deepEqual(annualPeriod.annualBudget, 13000);
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
    assert.deepEqual(project.annualDistribution.distributionSummary.totalInterventionBudgets, 8000);
    assert.deepEqual(project.annualDistribution.distributionSummary.totalBudget, 26000);
  });

  it('Negative - One geolocated project should have at least one intervention', async () => {
    const project = getEnrichedProject({ projectType: ProjectType.integrated });
    project.interventions = null;

    assert.throws(
      () => geoProjectBudgetCalculationService.calculate(project),
      'Geolocated project should have at least one intervention'
    );
  });
});

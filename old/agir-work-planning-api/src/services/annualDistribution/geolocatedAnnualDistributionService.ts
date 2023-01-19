import {
  IApiError,
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IInterventionAnnualDistribution
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';

import { createInvalidParameterError } from '../../utils/utils';
import { interventionAnnualDistributionValidator } from '../../validators/interventionAnnualDistributionValidator';
import { BaseProjectAnnualDistributionService } from './baseProjectAnnualDistributionService';

class GeolocatedAnnualDistributionService extends BaseProjectAnnualDistributionService {
  protected createAnnualPeriod(project: IEnrichedProject, year: number): IEnrichedProjectAnnualPeriod {
    const annualPeriod = super.createAnnualPeriod(project, year);
    annualPeriod.interventionIds = [];
    return annualPeriod;
  }

  public distributeInterventions(project: IEnrichedProject, interventions: IEnrichedIntervention[]): void {
    for (const intervention of interventions) {
      for (const projectAnnualPeriod of project.annualDistribution.annualPeriods) {
        if (projectAnnualPeriod.year >= intervention.planificationYear) {
          if (projectAnnualPeriod.interventionIds?.includes(intervention.id)) {
            continue;
          }
          projectAnnualPeriod.interventionIds.push(intervention.id);
        }
      }
    }

    project.annualDistribution.annualPeriods.forEach(period => {
      period.interventionsTotalBudget = interventions
        .filter(i => period.interventionIds.includes(i.id))
        .map(i => i.annualDistribution?.annualPeriods.find(p => p.year === period.year)?.annualAllowance)
        .reduce((sum, current) => sum + current, 0);

      period.annualBudget = period.interventionsTotalBudget + period.additionalCostsTotalBudget;
    });

    const distributionSummary = project.annualDistribution.distributionSummary;
    distributionSummary.totalInterventionBudgets = project.annualDistribution.annualPeriods
      .map(period => period.interventionsTotalBudget)
      .reduce((sum, current) => sum + current, 0);
    distributionSummary.totalBudget =
      distributionSummary.totalInterventionBudgets + distributionSummary.totalAdditionalCosts;
  }

  public updateInterventionDistribution(
    project: IEnrichedProject,
    oldInterventionIds: string[],
    newInterventions: IEnrichedIntervention[]
  ): void {
    const addedInterventions = newInterventions.filter(x => !oldInterventionIds.includes(x.id));
    geolocatedAnnualDistributionService.distributeInterventions(project, addedInterventions);

    const removedInterventionIds = oldInterventionIds.filter(x => !newInterventions.some(i => i.id === x));
    geolocatedAnnualDistributionService.removeInterventions(project, removedInterventionIds);
  }

  public updateInterventionDistributionByYears(project: IEnrichedProject): void {
    if (!project.interventions) {
      return;
    }
    project.annualDistribution.annualPeriods.forEach(ap => {
      const interventionIds = project.interventions
        .filter(intervention => intervention.annualDistribution.annualPeriods.some(iap => iap.year === ap.year))
        .map(i => i.id);

      ap.interventionIds = interventionIds;
    });
  }

  public async validateInterventionAnnualDistribution(
    annualDistribution: IInterventionAnnualDistribution
  ): Promise<void> {
    const errorDetails: IApiError[] = [];
    await interventionAnnualDistributionValidator.validateAnnualDistributionOpenApiModel(
      errorDetails,
      annualDistribution
    );
    if (errorDetails.length > 0) {
      throw createInvalidParameterError('The annual distribution is invalid.', errorDetails);
    }
  }

  public moveInterventionOnProjectAnnualPeriods(project: IEnrichedProject, intervention: IEnrichedIntervention) {
    for (const projectAnnualPeriod of project.annualDistribution.annualPeriods) {
      if (projectAnnualPeriod.year < intervention.planificationYear) {
        _.remove(projectAnnualPeriod.interventionIds, interventionId => interventionId === intervention.id);
      }
    }
  }

  private removeInterventions(project: IEnrichedProject, interventionIdsToRemove: string[]): void {
    if (!interventionIdsToRemove.length) {
      return;
    }
    const annualPeriods = project.annualDistribution.annualPeriods;
    for (const annualPeriod of annualPeriods) {
      _.remove(annualPeriod.interventionIds, x => interventionIdsToRemove.includes(x));
    }
  }
}
export const geolocatedAnnualDistributionService = new GeolocatedAnnualDistributionService();

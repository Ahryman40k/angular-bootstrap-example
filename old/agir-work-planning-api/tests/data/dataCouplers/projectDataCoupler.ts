import { IEnrichedIntervention, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { interventionService } from '../../../src/features/interventions/interventionService';
import { projectService } from '../../../src/features/projects/projectService';
import { geolocatedAnnualDistributionService } from '../../../src/services/annualDistribution/geolocatedAnnualDistributionService';
import { interventionAnnualDistributionService } from '../../../src/services/annualDistribution/interventionAnnualDistributionService';
import { interventionDataGenerator } from '../dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../dataGenerators/projectDataGenerator';
import { IProgramBookCoupler, programBookDataCoupler } from './programBookDataCoupler';

export interface IProjectCouples {
  project: IEnrichedProject;
  interventions?: IEnrichedIntervention[];
  programBooksCoupler?: IProgramBookCoupler[];
}
class ProjectDataCoupler {
  public async coupleThem(coupleData: IProjectCouples): Promise<IEnrichedProject> {
    if (coupleData.interventions) {
      coupleData.project.interventionIds = interventionService.getInterventionIds(coupleData.interventions);
      interventionService.addProjectToInterventions(coupleData.project, coupleData.interventions);
      interventionAnnualDistributionService.create(
        coupleData.interventions,
        coupleData.project.annualDistribution.annualPeriods
      );
      geolocatedAnnualDistributionService.distributeInterventions(coupleData.project, coupleData.interventions);
      coupleData.project.interventions = coupleData.interventions;
    }
    projectService.calculateBudgets(coupleData.project);
    for (const intervention of coupleData.project.interventions) {
      await interventionDataGenerator.update(intervention);
      delete coupleData.project.interventions;
    }
    if (coupleData.programBooksCoupler) {
      for (const programBookCoupler of coupleData.programBooksCoupler) {
        await programBookDataCoupler.coupleThem({ programBookCoupler, projects: [coupleData.project] });
      }
    }
    coupleData.project = await projectDataGenerator.update(coupleData.project);
    return coupleData.project;
  }
}
export const projectDataCoupler = new ProjectDataCoupler();

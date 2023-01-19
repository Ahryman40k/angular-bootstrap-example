import { IEnrichedProject } from '../planning';
import { ProjectType } from '../projects/project-type';
import { IBudgetCalculationService } from './budget-calculation.service';
import { GeoProjectBudgetCalculationService } from './geo-project-budget-calculation.service';
import { InterventionBudgetCalculationService } from './intervention-budget-calculation.service';
import { NonGeoProjectBudgetCalculationService } from './non-geo-project-budget-calculation.service';

export class BudgetCalculationServiceFactory {
  public getService(project: IEnrichedProject): IBudgetCalculationService<IEnrichedProject> {
    return this.isProjectNonGeolocated(project)
      ? new NonGeoProjectBudgetCalculationService()
      : new GeoProjectBudgetCalculationService(new InterventionBudgetCalculationService());
  }

  private isProjectNonGeolocated(project: IEnrichedProject): boolean {
    return project.projectTypeId === ProjectType.other && !project.geometry;
  }
}

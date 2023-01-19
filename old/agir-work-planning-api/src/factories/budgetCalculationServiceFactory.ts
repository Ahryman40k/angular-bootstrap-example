import {
  GeoProjectBudgetCalculationService,
  IBudgetCalculationService,
  IEnrichedProject,
  InterventionBudgetCalculationService,
  IPlainProject,
  NonGeoProjectBudgetCalculationService
} from '@villemontreal/agir-work-planning-lib';

import { projectService } from '../features/projects/projectService';

class BudgetCalculationServiceFactory {
  public getService(project: IPlainProject | IEnrichedProject): IBudgetCalculationService<IEnrichedProject> {
    return projectService.isProjectNonGeolocated(project)
      ? new NonGeoProjectBudgetCalculationService()
      : new GeoProjectBudgetCalculationService(new InterventionBudgetCalculationService());
  }
}
export const budgetCalculationServiceFactory = new BudgetCalculationServiceFactory();

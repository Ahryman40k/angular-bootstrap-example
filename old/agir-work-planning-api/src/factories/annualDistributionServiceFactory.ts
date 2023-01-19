import { IEnrichedProject, IPlainProject, ProjectType } from '@villemontreal/agir-work-planning-lib';

import { geolocatedAnnualDistributionService } from '../services/annualDistribution/geolocatedAnnualDistributionService';
import { IAnnualDistributionService } from '../services/annualDistribution/iAnnualDistributionService';
import { nonGeolocatedAnnualDistributionService } from '../services/annualDistribution/nonGeolocatedAnnualDistributionService';

class AnnualDistributionServiceFactory {
  public getService(project: IPlainProject | IEnrichedProject): IAnnualDistributionService {
    return project.projectTypeId === ProjectType.other && !project.geometry
      ? nonGeolocatedAnnualDistributionService
      : geolocatedAnnualDistributionService;
  }
}
export const annualDistributionServiceFactory = new AnnualDistributionServiceFactory();

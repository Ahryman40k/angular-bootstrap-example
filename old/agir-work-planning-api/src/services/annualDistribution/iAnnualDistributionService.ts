import { IEnrichedProject, IEnrichedProjectAnnualDistribution } from '@villemontreal/agir-work-planning-lib';

export interface IAnnualDistributionService {
  createAnnualDistribution(project: IEnrichedProject): IEnrichedProjectAnnualDistribution;
  updateAnnualDistribution(project: IEnrichedProject): void;
}

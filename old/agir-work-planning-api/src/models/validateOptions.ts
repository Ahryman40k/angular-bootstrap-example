import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

export interface IValidateInterventionOptions {
  targetYear?: number;
  currentYear?: number;
  project?: IEnrichedProject;
}

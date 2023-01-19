import {
  IEnrichedIntervention,
  IEnrichedProject,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';

import { taxonomyService } from '../features/taxonomies/taxonomyService';

interface IProjectMedalService {
  setMedalToProject(project: IEnrichedProject, interventions: IEnrichedIntervention[]): Promise<void>;
  getMedalCodeFromInterventions(interventions: IEnrichedIntervention[], medals: ITaxonomy[]): string;
}

/**
 * Service to calculate de project medal based on its interventions medals.
 */
class ProjectMedalService implements IProjectMedalService {
  /**
   * Method that assigns the medal attribute to the project.
   * @param project
   * @param interventions
   */
  public async setMedalToProject(project: IEnrichedProject, interventions: IEnrichedIntervention[]): Promise<void> {
    const medals = await taxonomyService.getGroup(TaxonomyGroup.medalType);
    project.medalId = this.getMedalCodeFromInterventions(interventions, medals);
  }

  public getMedalCodeFromInterventions(interventions: IEnrichedIntervention[], medals: ITaxonomy[]): string {
    const interventionMedals = interventions.filter(i => i?.medalId).map(i => medals.find(m => m.code === i.medalId));
    const medal = _.maxBy(interventionMedals, im => im?.properties.weight);
    return medal?.code || null;
  }
}

export const projectMedalService: IProjectMedalService = new ProjectMedalService();

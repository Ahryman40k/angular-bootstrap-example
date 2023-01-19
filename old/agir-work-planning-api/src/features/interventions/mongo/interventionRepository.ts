import {
  IEnrichedIntervention,
  IEnrichedProject,
  IPlainProject,
  ProjectExpand,
  ProjectStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, isNil, orderBy } from 'lodash';

import { BaseRepositoryWithHistory } from '../../../repositories/core/baseRepositoryWithHistory';
import { interventionSanitizer } from '../../../sanitizers/interventionSanitizer';
import { auditService } from '../../../services/auditService';
import { projectMedalService } from '../../../services/projectMedalService';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { createLogger } from '../../../utils/logger';
import { IHistoryOptions } from '../../history/mongo/historyRepository';
import { programBooksOnProjectUpdateCommand } from '../../programBooks/programBooksOnProjectUpdateCommand';
import { ProjectFindOptions } from '../../projects/models/projectFindOptions';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { projectService } from '../../projects/projectService';
import { RequirementFindOptions } from '../../requirements/models/requirementFindOptions';
import { requirementRepository } from '../../requirements/mongo/requirementRepository';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { IInterventionRepository } from '../iInterventionRepository';
import { interventionMatchBuilder } from '../interventionMatchBuilder';
import { Intervention, isIntervention } from '../models/intervention';
import { IInterventionCriterias, InterventionFindOptions } from '../models/interventionFindOptions';
import { IInterventionAttributes } from './interventionAttributes';
import { IInterventionMongoDocument, InterventionModel } from './interventionModel';

const logger = createLogger('InterventionRepository');

type KeyOfIntervention = keyof IEnrichedIntervention;

/**
 * Plain intervention repository, based on Mongo/Mongoose.
 */
class InterventionRepository
  extends BaseRepositoryWithHistory<IEnrichedIntervention, IInterventionMongoDocument, InterventionFindOptions>
  implements IInterventionRepository {
  public get model(): InterventionModel {
    return this.db.models.Intervention;
  }

  protected get preserveIdentifiersKeys(): KeyOfIntervention[] {
    return ['comments', 'decisions', 'documents'];
  }

  protected normalize(intervention: IEnrichedIntervention): IEnrichedIntervention {
    super.normalize(intervention);
    if (intervention.decisions) {
      intervention.decisions = orderBy(intervention.decisions, d => (d.audit || {}).createdAt, 'desc');
    }
    if (intervention.documents) {
      intervention.documents = orderBy(intervention.documents, ['documentName'], ['asc']);
    }
    if (!isNil(intervention.importRevisionDate)) {
      intervention.importRevisionDate = new Date(intervention.importRevisionDate).toISOString();
    }
    return intervention;
  }

  protected getSortCorrespondance(): any[] {
    return [
      ...super.getSortCorrespondance(),
      { param: 'programId', dbName: 'programId', taxonomyGroup: TaxonomyGroup.programType },
      {
        param: 'interventionTypeId',
        dbName: 'interventionTypeId',
        taxonomyGroup: TaxonomyGroup.interventionType
      },
      { param: 'workTypeId', dbName: 'workTypeId', taxonomyGroup: TaxonomyGroup.workType },
      { param: 'requestorId', dbName: 'requestorId', taxonomyGroup: TaxonomyGroup.requestor },
      { param: 'executorId', dbName: 'executorId', taxonomyGroup: TaxonomyGroup.executor },
      { param: 'boroughId', dbName: 'boroughId', taxonomyGroup: TaxonomyGroup.borough },
      { param: 'status', dbName: 'status', taxonomyGroup: TaxonomyGroup.interventionStatus },
      { param: 'planificationYear', dbName: 'planificationYear' }
    ];
  }

  protected async getMatchFromQueryParams(criterias: IInterventionCriterias): Promise<any> {
    return interventionMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected async toDomainModel(intervention: any): Promise<IEnrichedIntervention> {
    const result = await super.toDomainModel(intervention);
    interventionSanitizer.sanitize(intervention);
    return result;
  }

  protected toPersistence(intervention: any): IEnrichedIntervention | IInterventionAttributes {
    if (isIntervention(intervention)) {
      return Intervention.toPersistance(intervention);
    }
    return {
      ...intervention,
      audit: auditService.buildAudit(intervention.audit)
    };
  }

  // Operations to execute when intervention(s) are deleted
  protected async onDelete(findOptions: InterventionFindOptions, options?: IHistoryOptions): Promise<Result<any>> {
    const foundInterventions = await this.findAll(findOptions);
    if (!isEmpty(foundInterventions)) {
      return Result.combine([
        // Update linked projects
        await this.updateLinkedProjects(foundInterventions),
        // Delete requirement
        await this.deleteRequirements(foundInterventions.map(i => i.id))
      ]);
    }
    return Result.ok();
  }
  // NOSONAR
  private async updateLinkedProjects(interventions: IEnrichedIntervention[]): Promise<Result<any>> {
    const interventionIds = interventions.map(p => p.id);
    const projectsIds = interventions.map(i => i.project?.id).filter(id => id);
    let foundProjects: IEnrichedProject[] = [];
    if (!isEmpty(projectsIds)) {
      const projectFindOptions = ProjectFindOptions.create({
        criterias: {
          id: projectsIds,
          status: enumValues(ProjectStatus)
        },
        expand: ProjectExpand.interventions
      }).getValue();

      foundProjects = await projectRepository.findAll(projectFindOptions);
    }

    if (!isEmpty(foundProjects)) {
      const projectsToDelete: IEnrichedProject[] = [];
      const projectsToUpdate: IEnrichedProject[] = [];
      const medals = await taxonomyService.getGroup(TaxonomyGroup.medalType);
      for (const project of foundProjects) {
        // if the project does not contain any intervention to delete, then there is no need to update the project
        if (project.interventionIds.every(id => !interventionIds.includes(id))) {
          continue;
        }

        // if all project interventions are in interventions to delete, delete also project
        if (project.interventionIds.every(id => interventionIds.includes(id)) || isEmpty(project.interventionIds)) {
          projectsToDelete.push(project);
        } else {
          // remove intervention from project and "regenerate project"
          // TODO there should be a method in Project that handles it -> onModifyInterventions()
          const projectWithUpdatedInterventions: IPlainProject = {
            ...project,
            interventionIds: project.interventionIds.filter(id => !interventionIds.includes(id))
          } as IPlainProject;
          const updatedInterventionsList = project.interventions.filter(
            intervention => !interventionIds.includes(intervention.id)
          );
          let updatedProject = await projectService.updateProject(
            projectWithUpdatedInterventions,
            project,
            updatedInterventionsList,
            medals,
            false
          );
          updatedProject = await projectService.updateProjectSpatialElements(updatedProject, updatedInterventionsList);
          // TODO should be done through classes cascading functions
          await projectMedalService.setMedalToProject(updatedProject, interventions);
          // TODO should be done through classes cascading functions
          await programBooksOnProjectUpdateCommand.execute(project, updatedProject);
          projectsToUpdate.push(updatedProject);
        }
      }
      let deleteProjectsResult = Result.ok();
      if (!isEmpty(projectsToDelete)) {
        const deleteFindOptions = ProjectFindOptions.create({
          criterias: {
            id: projectsToDelete.map(p => p.id)
          }
        }).getValue();
        deleteProjectsResult = await projectRepository.delete(deleteFindOptions);
      }

      let updateProjectsResult = [Result.ok()];
      if (!isEmpty(projectsToUpdate)) {
        updateProjectsResult = await Promise.all(projectsToUpdate.map(p => projectRepository.save(p)));
      }
      return Result.combine([deleteProjectsResult, ...updateProjectsResult]);
    }
    return Result.ok();
  }

  private async deleteRequirements(interventionsIds: string[]): Promise<Result<number>> {
    if (isEmpty(interventionsIds)) {
      return Result.ok(0);
    }

    const requirementFindOptions = RequirementFindOptions.create({
      criterias: {
        itemId: interventionsIds
      }
    }).getValue();
    const deleteResult = await requirementRepository.delete(requirementFindOptions);
    if (deleteResult.isFailure) {
      logger.error(
        deleteResult.errorValue(),
        `There was an error deleting requirement with interventionsIds ${interventionsIds.join(',')}`
      );
    } else {
      logger.info(`Deleted requirement with interventionsIds ${interventionsIds.join(',')}`);
    }
    return deleteResult;
  }
}

export const interventionRepository: IInterventionRepository = new InterventionRepository();

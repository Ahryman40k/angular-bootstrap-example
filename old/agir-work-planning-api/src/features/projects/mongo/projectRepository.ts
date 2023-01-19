import {
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  ProgramBookStatus,
  RequirementTargetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, orderBy } from 'lodash';

import { ISaveBulkResult } from '../../../repositories/core/baseRepository';
import { BaseRepositoryWithHistory } from '../../../repositories/core/baseRepositoryWithHistory';
import { projectSanitizer } from '../../../sanitizers/projectSanitizer';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { createLogger } from '../../../utils/logger';
import { IHistoryOptions } from '../../history/mongo/historyRepository';
import { resetInterventionAttributes } from '../../interventions/models/intervention';
import { InterventionFindOptions } from '../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../interventions/mongo/interventionRepository';
import { OpportunityNoticeFindOptions } from '../../opportunityNotices/models/opportunityNoticeFindOptions';
import { opportunityNoticeRepository } from '../../opportunityNotices/mongo/opportunityNoticeRepository';
import { ProgramBook } from '../../programBooks/models/programBook';
import { ProgramBookFindOptions } from '../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../programBooks/mongo/programBookRepository';
import { RequirementFindOptions } from '../../requirements/models/requirementFindOptions';
import { requirementRepository } from '../../requirements/mongo/requirementRepository';
import { Submission } from '../../submissions/models/submission';
import { SubmissionFindOptions } from '../../submissions/models/submissionFindOptions';
import { submissionRepository } from '../../submissions/mongo/submissionRepository';
import { IProjectRepository } from '../iProjectRepository';
import { IProjectProps, isProject, Project } from '../models/project';
import { IProjectCriterias, ProjectFindOptions } from '../models/projectFindOptions';
import { projectMatchBuilder } from '../projectMatchBuilder';
import { IProjectAttributes, IProjectMongoDocument, ProjectModel } from './projectModel';

const logger = createLogger('ProjectRepository');

type KeyOfProject = keyof IEnrichedProject;
/**
 * Plain PlainProject repository, based on Mongo/Mongoose.
 */
class ProjectRepository extends BaseRepositoryWithHistory<IEnrichedProject, IProjectMongoDocument, ProjectFindOptions>
  implements IProjectRepository {
  protected get preserveIdentifiersKeys(): KeyOfProject[] {
    return ['comments', 'decisions', 'annualDistribution', 'documents'];
  }

  public get model(): ProjectModel {
    return this.db.models.Project;
  }

  protected normalize(data: IEnrichedProject): IEnrichedProject {
    super.normalize(data);
    if (data.decisions) {
      data.decisions = orderBy(data.decisions, d => (d.audit || {}).createdAt, 'desc');
    }
    if (data.documents) {
      data.documents = orderBy(data.documents, ['documentName'], ['asc']);
    }
    return data;
  }

  protected getSortCorrespondance() {
    return [
      ...super.getSortCorrespondance(),
      { param: 'projectTypeId', dbName: 'projectTypeId', taxonomyGroup: TaxonomyGroup.programType },
      { param: 'executorId', dbName: 'executorId', taxonomyGroup: TaxonomyGroup.executor },
      { param: 'projectCategoryId', dbName: 'projectCategoryId', taxonomyGroup: TaxonomyGroup.projectCategory },
      { param: 'boroughId', dbName: 'boroughId', taxonomyGroup: TaxonomyGroup.borough },
      { param: 'status', dbName: 'status', taxonomyGroup: TaxonomyGroup.projectStatus }
    ];
  }

  protected async getMatchFromQueryParams(criterias: IProjectCriterias): Promise<any> {
    return projectMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected async toDomainModel(project: any): Promise<IEnrichedProject> {
    const result = await super.toDomainModel(project);
    projectSanitizer.sanitize(project);
    return result;
  }

  protected toPersistence(project: IEnrichedProject | Project<IProjectProps>): IProjectAttributes {
    let projectToPersist: Project<IProjectProps> = project as Project<IProjectProps>;
    if (!isProject(projectToPersist)) {
      projectToPersist = Project.fromEnrichedToInstance(projectToPersist);
    }
    return Project.toPersistance(projectToPersist);
  }

  // Operations to execute when project(s) are deleted
  protected async onDelete(findOptions: ProjectFindOptions, options?: IHistoryOptions): Promise<Result<any>> {
    const foundProjects = await this.findAll(findOptions);
    const projectIds = foundProjects.map(p => p.id);
    if (!isEmpty(projectIds)) {
      return Result.combine([
        // Delete linked opportunity notices
        await this.deleteLinkedOpportunityNotices(projectIds),
        // Delete linked requirements
        await this.deleteLinkedRequirements(projectIds),
        // Find ProgramBooks matching removedProjectsIds
        await this.updateLinkedProgramBooksRemovedProjectsId(projectIds),
        // Find ProgramBooks matching removedProjectsIds
        await this.updateLinkedProgramBooksPriorityScenariosProjectIds(projectIds),
        // update interventions matching project
        await this.updateLinkedInterventions(projectIds),
        // update submissions matching project
        await this.updateLinkedSubmissions(projectIds)
      ]);
    }
    return Result.ok();
  }

  private async deleteLinkedOpportunityNotices(projectIds: string[]): Promise<Result<number>> {
    const opportunityNoticeFindOptions = OpportunityNoticeFindOptions.create({
      criterias: {
        projectId: projectIds
      }
    }).getValue();
    const deleteResult = await opportunityNoticeRepository.delete(opportunityNoticeFindOptions);
    if (deleteResult.isFailure) {
      logger.error(
        deleteResult.errorValue(),
        `There was an error deleting opportuniy notice with projectIds ${projectIds.join(',')}`
      );
    } else {
      logger.info(`Deleted opportuniy notices with projectIds ${projectIds.join(',')}`);
    }
    return deleteResult;
  }

  private async deleteLinkedRequirements(projectIds: string[]): Promise<Result<number>> {
    const requirementFindOptions = RequirementFindOptions.create({
      criterias: {
        itemId: projectIds,
        itemType: RequirementTargetType.project
      }
    }).getValue();
    const deleteResult = await requirementRepository.delete(requirementFindOptions);
    if (deleteResult.isFailure) {
      logger.error(
        deleteResult.errorValue(),
        `There was an error deleting requirement with projectIds ${projectIds.join(',')}`
      );
    } else {
      logger.info(`Deleted requirements with projectIds ${projectIds.join(',')}`);
    }
    return deleteResult;
  }

  private async updateLinkedSubmissions(projectIds: string[]): Promise<Result<Submission>> {
    const submissionFindOptions = SubmissionFindOptions.create({
      criterias: {
        projectIds
      }
    }).getValue();
    const submisions = await submissionRepository.findAll(submissionFindOptions);

    const submissionIdsToRemove = submisions
      .filter(sub => isEmpty(sub.projectIds.filter(id => !projectIds.includes(id))))
      .map(sub => sub.id);

    if (!isEmpty(submissionIdsToRemove)) {
      const submisionsDeleteResults = await submissionRepository.delete(
        SubmissionFindOptions.create({
          criterias: {
            id: submissionIdsToRemove
          }
        }).getValue()
      );

      if (submisionsDeleteResults.isFailure) {
        logger.error(
          submisionsDeleteResults.errorValue(),
          `There was an error deleting Submission with deleted projectsIds ${projectIds.join(',')}`
        );
      } else {
        logger.info(`Deleted Submission with projectIds ${projectIds.join(',')} `);
      }
    }

    const submisionsSaveResults = await Promise.all(
      submisions
        .filter(sub => !submissionIdsToRemove.includes(sub.id))
        .map(sub => {
          const updatedProjectIds = sub.projectIds.filter(id => !projectIds.includes(id));
          const updatedSubmisions = Submission.create({
            ...sub.props,
            projectIds: updatedProjectIds
          }).getValue();
          return submissionRepository.save(updatedSubmisions);
        })
    );
    const projectIdsReferences = Result.combine(submisionsSaveResults);
    if (projectIdsReferences.isFailure) {
      logger.error(
        projectIdsReferences.errorValue(),
        `There was an error updating Submission projectIds with deleted projectsIds ${projectIds.join(',')}`
      );
    } else {
      logger.info(`Updated Submission projectIds with projectIds ${projectIds.join(',')} `);
    }
    return Result.combine(submisionsSaveResults);
  }

  private async updateLinkedProgramBooksRemovedProjectsId(projectIds: string[]): Promise<Result<ProgramBook>> {
    const programBooksRemovedProjectsIdsFindOptions = ProgramBookFindOptions.create({
      criterias: {
        removedProjectsIds: projectIds,
        status: enumValues(ProgramBookStatus)
      }
    }).getValue();
    const programBooksRemovedProjects = await programBookRepository.findAll(programBooksRemovedProjectsIdsFindOptions);
    const programBooksRemovedProjectsIdsSaveResults = await Promise.all(
      programBooksRemovedProjects.map(pb => {
        const updatedRemovedProjects = pb.removedProjects.filter(p => !projectIds.includes(p.id));
        const updatedProgramBook = ProgramBook.create(
          {
            ...pb.props,
            removedProjects: updatedRemovedProjects
          },
          pb.id
        ).getValue();
        updatedProgramBook.outdatePriorityScenarios();
        return programBookRepository.save(updatedProgramBook);
      })
    );

    const removedProjectsReferences = Result.combine(programBooksRemovedProjectsIdsSaveResults);
    if (removedProjectsReferences.isFailure) {
      logger.error(
        removedProjectsReferences.errorValue(),
        `There was an error updating ProgramBook removedProjects with deleted projectsIds ${projectIds.join(',')}`
      );
    } else {
      logger.info(`Updated ProgramBook removedProjects with projectIds ${projectIds.join(',')} `);
    }
    return Result.combine(programBooksRemovedProjectsIdsSaveResults);
  }

  private async updateLinkedProgramBooksPriorityScenariosProjectIds(
    projectIds: string[]
  ): Promise<Result<ProgramBook>> {
    const programBooksScenariosOrderedProjectFindOptions = ProgramBookFindOptions.create({
      criterias: {
        priorityScenarioProjectsIds: projectIds,
        status: enumValues(ProgramBookStatus)
      }
    }).getValue();
    const programBooksScenariosOrderedProject = await programBookRepository.findAll(
      programBooksScenariosOrderedProjectFindOptions
    );
    const programBooksScenariosOrderedProjectIdsSaveResults = await Promise.all(
      programBooksScenariosOrderedProject.map(pb => {
        pb.priorityScenarios.forEach(ps => {
          ps.setOrderedProjects(
            ps.orderedProjects.filter(orderedProject => !projectIds.includes(orderedProject.projectId))
          );
        });
        pb.outdatePriorityScenarios();
        return programBookRepository.save(pb);
      })
    );
    const removedProjectsReferences = Result.combine(programBooksScenariosOrderedProjectIdsSaveResults);
    if (removedProjectsReferences.isFailure) {
      logger.error(
        removedProjectsReferences.errorValue(),
        `There was an error updating ProgramBook priority scenarios ordered projects with deleted projectsIds ${projectIds.join(
          ','
        )}`
      );
    } else {
      logger.info(`Updating ProgramBook priority scenarios ordered projects with projectIds ${projectIds.join(',')} `);
    }
    return Result.combine(programBooksScenariosOrderedProjectIdsSaveResults);
  }

  private async updateLinkedInterventions(
    projectIds: string[]
  ): Promise<Result<ISaveBulkResult<IEnrichedIntervention>>> {
    const interventionProjectsIdsFindOptions = InterventionFindOptions.create({
      criterias: {
        projectId: projectIds,
        status: enumValues(InterventionStatus)
      }
    }).getValue();
    let interventionsRemovedProjects = await interventionRepository.findAll(interventionProjectsIdsFindOptions);
    if (!isEmpty(interventionsRemovedProjects)) {
      interventionsRemovedProjects = interventionsRemovedProjects.map(intervention => {
        return resetInterventionAttributes(intervention);
      });
      const interventionSaveBulkResult = await interventionRepository.saveBulk(interventionsRemovedProjects);
      if (interventionSaveBulkResult.isFailure) {
        logger.error(
          interventionSaveBulkResult.errorValue(),
          `There was an error updating interventions after removing projects ${projectIds.join(',')}`
        );
      } else {
        logger.info(`Updated interventions by removing projects with ids ${projectIds.join(',')} `);
      }
      return interventionSaveBulkResult;
    }
    return Result.ok();
  }
}

export const projectRepository: IProjectRepository = new ProjectRepository();

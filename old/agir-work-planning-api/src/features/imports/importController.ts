import * as turf from '@turf/turf';
import { IEnrichedIntervention, IEnrichedProject, IImportProjectRequest } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';

import { interventionWorkAreaService } from '../../services/interventionWorkAreaService';
import { projectWorkAreaService } from '../../services/projectWorkAreaService';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { ProjectAnnualPeriod } from '../annualPeriods/models/projectAnnualPeriod';
import { AnnualProgram } from '../annualPrograms/models/annualProgram';
import { annualProgramRepository } from '../annualPrograms/mongo/annualProgramRepository';
import { InterventionFindOptions } from '../interventions/models/interventionFindOptions';
import { interventionRepository } from '../interventions/mongo/interventionRepository';
import { programBookPriorityScenarioService } from '../priorityScenarios/priorityScenarioService';
import { ProgramBook } from '../programBooks/models/programBook';
import { ProgramBookFindOptions } from '../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../programBooks/mongo/programBookRepository';
import { ProjectFindOptions } from '../projects/models/projectFindOptions';
import { projectRepository } from '../projects/mongo/projectRepository';
import { projectService } from '../projects/projectService';
import { projectValidator } from '../projects/validators/projectValidator';
import { importService } from './importService';
import { IImportRelationCriterias, ImportRelationFindOptions } from './models/importRelationFindOptions';
import { importRelationRepository } from './mongo/importRelationRepository';

/**
 * Import controller
 * Transform excels files to AGIR entities
 */
@autobind
export class ImportController {
  /**
   * Imports BIC projects.
   */
  public async importProjects(req: express.Request, res: express.Response): Promise<void> {
    const importProjectRequest: IImportProjectRequest = req.body;
    const bicProjects = importProjectRequest.bicProjects;
    const bicProjectsFeatures = importProjectRequest.features;

    // Validate
    await importService.validateBicProjects(bicProjects);
    await importService.validateBicProjectsFeatures(bicProjectsFeatures);

    // Create models
    const interventionBicProjects = importService.getInterventionBicProjects(bicProjects);

    const interventionWorkArea = interventionWorkAreaService.generateImportWorkArea(
      bicProjectsFeatures
    ) as turf.Feature<turf.Polygon>;

    const projectWorkArea = projectWorkAreaService.generateImportWorkAreaFromInterventionArea(
      interventionWorkArea
    ) as turf.Feature<turf.Polygon>;

    let project = await importService.createProject(bicProjects[0], projectWorkArea);
    const interventions = await importService.createInterventions(
      interventionBicProjects,
      project,
      interventionWorkArea
    );

    // Add comments to interventions
    importService.updateInterventionsComments(interventions, bicProjects);
    const comments = importService.createComments(bicProjects);

    // Add a person in charge and verify that the requestor is include within the interventions
    importService.defineInChargeId(project, bicProjects[0], interventions);

    project = await importService.updateProject(project, interventions, comments);

    await importService.updateProjectAnnualPeriods(project, bicProjects[0]);

    await projectValidator.validateImport(project, interventions);

    const annualPeriods: ProjectAnnualPeriod[] = await ProjectAnnualPeriod.fromEnrichedToInstanceBulk(
      project.annualDistribution.annualPeriods
    );

    // Delete existing
    const removeProject = await this.deleteExistingBicProject(bicProjects[0].NO_PROJET, bicProjects[0]?.ID_PROJET);
    await this.removeOrderedProjectFromProgramBooks(removeProject, annualPeriods);

    // Persist data
    const persistedInterventionsResults = await Promise.all(interventions.map(x => interventionRepository.save(x)));
    if (persistedInterventionsResults.filter(result => result.isFailure).length > 0) {
      throw errorMtlMapper.toApiError(
        new UnexpectedError(Result.combineForError(Result.combine(persistedInterventionsResults)))
      );
    }

    const persistedInterventions = persistedInterventionsResults.map(result => result.getValue());
    importService.addInterventionsToProject(persistedInterventions, project);

    projectService.calculateBudgets(project);

    let updatedInterventions = project.interventions;
    delete project.interventions;
    const persistedProjectResult = await projectRepository.save(project);
    if (persistedProjectResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(persistedProjectResult)));
    }
    const persistedProject = persistedProjectResult.getValue();
    updatedInterventions = importService.addProjectToInterventions(updatedInterventions, persistedProject);
    await this.persistInterventions(updatedInterventions);

    // Create array of promise for annual program and program book
    const annualProgramPromises: Promise<Result<AnnualProgram>>[] = [];
    const programBookPromises: Promise<Result<ProgramBook>>[] = [];

    annualPeriods.forEach(period => {
      if (period.programBook?.annualProgram) {
        annualProgramPromises.push(annualProgramRepository.save(period.programBook.annualProgram));
      }
      if (period.programBook) {
        programBookPriorityScenarioService.outdateProgramBookPriorityScenarios(period.programBook);
        for (const priorityScenario of period.programBook.priorityScenarios) {
          programBookPriorityScenarioService.appendProjectToOrderedProjects(priorityScenario, persistedProject.id);
        }
        programBookPromises.push(programBookRepository.save(period.programBook));
      }
    });

    // Persist annualProgram
    await Promise.all(annualProgramPromises);

    // Persist programBook
    await Promise.all(programBookPromises);

    // Add requirements to project
    await importService.addProjectRequirements(persistedProject, bicProjects);

    // Create relation
    const newRelation = importService.createRelation(interventionBicProjects, persistedProject, persistedInterventions);
    await importRelationRepository.save(newRelation);

    res.status(HttpStatusCodes.CREATED).send(persistedProject);
  }

  /**
   * Deletes the existing projects and intervention based on the BIC project ID.
   * @param bicProjectId The BIC project number
   */
  private async deleteExistingBicProject(
    bicProjectNumber: string | number,
    bicProjectId: string | number
  ): Promise<IEnrichedProject> {
    const criterias = { bicProjectNumber } as IImportRelationCriterias;
    if (bicProjectId) {
      criterias.bicProjectId = bicProjectId;
    }
    const importRelationFindOptions = ImportRelationFindOptions.create({
      criterias
    });
    if (importRelationFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(importRelationFindOptions)));
    }
    const existingRelation = await importRelationRepository.findOne(importRelationFindOptions.getValue());
    if (!existingRelation) {
      return null;
    }

    const project = await projectRepository.findById(existingRelation.projectId);

    const projectRemoveFindOptions = ProjectFindOptions.create({
      criterias: {
        id: existingRelation.projectId
      }
    });
    if (projectRemoveFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(projectRemoveFindOptions)));
    }
    await projectRepository.delete(projectRemoveFindOptions.getValue());

    const interventionIds = existingRelation.interventionIds
      ? existingRelation.interventionIds
      : existingRelation.interventions.map(x => x.interventionId);

    const interventionRemoveFindOptions = InterventionFindOptions.create({
      criterias: {
        id: interventionIds
      }
    });
    if (interventionRemoveFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionRemoveFindOptions)));
    }
    await interventionRepository.delete(interventionRemoveFindOptions.getValue());

    const removeCriterias = { bicProjectNumber } as IImportRelationCriterias;
    if (existingRelation.bicProjectId) {
      removeCriterias.bicProjectId = existingRelation.bicProjectId;
    }

    const importRelationRemoveFindOptions = ImportRelationFindOptions.create({
      criterias: removeCriterias
    });
    if (importRelationRemoveFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(
        new InvalidParameterError(Result.combineForError(importRelationRemoveFindOptions))
      );
    }
    await importRelationRepository.delete(importRelationRemoveFindOptions.getValue());
    return project;
  }

  /**
   * Updates interventions
   * @param interventions
   */
  private async persistInterventions(interventions: IEnrichedIntervention[]): Promise<void> {
    await Promise.all(
      interventions.map(i =>
        interventionRepository.save({
          ...i,
          id: i.id
        })
      )
    );
  }

  private async removeOrderedProjectFromProgramBooks(
    removeProject: IEnrichedProject,
    annualPeriods: ProjectAnnualPeriod[]
  ): Promise<void> {
    if (!removeProject) {
      return;
    }
    const programBookIdsToRemoveOrderedProject = removeProject.annualDistribution.annualPeriods
      .map(ap => ap.programBookId)
      .filter(x => x);

    const programBookToRemoveFindOptions = ProgramBookFindOptions.create({
      criterias: {
        id: programBookIdsToRemoveOrderedProject
      }
    });
    if (programBookToRemoveFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(
        new InvalidParameterError(Result.combineForError(programBookToRemoveFindOptions))
      );
    }
    let programBooksToRemoveOrderProject: ProgramBook[] = await programBookRepository.findAll(
      programBookToRemoveFindOptions.getValue()
    );
    let annualPeriodsProgramBooks: ProgramBook[] = [];
    if (!_.isEmpty(annualPeriods)) {
      annualPeriodsProgramBooks = annualPeriods.map(ap => ap.programBook).filter(x => x);
      const annualPeriodsProgramBookIds = !_.isEmpty(annualPeriodsProgramBooks)
        ? annualPeriodsProgramBooks.map(pb => pb.id)
        : [];
      programBooksToRemoveOrderProject = programBooksToRemoveOrderProject.filter(
        pb => !annualPeriodsProgramBookIds.includes(pb.id)
      );
    }

    importService.removeProgramBookOrderProjectByProjectId(programBooksToRemoveOrderProject, removeProject.id);
    importService.removeProgramBookOrderProjectByProjectId(annualPeriodsProgramBooks, removeProject.id);

    programBookPriorityScenarioService.outdateProgramBooksPriorityScenarios(programBooksToRemoveOrderProject);
    for (const programBook of programBooksToRemoveOrderProject) {
      await programBookRepository.save(programBook);
    }
  }
}

export const importController: ImportController = new ImportController();

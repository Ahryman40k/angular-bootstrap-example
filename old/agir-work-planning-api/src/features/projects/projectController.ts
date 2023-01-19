import {
  ICountBy,
  IEnrichedIntervention,
  IEnrichedPaginatedProjects,
  IEnrichedProject,
  IPlainProject,
  IPlainProjectAnnualDistribution,
  IProjectCountBySearchRequest,
  IProjectDecision,
  IProjectPaginatedSearchRequest,
  ProjectDecisionType,
  ProjectExpand,
  SubmissionStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { cloneDeep, get, isEmpty } from 'lodash';

import { constants, EntityType } from '../../../config/constants';
import { AgirRequest } from '../../models/requests';
import { projectSanitizer } from '../../sanitizers/projectSanitizer';
import { assetService } from '../../services/assetService';
import { auditService } from '../../services/auditService';
import { createConflictError } from '../../shared/domainErrors/customApiErrors';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { ForbiddenError } from '../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { createForbiddenError, createInvalidParameterError, createNotFoundError } from '../../utils/utils';
import { getAssetExpandFromProjectExpand } from '../asset/mappers/assetMapperDTO';
import { historyService } from '../history/historyService';
import { IHistoryOptions } from '../history/mongo/historyRepository';
import { interventionService } from '../interventions/interventionService';
import { InterventionFindOptions } from '../interventions/models/interventionFindOptions';
import { interventionRepository } from '../interventions/mongo/interventionRepository';
import { programBooksOnProjectUpdateCommand } from '../programBooks/programBooksOnProjectUpdateCommand';
import { submissionRepository } from '../submissions/mongo/submissionRepository';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { ProjectFindOneOptions } from './models/projectFindOneOptions';
import { ProjectFindOptions } from './models/projectFindOptions';
import { ProjectFindPaginatedOptions } from './models/projectFindPaginatedOptions';
import { projectRepository } from './mongo/projectRepository';
import { projectService } from './projectService';
import { ByProjectIdCommand } from './useCases/byProjectIdCommand';
import { projectValidator } from './validators/projectValidator';

/**
 * Application controller
 *
 * Part of the "Mongo/Mongoose examples" provided by the generator.
 *
 * The "@autobind" decorator automatically binds all the methods of
 * the class to the proper "this" value. When a route is executed,
 * the receiving method of the controller must be properly bound or
 * "this" will not represent the controller instance.
 * @see https://github.com/andreypopp/autobind-decorator
 */
@autobind
export class ProjectController {
  /**
   * Creates a new PlainProject and associates interventions
   */
  public async create(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const input: IPlainProject = req.body;

    // fetches all interventions that is part of the project
    const interventionFindOptions = InterventionFindOptions.create({
      criterias: {
        id: input.interventionIds
      }
    });
    if (interventionFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptions)));
    }
    const interventions = await interventionRepository.findAll(interventionFindOptions.getValue());
    const medals = await taxonomyService.getGroup(TaxonomyGroup.medalType);
    // validations of project attributes
    await projectValidator.validateInputForCreation(input, interventions);
    const updatedProject = await projectService.createProject(input, interventions, medals);
    projectService.calculateBudgets(updatedProject);
    delete updatedProject.interventions;

    const saveProjectResult = await projectRepository.save(updatedProject);
    if (saveProjectResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveProjectResult)));
    }

    const updatedInterventions = await interventionService.updateInterventionsToIntegrate<IEnrichedIntervention>(
      interventions,
      saveProjectResult.getValue()
    );
    await this.persistInterventions(updatedInterventions);

    res.status(HttpStatusCodes.CREATED).send(saveProjectResult.getValue());
  }

  /**
   * Get one project based on id
   */
  public async getOne(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const projectFindOptionsResult = ProjectFindOneOptions.create({
      criterias: {
        id: req.params.id
      },
      expand: req.query.expand
    });
    if (projectFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(projectFindOptionsResult)));
    }

    const request: IProjectPaginatedSearchRequest = req.query;
    await projectValidator.validateProjectSearchRequest(request);

    const project = await projectRepository.findOne(projectFindOptionsResult.getValue());
    if (!project) {
      throw createNotFoundError('Could not find the project');
    }

    if (req.query.expand && req.query.expand.includes(ProjectExpand.interventions)) {
      for (const intervention of project.interventions) {
        const assetExpand = getAssetExpandFromProjectExpand(req.query.expand);
        intervention.assets = await assetService.enrichAssetsWithWfs(intervention.assets, assetExpand);
      }
    }

    res.status(HttpStatusCodes.OK).send(projectSanitizer.sanitize(project));
  }

  /*
   * Searches projects from the GET verb.
   */
  public async searchGet(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const searchRequest: IProjectPaginatedSearchRequest = req.query;
    projectService.prepareSearchRequest(searchRequest);

    const paginatedSearchRequest = await this.search(searchRequest);

    res.status(HttpStatusCodes.OK).send(paginatedSearchRequest);
  }

  /*
   * Searches projects from the POST verb.
   */
  public async searchPost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const searchRequest: IProjectPaginatedSearchRequest = req.body;

    const paginatedSearchRequest = await this.search(searchRequest);

    res.status(HttpStatusCodes.OK).send(paginatedSearchRequest);
  }

  public async search(searchRequest: IProjectPaginatedSearchRequest): Promise<IEnrichedPaginatedProjects> {
    await projectValidator.validateProjectSearchRequest(searchRequest);
    const { offset, limit, expand, orderBy, fields, ...criterias } = searchRequest;
    const projectFindOptionsResult = ProjectFindPaginatedOptions.create({
      criterias,
      offset,
      limit,
      expand: convertStringOrStringArray(expand).join(','),
      orderBy,
      fields: convertStringOrStringArray(fields).join(',')
    });
    if (projectFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(projectFindOptionsResult)));
    }
    const paginatedProjects = await projectRepository.findPaginated(projectFindOptionsResult.getValue());

    if (expand && expand.includes(ProjectExpand.interventions)) {
      for (const projects of paginatedProjects.items) {
        for (const intervention of projects.interventions) {
          const assetExpand = getAssetExpandFromProjectExpand(expand);
          intervention.assets = await assetService.enrichAssetsWithWfs(intervention.assets, assetExpand);
        }
      }
    }

    projectSanitizer.sanitizeArray(paginatedProjects.items);
    return paginatedProjects;
  }

  public async getCountBySearch(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const searchRequest: IProjectCountBySearchRequest = req.query;
    projectService.prepareSearchRequest(searchRequest);
    const countBys = await this.countBySearch(searchRequest);
    res.status(HttpStatusCodes.OK).send(countBys);
  }

  public async postCountBySearch(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const searchRequest: IProjectCountBySearchRequest = req.body;
    const countBys = await this.countBySearch(searchRequest);
    res.status(HttpStatusCodes.OK).send(countBys);
  }

  public async countBySearch(searchRequest: IProjectCountBySearchRequest): Promise<ICountBy[]> {
    await projectValidator.validateProjectCountBySearchRequest(searchRequest);
    const { countBy, ...criterias } = searchRequest;
    const projectFindOptionsResult = ProjectFindOptions.create({
      criterias,
      offset: undefined,
      limit: undefined, // Offset et limit wont be used in a countby request
      countBy
    });
    if (projectFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(projectFindOptionsResult)));
    }
    return projectRepository.countBy(projectFindOptionsResult.getValue());
  }

  /**
   * update
   */
  public async update(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const byProjectIdCommandResult = ByProjectIdCommand.create({
      id: req.params.id
    });
    if (byProjectIdCommandResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(byProjectIdCommandResult)));
    }
    const originalProject = await projectRepository.findById(byProjectIdCommandResult.getValue().id, [
      ProjectExpand.interventions
    ]);
    if (isEmpty(originalProject)) {
      throw createNotFoundError("Project id doesn't exist");
    }
    const inputProject: IPlainProject = req.body;
    // validare current project and incoming project
    const restrictionsResult = Result.combine([
      projectValidator.validateRestrictions(originalProject),
      projectValidator.validateRestrictions(inputProject)
    ]);
    if (restrictionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResult)));
    }
    const interventionFindOptions = InterventionFindOptions.create({
      criterias: {
        id: inputProject.interventionIds
      }
    });
    if (interventionFindOptions.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptions)));
    }
    const interventions = await interventionRepository.findAll(interventionFindOptions.getValue());

    // validations of project attributes
    await projectValidator.validateInputForUpdate(inputProject, originalProject, interventions);
    const medals = await taxonomyService.getGroup(TaxonomyGroup.medalType);
    const updatedProject = await projectService.updateProject(inputProject, originalProject, interventions, medals);
    const updatedInterventions = await projectService.updateProjectInterventions(
      originalProject.interventions,
      interventions,
      updatedProject
    );
    const currentMoreInformation = projectService.buildMoreInformation(originalProject);
    const newMoreInformation = projectService.buildMoreInformation(updatedProject);
    this.updateProjectBudgets(updatedProject, updatedInterventions);

    const historyOptions = historyService.buildHistoryOptions(
      EntityType.moreInformation,
      currentMoreInformation,
      newMoreInformation
    );
    const persistedProjectResult = await projectRepository.save(updatedProject, { history: historyOptions });
    if (persistedProjectResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(persistedProjectResult)));
    }

    await this.persistInterventions(updatedInterventions);

    await programBooksOnProjectUpdateCommand.execute(originalProject, persistedProjectResult.getValue());
    const result = projectSanitizer.sanitize(persistedProjectResult.getValue());
    res.status(HttpStatusCodes.OK).send(result);
  }

  /**
   * Updates interventions
   * @param interventions
   */
  private async persistInterventions(
    interventions: IEnrichedIntervention[],
    historyOptions?: IHistoryOptions
  ): Promise<IEnrichedIntervention[]> {
    const persistedInterventions: IEnrichedIntervention[] = [];
    for (const intervention of interventions) {
      intervention.audit = auditService.buildAudit(intervention.audit);
      const persistedInterventionResult = await interventionRepository.save(
        { ...intervention, id: intervention.id },
        { history: historyOptions }
      );
      if (persistedInterventionResult.isFailure) {
        throw createInvalidParameterError(persistedInterventionResult.error.toString());
      }
      persistedInterventions.push(persistedInterventionResult.getValue());
    }
    return persistedInterventions;
  }

  public async addDecision(req: AgirRequest, res: express.Response): Promise<void> {
    const input: IProjectDecision = req.body.decision;
    const wantedPermission = projectService.getPermissionForDecision(input.typeId);
    if (!wantedPermission) {
      throw createInvalidParameterError('Invalid Parameter TypeId');
    }
    if (!req.user || !req.user.hasPermission(wantedPermission)) {
      throw createForbiddenError(
        `The user ${get(req.user, 'userName')} is not allowed to execute the action. Permission: ${wantedPermission}`,
        `You are not allowed to execute this action.`
      );
    }
    const annualPeriodYear: number = req.body.annualPeriodYear;
    const byProjectIdCommandResult = ByProjectIdCommand.create({
      id: req.params.id
    });
    if (byProjectIdCommandResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(byProjectIdCommandResult)));
    }
    const byProjectIdCommand = byProjectIdCommandResult.getValue();

    const project = await projectRepository.findById(byProjectIdCommand.id, [ProjectExpand.interventions]);
    if (isEmpty(project)) {
      throw createNotFoundError(`Project is nonexistant for id : ${req.params.id}`);
    }

    const restrictionsResults = projectValidator.validateRestrictions(project);
    if (restrictionsResults.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResults)));
    }

    if (project.submissionNumber && input.typeId in ProjectDecisionType) {
      const tmpSubmission = await submissionRepository.findById(project.submissionNumber);
      if (tmpSubmission.status === SubmissionStatus.VALID) {
        throw createConflictError("Project on valid submission can't be removed");
      }
    }

    const annualPeriod = await projectService.getProjectAnnualPeriodByYear(project, annualPeriodYear);
    const originalProject = cloneDeep(project);

    await projectValidator.validateInputForDecision(input, project, annualPeriod);
    const updatedProject = await projectService.addDecision(project, input, annualPeriod);

    projectService.calculateBudgets(updatedProject);

    let interventionHistoryOptions: IHistoryOptions = {
      operation: constants.operation.UPDATE
    } as IHistoryOptions;
    if (input.typeId === ProjectDecisionType.postponed || input.typeId === ProjectDecisionType.replanned) {
      interventionHistoryOptions = {
        ...interventionHistoryOptions,
        categoryId: constants.historyCategoryId.DECISION,
        comments: constants.systemMessages.DECISION_ADDED
      };
    } else {
      interventionHistoryOptions = {
        ...interventionHistoryOptions,
        categoryId: constants.historyCategoryId.STATUS,
        comments: constants.systemMessages.PROJECT_INTERVENTION_STATUS
      };
    }

    await this.persistInterventions(updatedProject.interventions, interventionHistoryOptions);

    if (input.typeId === ProjectDecisionType.canceled) {
      updatedProject.interventionIds = [];
      updatedProject.interventions = [];
    }
    const persistedProject = await this.persistProject(updatedProject, {
      categoryId: constants.historyCategoryId.DECISION,
      comments: constants.systemMessages.DECISION_ADDED
    });

    await programBooksOnProjectUpdateCommand.execute(originalProject, persistedProject);

    res.status(HttpStatusCodes.CREATED).send(projectSanitizer.sanitize(persistedProject));
  }

  private async persistProject(project: IEnrichedProject, historyOptions: IHistoryOptions): Promise<IEnrichedProject> {
    // interventions must be delete because intervention can be change everywhere
    // and it will cause squashing errors if they are saved in project too
    delete project.interventions;
    const saveProjectResult = await projectRepository.save(project, { history: historyOptions });
    if (saveProjectResult.isFailure) {
      throw createInvalidParameterError(saveProjectResult.error.toString());
    }
    return saveProjectResult.getValue();
  }

  public async updateProjectAnnualDistribution(req: AgirRequest, res: express.Response): Promise<void> {
    const byProjectIdCommandResult = ByProjectIdCommand.create({
      id: req.params.id
    });
    if (byProjectIdCommandResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(byProjectIdCommandResult)));
    }
    const byProjectIdCommand = byProjectIdCommandResult.getValue();
    const originalProject = await projectRepository.findById(byProjectIdCommand.id, [ProjectExpand.interventions]);
    if (isEmpty(originalProject)) {
      throw createNotFoundError("Project id doesn't exist");
    }

    const restrictionsResults = projectValidator.validateRestrictions(originalProject);
    if (restrictionsResults.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResults)));
    }

    const input: IPlainProjectAnnualDistribution = req.body;

    const updatedProject = await projectService.updateAnnualDistribution(input, originalProject);
    await projectValidator.validateAnnualDistributionForUpdate(updatedProject);

    projectService.calculateBudgets(updatedProject);

    const persistedProjectResult = await projectRepository.save(updatedProject, {
      history: {
        categoryId: constants.historyCategoryId.ANNUAL_DISTRIBUTION,
        comments: constants.systemMessages.ANNUAL_DISTRIBUTION_UPDATED
      }
    });
    if (persistedProjectResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(persistedProjectResult)));
    }
    await programBooksOnProjectUpdateCommand.execute(originalProject, persistedProjectResult.getValue());

    res.status(HttpStatusCodes.OK).send(projectSanitizer.sanitize(persistedProjectResult.getValue()));
  }

  public async getDecisions(req: AgirRequest, res: express.Response): Promise<void> {
    const byProjectIdCommandResult = ByProjectIdCommand.create({
      id: req.params.id
    });
    if (byProjectIdCommandResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(byProjectIdCommandResult)));
    }
    const project = await projectRepository.findById(req.params.id);
    const decisions = project.decisions || [];
    res.status(HttpStatusCodes.OK).send(decisions);
  }

  private updateProjectBudgets(project: IEnrichedProject, interventions: IEnrichedIntervention[]): void {
    project.interventions = interventions?.filter(intervention => project.interventionIds.includes(intervention.id));
    projectService.calculateBudgets(project);
    delete project.interventions;
  }
}
export const projectController: ProjectController = new ProjectController();

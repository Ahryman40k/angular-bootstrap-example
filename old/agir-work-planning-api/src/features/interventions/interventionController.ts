import {
  AssetExpand,
  ICountBy,
  IEnrichedIntervention,
  IEnrichedPaginatedInterventions,
  IEnrichedProject,
  IInterventionAnnualDistribution,
  IInterventionCountBySearchRequest,
  IInterventionDecision,
  IInterventionPaginatedSearchRequest,
  InterventionDecisionType,
  InterventionExpand,
  InterventionStatus,
  IPlainIntervention,
  IProjectDecision,
  ProjectExpand
} from '@villemontreal/agir-work-planning-lib';
import {
  createForbiddenError,
  createInvalidParameterError,
  createNotFoundError
} from '@villemontreal/core-utils-general-nodejs-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { cloneDeep, get, isEmpty, isNil } from 'lodash';

import { constants, EntityType } from '../../../config/constants';
import { AgirRequest } from '../../models/requests';
import { interventionPaginatedSearchRequestSanitizer } from '../../sanitizers/interventionPaginatedSearchRequestSanitizer';
import { interventionSanitizer } from '../../sanitizers/interventionSanitizer';
import { interventionSearchRequestSanitizer } from '../../sanitizers/interventionSearchRequestSanitizer';
import { assetService } from '../../services/assetService';
import { auditService } from '../../services/auditService';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { ForbiddenError } from '../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { enumValues } from '../../utils/enumUtils';
import { createInvalidInputError } from '../../utils/errorUtils';
import { stateMachine } from '../../utils/stateMachine';
import { historyService } from '../history/historyService';
import { IHistoryOptions } from '../history/mongo/historyRepository';
import { programBooksOnProjectUpdateCommand } from '../programBooks/programBooksOnProjectUpdateCommand';
import { projectRepository } from '../projects/mongo/projectRepository';
import { projectService } from '../projects/projectService';
import { projectValidator } from '../projects/validators/projectValidator';
import { interventionService } from './interventionService';
import { InterventionFindOneOptions } from './models/interventionFindOneOptions';
import { InterventionFindOptions } from './models/interventionFindOptions';
import { InterventionFindPaginatedOptions } from './models/interventionFindPaginatedOptions';
import { interventionRepository } from './mongo/interventionRepository';
import { interventionValidator } from './validators/interventionValidator';

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
export class InterventionController {
  public async create(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const plainIntervention: IPlainIntervention = req.body;
    if (isEmpty(plainIntervention)) {
      throw createInvalidParameterError('The application to save is required');
    }

    // validate input plainIntervention, errors 400 are generated directly
    await interventionValidator.validateForCreate(plainIntervention);

    const restrictionsResults = interventionValidator.validateRestrictions(plainIntervention);
    if (restrictionsResults.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResults)));
    }

    const enrichedIntervention = await interventionService.createIntervention(plainIntervention);

    const saveInterventionResult = await interventionRepository.save(enrichedIntervention);
    if (saveInterventionResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveInterventionResult)));
    }
    res.status(HttpStatusCodes.CREATED).send(saveInterventionResult.getValue());
  }

  public async getOne(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const isExpand = req.query.expand && req.query.expand.includes(InterventionExpand.assets);
    const expand = isExpand ? [AssetExpand.assetDetails] : [];
    const intervention = await this.getInterventionById(req.params.id, expand);
    const sanitizedIntervention = interventionSanitizer.sanitize(intervention);
    res.status(HttpStatusCodes.OK).send(sanitizedIntervention);
  }

  /**
   * Update selected intervention (by id)
   */
  public async update(req: express.Request, res: express.Response, next: express.NextFunction) {
    const inputIntervention: IPlainIntervention = req.body;
    const intervention = await this.getInterventionById(req.params.id);
    // validate intervention coming from database and intrevention to update(from request body)
    const restrictionsResult = Result.combine([
      interventionValidator.validateRestrictions(intervention),
      interventionValidator.validateRestrictions(inputIntervention)
    ]);
    if (restrictionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResult)));
    }
    const previousIntervention = cloneDeep(intervention);
    await interventionValidator.validateForUpdate(intervention, inputIntervention);
    const currentMoreInformation = interventionService.buildMoreInformation(intervention);
    await interventionService.updateIntervention(intervention, inputIntervention);
    const newMoreInformation = interventionService.buildMoreInformation(intervention);

    let project: IEnrichedProject;
    if (intervention.project?.id) {
      project = await projectRepository.findById(intervention.project.id, [ProjectExpand.interventions]);
      if (isNil(project)) {
        throw errorMtlMapper.toApiError(
          new NotFoundError(`Intervention project ${intervention.project.id} was not found`)
        );
      }
    }
    // check before saving to db
    if (project) {
      await projectValidator.validateProjectIntegrityForIntervention(intervention, project);
    }

    const historyOptions = historyService.buildHistoryOptions(
      EntityType.moreInformation,
      currentMoreInformation,
      newMoreInformation
    );
    const saveInterventionResult = await interventionRepository.save(intervention, { history: historyOptions });
    if (saveInterventionResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveInterventionResult)));
    }
    const updatedIntervention = saveInterventionResult.getValue();

    if (project) {
      // Replace intervention in project by updated intervention
      const interventionIndex = project.interventions.findIndex(i => i.id === updatedIntervention.id);
      project.interventions.splice(interventionIndex, 1, updatedIntervention);
      await projectValidator.validateProjectIntegrityForIntervention(updatedIntervention, project);

      const projectUpdateResult = await interventionService.updateProjectOnInterventionUpdate(
        project,
        previousIntervention,
        updatedIntervention
      );
      if (projectUpdateResult.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(projectUpdateResult)));
      }
      /// I dont get the "programBooksOnProjectUpdateCommand"
      await programBooksOnProjectUpdateCommand.execute(project, projectUpdateResult.getValue(), intervention);
    }
    res.status(HttpStatusCodes.OK).send(saveInterventionResult.getValue());
  }

  /**
   * Searches interventions from the GET verb.
   * @param req
   * @param res
   * @param next
   */
  public async searchGet(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const searchRequest: IInterventionPaginatedSearchRequest = req.query;
    interventionPaginatedSearchRequestSanitizer.sanitize(searchRequest);
    const paginatedInterventions = await this.search(searchRequest);
    res.status(HttpStatusCodes.OK).send(paginatedInterventions);
  }

  /**
   * Searches interventions from the POST verb.
   * @param req
   * @param res
   * @param next
   */
  public async searchPost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const searchRequest: IInterventionPaginatedSearchRequest = req.body;
    const paginatedInterventions = await this.search(searchRequest);
    res.status(HttpStatusCodes.OK).send(paginatedInterventions);
  }

  /**
   * Searches interventions.
   * Returns a paginated result.
   * @param searchRequest The intervention search request.
   */
  private async search(searchRequest: IInterventionPaginatedSearchRequest): Promise<IEnrichedPaginatedInterventions> {
    await interventionValidator.validateSearchRequest(searchRequest);
    const { offset, limit, expand, orderBy, fields, ...criterias } = searchRequest;
    const interventionFindOptionsResult = InterventionFindPaginatedOptions.create({
      criterias,
      offset,
      limit,
      expand: convertStringOrStringArray(expand).join(','),
      orderBy,
      fields: convertStringOrStringArray(fields).join(',')
    });
    if (interventionFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptionsResult)));
    }
    const paginatedInterventions = await interventionRepository.findPaginated(interventionFindOptionsResult.getValue());

    if (expand && expand.includes(InterventionExpand.assets)) {
      for (const intervention of paginatedInterventions.items) {
        intervention.assets = await assetService.enrichAssetsWithWfs(intervention.assets, [AssetExpand.assetDetails]);
      }
    }

    interventionSanitizer.sanitizeArray(paginatedInterventions.items);
    return paginatedInterventions;
  }

  /**
   * Counts interventions by a key from the GET verb.
   * @param req
   * @param res
   * @param next
   */
  public async countByGet(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const searchRequest: IInterventionCountBySearchRequest = req.query;
    interventionSearchRequestSanitizer.sanitize(searchRequest);
    const interventionsCount = await this.countBy(searchRequest);
    res.status(HttpStatusCodes.OK).send(interventionsCount);
  }

  /**
   * Counts interventions by a key from the POST verb.
   * @param req
   * @param res
   * @param next
   */
  public async countByPost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const searchRequest: IInterventionCountBySearchRequest = req.body;
    const interventionsCount = await this.countBy(searchRequest);
    res.status(HttpStatusCodes.OK).send(interventionsCount);
  }

  /**
   * Counts interventions by a key.
   * Returns an array of interventions count.
   * @param searchRequest The intervention count by search request.
   */
  private async countBy(searchRequest: IInterventionCountBySearchRequest): Promise<ICountBy[]> {
    await interventionValidator.validateCountBySearchRequest(searchRequest);
    const { countBy, ...criterias } = searchRequest;
    const interventionFindOptionsResult = InterventionFindOptions.create({
      criterias,
      offset: undefined,
      limit: undefined, // Offset et limit wont be used in a countby request,
      countBy
    });
    if (interventionFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptionsResult)));
    }
    return interventionRepository.countBy(interventionFindOptionsResult.getValue());
  }

  public async deleteById(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const interventionId = req.params.id;
    const currentIntervention = await this.getInterventionById(interventionId);
    const restrictionsResults = interventionValidator.validateRestrictions(currentIntervention);
    if (restrictionsResults.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResults)));
    }
    interventionValidator.validateForDelete(currentIntervention);
    const interventionFindOptionsResult = InterventionFindOptions.create({
      criterias: {
        id: interventionId
      }
    });
    if (interventionFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptionsResult)));
    }
    await interventionRepository.delete(interventionFindOptionsResult.getValue());

    res.status(HttpStatusCodes.NO_CONTENT).send({ message: 'The resource was deleted' });
  }
  // NOSONAR
  // tslint:disable: cyclomatic-complexity
  public async addDecision(req: AgirRequest, res: express.Response): Promise<void> {
    const wantedPermission = interventionService.getPermissionForDecision(req.body.typeId);
    if (!wantedPermission) {
      throw createInvalidParameterError('Invalid Parameter TypeId');
    }
    if (!req.user || !req.user.hasPermission(wantedPermission)) {
      throw createForbiddenError(
        `The user ${get(req.user, 'userName')} is not allowed to execute the action. Permission: ${wantedPermission}`,
        `You are not allowed to execute this action.`
      );
    }

    const intervention = await this.getInterventionById(req.params.id);
    const restrictionsResults = interventionValidator.validateRestrictions(intervention);
    if (restrictionsResults.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResults)));
    }
    const newDecision: IInterventionDecision = req.body;
    const decisionAudit = auditService.buildAudit();
    newDecision.audit = decisionAudit;
    if (
      newDecision.typeId === InterventionDecisionType.revisionRequest &&
      !interventionService.isDecisionAllowed(intervention)
    ) {
      throw createInvalidInputError(
        `The revision request is not allowed, it must be done on the last decision and must be of type refused`
      );
    }

    if (
      [InterventionDecisionType.refused, InterventionDecisionType.returned].includes(
        newDecision.typeId as InterventionDecisionType
      ) &&
      intervention.project?.id
    ) {
      throw createInvalidInputError(`Refusing or returning an intervention belonging to a project is not allowed`);
    }

    if (newDecision.typeId === InterventionDecisionType.returned && intervention.programId) {
      throw createInvalidInputError(`Returning an intervention with program is not allowed`);
    }

    const updatedDecisions = await interventionService.addDecision(intervention, newDecision);
    let updatedIntervention: IEnrichedIntervention;

    const project: IEnrichedProject = intervention.project
      ? await projectRepository.findById(intervention.project.id, [ProjectExpand.interventions])
      : null;
    const originalProject = cloneDeep(project);
    const currentYear = intervention.planificationYear || null;
    let targetYear = null;
    if (newDecision.hasOwnProperty('targetYear')) {
      targetYear = newDecision.targetYear;
    }
    // decision status update intervention status
    updatedIntervention = cloneDeep(intervention);
    const updatedInterventionStatus = interventionService.getStatusFromDecisionType(
      newDecision.typeId as InterventionDecisionType
    );
    // add decisions to intervention
    updatedIntervention = Object.assign({}, updatedIntervention, { decisions: updatedDecisions });
    if (updatedInterventionStatus) {
      stateMachine.changeState(updatedIntervention, updatedInterventionStatus, {
        targetYear,
        currentYear,
        project
      });
    }

    stateMachine.updatePlanificationYear(newDecision.typeId, targetYear, updatedIntervention);

    if (project) {
      if (newDecision.typeId === InterventionDecisionType.canceled) {
        const tmpProject = await projectRepository.findById(project.id, [ProjectExpand.interventions]);
        project.interventions = tmpProject.interventions;
        const projectDecision: IProjectDecision = {
          ...newDecision
        };
        await interventionService.handleInterventionCancelation(updatedIntervention, project, projectDecision);
        projectService.calculateBudgets(project);
      }

      await projectRepository.save(project);
    }

    await interventionValidator.validate<IEnrichedIntervention>(updatedIntervention);
    interventionService.setDecisionRequired(updatedIntervention);
    updatedIntervention.audit = auditService.buildAudit(intervention.audit);

    const historyOptions = {
      categoryId: constants.historyCategoryId.DECISION,
      comments: constants.systemMessages.DECISION_ADDED,
      operation: constants.operation.CREATE
    };
    const saveInterventionResult = await interventionRepository.save(
      {
        ...updatedIntervention,
        id: req.params.id
      },
      { history: historyOptions }
    );
    if (saveInterventionResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(saveInterventionResult)));
    }
    if (project) {
      await programBooksOnProjectUpdateCommand.execute(originalProject, project);
    }

    res.status(HttpStatusCodes.CREATED).send(saveInterventionResult.getValue());
  }

  public async getDecisions(req: express.Request, res: express.Response): Promise<void> {
    const intervention = await this.getInterventionById(req.params.id);
    res.status(HttpStatusCodes.OK).send(intervention.decisions);
  }

  public async updateInterventionAnnualDistribution(req: AgirRequest, res: express.Response): Promise<void> {
    const intervention = await this.getInterventionById(req.params.id);
    const originalIntervention = cloneDeep(intervention);
    const restrictionsResults = interventionValidator.validateRestrictions(originalIntervention);
    if (restrictionsResults.isFailure) {
      throw errorMtlMapper.toApiError(new ForbiddenError(Result.combineForError(restrictionsResults)));
    }
    const annualDistribution: IInterventionAnnualDistribution = req.body;

    const project = await projectRepository.findById(intervention.project.id, [ProjectExpand.interventions]);
    const originalProject = cloneDeep(project);

    if (isEmpty(project)) {
      throw createInvalidInputError(`The intervention must have a project in order to edit its annual distribution`);
    }

    const updatedIntervention = await interventionService.updateAnnualDistribution(intervention, annualDistribution);
    interventionService.updateProjectWithNewIntervention(project, updatedIntervention);

    projectService.calculateBudgets(project);
    await projectRepository.save(project);

    const calculatedIntervention = project.interventions.find(i => i.id === intervention.id);

    const historyOptions = {
      categoryId: constants.historyCategoryId.ANNUAL_DISTRIBUTION,
      comments: constants.systemMessages.ANNUAL_DISTRIBUTION_UPDATED
    };
    const persistedIntervention = await this.persistIntervention(calculatedIntervention, historyOptions);

    await programBooksOnProjectUpdateCommand.execute(originalProject, project, originalIntervention);
    res.status(HttpStatusCodes.OK).send(persistedIntervention);
  }

  private async persistIntervention(
    intervention: IEnrichedIntervention,
    historyOptions: IHistoryOptions
  ): Promise<IEnrichedIntervention> {
    const saveInterventionResult = await interventionRepository.save(
      {
        ...intervention,
        id: intervention.id
      },
      { history: historyOptions }
    );
    if (saveInterventionResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveInterventionResult)));
    }
    return saveInterventionResult.getValue();
  }

  /**
   * Returns an intervention if it exists, otherwise throws an error detailing the problem.
   */
  private async getInterventionById(id: string, expand: AssetExpand[] = []): Promise<IEnrichedIntervention> {
    const interventionFindOptionsResult = InterventionFindOneOptions.create({
      criterias: {
        id,
        status: enumValues(InterventionStatus).join(',')
      }
    });
    if (interventionFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptionsResult)));
    }
    const intervention = await interventionRepository.findOne(interventionFindOptionsResult.getValue());
    if (isEmpty(intervention)) {
      throw createNotFoundError("Intervention id doesn't exist");
    }
    intervention.assets = await assetService.enrichAssetsWithWfs(intervention.assets, expand);
    return intervention;
  }
}
export const interventionController: InterventionController = new InterventionController();

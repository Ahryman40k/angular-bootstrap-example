import {
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  IInterventionAnnualDistribution,
  IInterventionDecision,
  InterventionDecisionType,
  InterventionExternalReferenceType,
  InterventionStatus,
  IPlainIntervention,
  IPlainProject,
  IPoint3D,
  IProjectDecision,
  Permission,
  ProjectStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { MultiPolygon, Polygon } from 'geojson';
import { cloneDeep, includes, isEmpty, isEqual, isNil, remove } from 'lodash';

import { EntityType } from '../../../config/constants';
import { geolocatedAnnualDistributionService } from '../../services/annualDistribution/geolocatedAnnualDistributionService';
import { auditService } from '../../services/auditService';
import { projectMedalService } from '../../services/projectMedalService';
import { spatialAnalysisService } from '../../services/spatialAnalysisService';
import { workAreaService } from '../../services/workAreaService';
import { workLengthService } from '../../services/workLengthService';
import { Result } from '../../shared/logic/result';
import { joinStrings } from '../../utils/arrayUtils';
import { stateMachine } from '../../utils/stateMachine';
import { createInvalidParameterError, createUnprocessableEntityError } from '../../utils/utils';
import { commonValidator } from '../../validators/commonValidator';
import { historyService, IMoreInformation } from '../history/historyService';
import { projectRepository } from '../projects/mongo/projectRepository';
import { projectService } from '../projects/projectService';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { InterventionValidator } from './validators/interventionValidator';

export interface IInterventionService {
  addDecision(
    currentDecisions: IEnrichedIntervention,
    decision: IInterventionDecision
  ): Promise<IInterventionDecision[]>;
  setDecisionRequired(currentIntervention: IEnrichedIntervention, value?: boolean): void;
  isDecisionAllowed(intervention: IEnrichedIntervention): boolean;
  updateAnnualDistribution(
    intervention: IEnrichedIntervention,
    annualDistribution: IInterventionAnnualDistribution
  ): Promise<IEnrichedIntervention>;
  updateProjectWithNewIntervention(project: IEnrichedProject, intervention: IEnrichedIntervention): void;
  validateWorkAreaInput(geometries: IGeometry[]): void;
  generateInterventionName(
    assetWorkTypeId: string,
    assetTypeId: string,
    interventionWorkAreaSuggestedStreetName?: string
  ): Promise<string>;
  updateIntervention(intervention: IEnrichedIntervention, plainIntervention: IPlainIntervention): Promise<void>;
  updateProjectInterventionsStatus(
    project: IEnrichedProject,
    interventions: IEnrichedIntervention[]
  ): Promise<IEnrichedIntervention[]>;
  updateInterventionsToIntegrate<T extends IPlainIntervention | IEnrichedIntervention>(
    interventions: T[],
    project: IPlainProject | IEnrichedProject
  ): Promise<T[]>;
  assertCanInteract(intervention: IEnrichedIntervention): void;
  handleInterventionCancelation(
    intervention: IEnrichedIntervention,
    project: IEnrichedProject,
    projectDecision: IProjectDecision
  ): Promise<void>;
  getGeometryPin(geometry: IGeometry): IPoint3D;
  setAssetsLength(intervention: Partial<IEnrichedIntervention>, originalInterventionArea: IGeometry): void;
  setMoreInformationUpdateAudit(intervention: IEnrichedIntervention, plainIntervention: IPlainIntervention): void;
  buildMoreInformation(intervention: IEnrichedIntervention): IMoreInformation;
  convertPlainToEnrichedIntervention(intervention: IPlainIntervention): IEnrichedIntervention;
  createIntervention(intervention: IPlainIntervention): Promise<IEnrichedIntervention>;
  getInterventionIds(interventions: IEnrichedIntervention[]): string[];
  addProjectToInterventions(project: IEnrichedProject, interventions: IEnrichedIntervention[]): void;
  updateProjectOnInterventionUpdate(
    project: IEnrichedProject,
    originalIntervention: IEnrichedIntervention,
    updatedIntervention: IEnrichedIntervention
  ): Promise<Result<IEnrichedProject>>;
  getStatusFromDecisionType(decisionType: InterventionDecisionType): InterventionStatus;
  getPermissionForDecision(decisionType: InterventionDecisionType): Permission;
}

class InterventionService implements IInterventionService {
  public validateWorkAreaInput(geometries: IGeometry[]): void {
    if (isEmpty(geometries)) {
      throw createInvalidParameterError('The input geometry is required');
    }
    for (const geometry of geometries) {
      if (!commonValidator.isValidGeometry(geometry)) {
        throw createInvalidParameterError('The input polygon is not valid');
      }
    }
  }

  public async createIntervention(input: IPlainIntervention): Promise<IEnrichedIntervention> {
    const intervention: IEnrichedIntervention = this.convertPlainToEnrichedIntervention(input);
    const simplifiedworkArea = await spatialAnalysisService.initializeSpatialProperties(
      EntityType.intervention,
      intervention,
      intervention.interventionArea?.geometry
    );

    const targetStatus = (intervention.status as InterventionStatus) || InterventionStatus.wished;
    stateMachine.changeState(intervention, targetStatus, {
      targetYear: intervention.planificationYear
    });
    stateMachine.updateInterventionYear(targetStatus, intervention.planificationYear, intervention);
    this.setDecisionRequired(intervention);
    intervention.audit = auditService.buildAudit();
    intervention.interventionArea.geometry = simplifiedworkArea;
    intervention.interventionArea.geometryPin = this.getGeometryPin(intervention.interventionArea?.geometry);
    this.setAssetsLength(intervention, null);
    intervention.moreInformationAudit = auditService.buildAudit();
    return intervention;
  }

  public async addDecision(
    intervention: IEnrichedIntervention,
    decision: IInterventionDecision
  ): Promise<IInterventionDecision[]> {
    this.assertCanInteract(intervention);
    this.setDecisionPreviousYear(intervention, decision);
    const decisions = intervention.decisions ? intervention.decisions : [];
    decisions.splice(0, 0, decision);
    return decisions;
  }

  // automatically change the property decisionRequired with the latest decision
  public setDecisionRequired(currentIntervention: IEnrichedIntervention): void {
    const decisionTypesRequiredDecision = [InterventionDecisionType.refused, InterventionDecisionType.accepted];
    currentIntervention.decisionRequired = false;
    if (
      (isEmpty(currentIntervention.decisions) ||
        !includes(decisionTypesRequiredDecision, currentIntervention.decisions[0].typeId)) &&
      currentIntervention.programId &&
      currentIntervention.status === InterventionStatus.waiting
    ) {
      currentIntervention.decisionRequired = true;
    }
  }

  // Check if the decision to add is made on the last decision (must be refused) of the intervention
  public isDecisionAllowed(intervention: IEnrichedIntervention): boolean {
    if (intervention?.status === InterventionStatus.refused) {
      return true;
    }
    return false;
  }

  public async updateIntervention(
    intervention: IEnrichedIntervention,
    plainIntervention: IPlainIntervention
  ): Promise<void> {
    const originalInterventionArea = workAreaService.simplifyWorkArea(
      cloneDeep(intervention.interventionArea.geometry)
    );
    const balance = plainIntervention.estimate - intervention.estimate.burnedDown;
    intervention.assets = cloneDeep(plainIntervention.assets);
    intervention.audit = auditService.buildAudit(intervention.audit);
    // Change audit only if a change occurs in the more information informations
    this.setMoreInformationUpdateAudit(intervention, { ...intervention, ...plainIntervention });
    intervention.boroughId = plainIntervention.boroughId;
    intervention.contact = plainIntervention.contact || null;
    intervention.estimate = {
      allowance: plainIntervention.estimate,
      burnedDown: intervention.estimate.burnedDown,
      balance
    };
    intervention.executorId = plainIntervention.executorId;
    // Recalculate road sections only if intervention area was changed
    if (!isEqual(intervention.interventionArea.geometry, plainIntervention.interventionArea.geometry)) {
      await spatialAnalysisService.initializeSpatialProperties(
        EntityType.intervention,
        intervention,
        plainIntervention.interventionArea?.geometry
      );
    }
    intervention.interventionArea.geometry = workAreaService.simplifyWorkArea(
      plainIntervention.interventionArea.geometry
    );
    intervention.interventionArea.geometryPin = this.getGeometryPin(plainIntervention.interventionArea?.geometry);
    intervention.interventionName = plainIntervention.interventionName;
    intervention.interventionTypeId = plainIntervention.interventionTypeId;
    intervention.interventionYear = plainIntervention.interventionYear;
    intervention.medalId = plainIntervention.medalId;
    intervention.planificationYear = plainIntervention.planificationYear;
    intervention.programId = plainIntervention.programId || null;
    intervention.requestorId = plainIntervention.requestorId;
    intervention.workTypeId = plainIntervention.workTypeId;
    intervention.externalReferenceIds = plainIntervention.externalReferenceIds;
    this.setDecisionRequired(intervention);
    this.setAssetsLength(intervention, originalInterventionArea);
  }

  public setAssetsLength(intervention: Partial<IEnrichedIntervention>, originalInterventionArea: IGeometry): void {
    const interventionArea = intervention.interventionArea.geometry;
    if (isEqual(originalInterventionArea, interventionArea)) {
      return;
    }
    intervention.assets.forEach((asset, n) => {
      intervention.assets[n].length = workLengthService.getAssetLength(asset, interventionArea);
    });
  }

  public async updateProjectInterventionsStatus(
    project: IEnrichedProject,
    interventions: IEnrichedIntervention[]
  ): Promise<IEnrichedIntervention[]> {
    let clonedInterventions: IEnrichedIntervention[];
    switch (project.status) {
      case ProjectStatus.canceled:
        clonedInterventions = interventions.map(intervention => {
          intervention.status = !isNil(intervention.programId)
            ? InterventionStatus.accepted
            : InterventionStatus.waiting;
          intervention.project = null;
          return intervention;
        });
        break;
      default:
        clonedInterventions = await this.updateInterventionsToIntegrate(interventions, project);
    }
    return clonedInterventions;
  }

  /**
   * Updates integrated interventions
   * adds reference to intervention
   * @param project
   */
  public async updateInterventionsToIntegrate<T extends IPlainIntervention | IEnrichedIntervention>(
    interventions: T[],
    project: IPlainProject | IEnrichedProject
  ): Promise<T[]> {
    const obj: IEnrichedIntervention = {
      project: {
        id: project.id,
        typeId: project.projectTypeId
      },
      status: projectService.getInterventionStatusByProjectType(project)
    } as IEnrichedIntervention;
    return interventions.map(intervention => Object.assign({}, intervention, obj));
  }

  public async updateAnnualDistribution(
    intervention: IEnrichedIntervention,
    annualDistribution: IInterventionAnnualDistribution
  ): Promise<IEnrichedIntervention> {
    this.assertCanInteract(intervention);
    await geolocatedAnnualDistributionService.validateInterventionAnnualDistribution(annualDistribution);

    const updatedIntervention: IEnrichedIntervention = cloneDeep(intervention);
    if (annualDistribution.distributionSummary !== undefined) {
      updatedIntervention.annualDistribution.distributionSummary.note = annualDistribution.distributionSummary.note;
    }

    if (annualDistribution?.annualPeriods) {
      for (const period of annualDistribution?.annualPeriods) {
        if (period.annualAllowance !== undefined) {
          updatedIntervention.annualDistribution.annualPeriods.find(p => p.year === period.year).annualAllowance =
            period.annualAllowance;
        }

        if (period.accountId !== undefined) {
          updatedIntervention.annualDistribution.annualPeriods.find(p => p.year === period.year).accountId =
            period.accountId;
        }
      }
    }

    intervention.audit = auditService.buildAudit(intervention.audit);
    return updatedIntervention;
  }

  public updateProjectWithNewIntervention(project: IEnrichedProject, intervention: IEnrichedIntervention): void {
    const index = project.interventions.map(i => i.id).indexOf(intervention.id);

    if (index !== -1) {
      project.interventions[index] = intervention;
    }
  }
  /**
   * Generates the intervention name.
   * workType / assetType / interventionWorkAreaSuggestedStreetName
   */
  public async generateInterventionName(
    assetWorkTypeId: string,
    assetTypeId: string,
    interventionWorkAreaSuggestedStreetName?: string
  ): Promise<string> {
    const assetType = await taxonomyService.translate(TaxonomyGroup.assetType, assetTypeId);
    const workType = await taxonomyService.translate(TaxonomyGroup.workType, assetWorkTypeId);
    return joinStrings([workType, assetType, interventionWorkAreaSuggestedStreetName], ' / ');
  }

  public assertCanInteract(intervention: IEnrichedIntervention): void {
    const result = InterventionValidator.validateCanInteract(intervention);
    if (result.isFailure) {
      throw createUnprocessableEntityError(`It's impossible to interact with the intervention ${intervention.id}`);
    }
  }

  /**
   * Handles the cancelation of an intervention.
   * Removes the intervention from the project.
   * Cancels the project if it has only this intervention.
   * Tries to regenerates the project work area.
   * @param intervention The canceled intervention
   * @param project The projet to be updated
   */
  public async handleInterventionCancelation(
    intervention: IEnrichedIntervention,
    project: IEnrichedProject,
    projectDecision: IProjectDecision
  ): Promise<void> {
    const originalInterventionIds = cloneDeep(project.interventionIds);
    if (
      project.interventionIds.length === 1 &&
      project.interventionIds[0] === intervention.id &&
      project.status !== ProjectStatus.canceled
    ) {
      await projectService.addDecision(project, projectDecision, null);
      await projectService.cancelProject(project);
    }
    remove(project.interventionIds, id => id === intervention.id);
    remove(project.interventions, i => i.id === intervention.id);

    intervention.project = null;

    if (projectService.isProjectGeolocated(project)) {
      geolocatedAnnualDistributionService.updateInterventionDistribution(
        project,
        originalInterventionIds,
        project.interventions
      );
    }

    // Regenerate project work area.
    if (project.status !== ProjectStatus.canceled) {
      await projectService.tryRegenerateWorkArea(project);
      await projectMedalService.setMedalToProject(project, project.interventions);
    }
  }

  public getGeometryPin(geometry: IGeometry): IPoint3D {
    if (!geometry) {
      return undefined;
    }
    return spatialAnalysisService.middlePoint(geometry as Polygon | MultiPolygon);
  }

  private setDecisionPreviousYear(intervention: IEnrichedIntervention, currentDecision: IInterventionDecision): void {
    if (currentDecision.targetYear) {
      currentDecision.previousPlanificationYear = intervention.planificationYear;
    }
  }

  public buildMoreInformation(intervention: IEnrichedIntervention | IPlainIntervention): IMoreInformation {
    const moreInformation = historyService.buildCommonMoreInformation(intervention);
    if (intervention.medalId) {
      moreInformation.medalId = intervention.medalId;
    }
    if (intervention.externalReferenceIds?.length) {
      const requerantReferenceNumber = intervention.externalReferenceIds
        .filter(reference => reference.type === InterventionExternalReferenceType.requestorReferenceNumber)
        .pop();
      if (requerantReferenceNumber) {
        moreInformation.requerantReferenceNumber = requerantReferenceNumber;
      }
    }
    return moreInformation;
  }

  public setMoreInformationUpdateAudit(
    currentIntervention: IEnrichedIntervention,
    newIntervention: IPlainIntervention
  ): void {
    const currentMoreInformation = this.buildMoreInformation(currentIntervention);
    const newMoreInformation = this.buildMoreInformation(newIntervention);
    if (!isEqual(currentMoreInformation, newMoreInformation)) {
      currentIntervention.moreInformationAudit = auditService.buildAudit(currentIntervention.moreInformationAudit);
    }
  }

  public convertPlainToEnrichedIntervention(intervention: IPlainIntervention): IEnrichedIntervention {
    const estimate = { allowance: intervention.estimate, burnedDown: 0, balance: intervention.estimate };
    return { ...intervention, estimate, audit: intervention.audit };
  }

  public getInterventionIds(interventions: IEnrichedIntervention[]): string[] {
    const interventionIds: string[] = [];
    for (const intervention of interventions) {
      interventionIds.push(intervention.id);
    }
    return interventionIds;
  }

  public addProjectToInterventions(project: IEnrichedProject, interventions: IEnrichedIntervention[]): void {
    for (const intervention of interventions) {
      intervention.project = { id: project.id, typeId: project.projectTypeId || null };
    }
  }

  public async updateProjectOnInterventionUpdate(
    project: IEnrichedProject,
    intervention: IEnrichedIntervention,
    updatedIntervention: IEnrichedIntervention
  ): Promise<Result<IEnrichedProject>> {
    if (!isEqual(intervention.interventionArea, updatedIntervention.interventionArea)) {
      project.length = projectService.getProjectLength(project.interventions);
    }
    if (!isEqual(intervention.estimate.allowance, updatedIntervention.estimate.allowance)) {
      project.globalBudget = projectService.getProjectGlobalBudget(project.globalBudget, project.interventions);
    }
    await projectMedalService.setMedalToProject(project, project.interventions);
    return projectRepository.save(project);
  }

  public getStatusFromDecisionType(decisionType: InterventionDecisionType): InterventionStatus {
    switch (decisionType) {
      case InterventionDecisionType.accepted:
        return InterventionStatus.accepted;
      case InterventionDecisionType.refused:
        return InterventionStatus.refused;
      case InterventionDecisionType.revisionRequest:
        return InterventionStatus.waiting;
      case InterventionDecisionType.returned:
        return InterventionStatus.waiting;
      case InterventionDecisionType.canceled:
        return InterventionStatus.canceled;
      // TODO: Uncomment when working on the decision type acceptedForIntegratedProject
      // case InterventionDecisionType.acceptedForIntegratedProject:
      //   return InterventionStatus.integrated
      default:
        return null;
    }
  }
  public getPermissionForDecision(typeId: string): Permission {
    switch (typeId) {
      case InterventionDecisionType.accepted:
      case InterventionDecisionType.refused:
        return Permission.INTERVENTION_DECISION_ACCEPTED_REFUSED_CREATE;
      case InterventionDecisionType.canceled:
        return Permission.INTERVENTION_DECISION_CANCELED_CREATE;
      case InterventionDecisionType.revisionRequest:
        return Permission.INTERVENTION_DECISION_REVISION_REQUEST_CREATE;
      case InterventionDecisionType.returned:
        return Permission.INTERVENTION_DECISION_RETURNED_CREATE;
      default:
        return null;
    }
  }
}

export const interventionService: IInterventionService = new InterventionService();

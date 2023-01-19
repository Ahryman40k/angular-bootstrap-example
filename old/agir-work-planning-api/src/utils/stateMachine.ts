import {
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionDecisionType,
  InterventionStatus,
  IPlainIntervention,
  ProjectType
} from '@villemontreal/agir-work-planning-lib';

import { IValidateInterventionOptions } from '../models/validateOptions';
import { convertStringOrStringArray } from './arrayUtils';
import { createInvalidInputError } from './errorUtils';
import { IApiError } from './utils';

export interface ITransition {
  to: string;
  from: string | string[];
  validate: (
    intervention: IPlainIntervention | IEnrichedIntervention,
    options: IValidateInterventionOptions
  ) => IApiError[];
}

enum ErrorCode {
  status = 'Status'
}

class StateMachine {
  private readonly transitions: ITransition[] = [
    { from: [null], to: InterventionStatus.wished, validate: () => [] },
    { from: InterventionStatus.waiting, to: InterventionStatus.wished, validate: this.validateToWished },
    {
      from: [null, InterventionStatus.wished, InterventionStatus.refused],
      to: InterventionStatus.waiting,
      validate: this.validateToWaiting
    },
    {
      from: [InterventionStatus.waiting, InterventionStatus.accepted],
      to: InterventionStatus.refused,
      validate: this.validateToRefused
    },
    { from: InterventionStatus.waiting, to: InterventionStatus.accepted, validate: this.validateToAccepted },
    { from: InterventionStatus.waiting, to: InterventionStatus.integrated, validate: this.validateToIntegrated },
    { from: InterventionStatus.accepted, to: InterventionStatus.integrated, validate: this.validateToIntegrated },
    {
      from: [
        InterventionStatus.wished,
        InterventionStatus.waiting,
        InterventionStatus.refused,
        InterventionStatus.accepted,
        InterventionStatus.integrated
      ],
      to: InterventionStatus.canceled,
      validate: () => []
    }
  ];

  /**
   * Changes state of intervention depending on whats specified
   * @param intervention
   */
  public changeState(
    intervention: IEnrichedIntervention,
    targetStatus: InterventionStatus,
    options?: IValidateInterventionOptions
  ): void {
    if (options && !options.hasOwnProperty('targetYear')) {
      options.targetYear = intervention.planificationYear;
    }
    if (!this.isTransitionPossible(intervention, targetStatus)) {
      throw createInvalidInputError(
        `The status transition is not valid. Status from: ${intervention.status}, Status to: ${targetStatus}`
      );
    }
    let errorDetails: IApiError[];
    const transition = this.getTransition(intervention, targetStatus);
    if (transition) {
      errorDetails = transition.validate(intervention, options);
      if (errorDetails.length > 0) {
        throw createInvalidInputError('The data input is incorrect to change state!!', errorDetails);
      }
      intervention.status = transition.to;
    }
  }

  public updateInterventionYear(stateTo: string, targetYear: number, intervention: IEnrichedIntervention): void {
    switch (stateTo) {
      case InterventionStatus.refused:
      case InterventionStatus.canceled:
        break;
      default:
        intervention.interventionYear = targetYear;
    }
  }

  public updatePlanificationYear(stateTo: string, targetYear: number, intervention: IEnrichedIntervention): void {
    switch (stateTo) {
      case InterventionStatus.refused:
      case InterventionStatus.canceled:
        break;
      default:
        intervention.planificationYear = targetYear;
    }
  }

  /**
   * Lets you know if the transition you seek exists and is possible
   * for current status and specifed status you want
   * @param intervention
   */
  public isTransitionPossible(intervention: IEnrichedIntervention, targetStatus: InterventionStatus): boolean {
    if (intervention.status === targetStatus) {
      return true;
    }
    return this.getTransition(intervention, targetStatus) ? true : false;
  }

  /**
   * Validates if the intervention contains a decision with the status refused
   * @param intervention
   */
  public validateToRefused(intervention: IEnrichedIntervention): IApiError[] {
    if (
      !intervention.decisions?.length ||
      !intervention.decisions.find(d => d.typeId === InterventionDecisionType.refused)
    ) {
      return [
        {
          code: ErrorCode.status,
          message: `Intervention must contain a refused decision to be refused`,
          target: 'status'
        }
      ];
    }
    return [];
  }

  /**
   * Validates if the intervention contains a decision with the status revisionRequest
   * @param intervention
   */
  public validateToWaiting(intervention: IEnrichedIntervention): IApiError[] {
    if (
      intervention.status === InterventionStatus.refused &&
      (!intervention.decisions?.length ||
        !intervention.decisions.find(d => d.typeId === InterventionDecisionType.revisionRequest))
    ) {
      return [
        {
          code: ErrorCode.status,
          message: `Intervention must contain a revision request decision to be waiting`,
          target: 'status'
        }
      ];
    }
    return [];
  }

  /**
   * Validates if the intervention contains a decision with the status accepted or acceptedRequirement
   * @param intervention
   */
  public validateToAccepted(intervention: IEnrichedIntervention): IApiError[] {
    if (
      !intervention.decisions?.length ||
      !intervention.decisions.find(d => d.typeId === InterventionDecisionType.accepted)
    ) {
      return [
        {
          code: ErrorCode.status,
          message: `Intervention must contain a accepted or accepted requirement decision to be accepted`,
          target: 'status'
        }
      ];
    }
    return [];
  }
  /**
   * Validates if the intervention contains a decision with the status returned
   * @param intervention
   */
  public validateToWished(intervention: IEnrichedIntervention): IApiError[] {
    if (
      !intervention.decisions?.length ||
      !intervention.decisions.find(d => d.typeId === InterventionDecisionType.returned)
    ) {
      return [
        {
          code: ErrorCode.status,
          message: `Intervention must contain a returned decision to be returned`,
          target: 'status'
        }
      ];
    }
    return [];
  }

  /**
   * Validates if the intervention is contained in an integrated project
   * @param intervention
   */
  public validateToIntegrated(intervention: IEnrichedIntervention, options: IValidateInterventionOptions): IApiError[] {
    const isValid = this.isToIntegratedValid(intervention, options.project);
    if (!isValid) {
      return [
        {
          code: ErrorCode.status,
          message: `Intervention must contain a accepted or accepted requirement decision to be accepted`,
          target: 'status'
        }
      ];
    }
    return [];
  }

  private isToIntegratedValid(intervention: IEnrichedIntervention, project: IEnrichedProject): boolean {
    if (!intervention.project || !project) {
      return false;
    }
    return project.projectTypeId === ProjectType.integrated || project.projectTypeId === ProjectType.integratedgp;
  }

  /**
   * Checkout if transition exists and return it
   * @param intervention
   * @param [state]
   * @returns transition
   */
  private getTransition(intervention: IEnrichedIntervention, targetStatus: InterventionStatus): ITransition {
    return this.transitions.find(
      t =>
        convertStringOrStringArray(t.from).includes(intervention.status) &&
        convertStringOrStringArray(t.to).includes(targetStatus)
    );
  }
}

export const stateMachine: StateMachine = new StateMachine();

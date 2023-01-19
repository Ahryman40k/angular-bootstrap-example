import { Injectable } from '@angular/core';
import {
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  IPlainOpportunityNotice
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty, isNil, pullAll } from 'lodash';

import { NotificationsService } from '../notifications/notifications.service';
import { BroadcastEventException } from '../window/window-broadcast.service';
import { InterventionService } from './intervention.service';
import { OpportunityNoticeService } from './opportunity-notice.service';
import { ProjectService } from './project.service';
import { SpatialAnalysisService } from './spatial-analysis.service';

export interface IAssetForIntervention {
  assetList: IAsset[];
  workTypeId: string;
  toPersist?: boolean;
  intervention?: IEnrichedIntervention;
}
export interface IPlainOpportunityNoticeResponseProps extends IPlainOpportunityNotice {
  project: IEnrichedProject;
  assetsForInterventions?: IAssetForIntervention[];
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityNoticeResponseService {
  public opportunityNoticeId: string;
  public requestorId: string;

  constructor(
    private readonly projectService: ProjectService,
    private readonly interventionService: InterventionService,
    private readonly notificationsService: NotificationsService,
    private readonly opportunityNoticeService: OpportunityNoticeService,
    private readonly spatialAnalysisService: SpatialAnalysisService
  ) {}

  public putPlainOpportunityNoticeInSessionStorage(
    plainOpportunityNoticeProps: IPlainOpportunityNoticeResponseProps,
    opportunityNoticeId: string
  ): void {
    sessionStorage.setItem(opportunityNoticeId, JSON.stringify(plainOpportunityNoticeProps));
  }

  public getPlainOpportunityNoticeInSessionStorage(opportunityNoticeId: string): IPlainOpportunityNoticeResponseProps {
    return JSON.parse(sessionStorage.getItem(opportunityNoticeId));
  }

  public deletePlainOpportunityNoticeInSessionStorage(opportunityNoticeId: string): void {
    sessionStorage.removeItem(opportunityNoticeId);
  }

  /**
   * Integrate intervention to project then updating the opportunityNotice
   * If something failed the intervention is delete and the project is revert
   * @param intervention
   * @param opportunityNoticeId
   * @returns
   */
  public async doNonGeoSubmission(intervention: IEnrichedIntervention, opportunityNoticeId: string): Promise<void> {
    const plainOpportunityNoticeProps = this.getPlainOpportunityNoticeInSessionStorage(opportunityNoticeId);

    // Create new project geometry
    const interventionForGeometries = plainOpportunityNoticeProps.project.interventions;
    interventionForGeometries.push(intervention);
    plainOpportunityNoticeProps.project.geometry = await this.projectService.findProjectAreaByInterventions(
      interventionForGeometries
    );

    // Integrate intervention to project
    if (!(await this.integrateInterventionToProject([intervention], plainOpportunityNoticeProps))) {
      return;
    }

    // Update opportunity notice
    await this.updateOpportunityNotice(opportunityNoticeId, plainOpportunityNoticeProps, [intervention]);
  }

  public async doPreGeoSubmission(opportunityNoticeId: string): Promise<boolean> {
    const plainOpportunityNoticeProps = this.getPlainOpportunityNoticeInSessionStorage(opportunityNoticeId);

    // Create new project geometry
    const interventions = plainOpportunityNoticeProps.assetsForInterventions
      .filter(afi => afi.toPersist && !isNil(afi.intervention))
      .map(afi => afi.intervention);

    let interventionForGeometries = plainOpportunityNoticeProps.project.interventions;
    interventionForGeometries = interventionForGeometries.concat(interventions);
    plainOpportunityNoticeProps.project.geometry = await this.projectService.findProjectAreaByInterventions(
      interventionForGeometries
    );

    // Integrate intervention to project
    if (!(await this.integrateInterventionToProject(interventions, plainOpportunityNoticeProps))) {
      return false;
    }

    this.putPlainOpportunityNoticeInSessionStorage(plainOpportunityNoticeProps, opportunityNoticeId);

    return true;
  }

  public async doGeoSubmission(opportunityNoticeId: string): Promise<boolean> {
    const plainOpportunityNoticeProps = this.getPlainOpportunityNoticeInSessionStorage(opportunityNoticeId);
    const interventions = plainOpportunityNoticeProps.assetsForInterventions.map(afi => afi.intervention);
    return this.updateOpportunityNotice(opportunityNoticeId, plainOpportunityNoticeProps, interventions);
  }

  // Remove interventions from project and delete interventions
  public async handleCancel(opportunityNoticeId: string): Promise<boolean> {
    const plainOpportunityNoticeProps = this.getPlainOpportunityNoticeInSessionStorage(opportunityNoticeId);
    if (!this.hasToHandleCancel(plainOpportunityNoticeProps)) {
      return true;
    }
    const project = cloneDeep(plainOpportunityNoticeProps.project);
    const interventionIds = plainOpportunityNoticeProps.assetsForInterventions
      .filter(afi => afi.intervention)
      .map(afi => afi.intervention.id);
    pullAll(project.interventionIds, interventionIds);

    try {
      await this.projectService.patchProject(plainOpportunityNoticeProps.project, {
        interventionIds: project.interventionIds
      });
    } catch (e) {
      this.notificationsService.showError(`Une erreur est survenue lors du retrait des interventions au projet`);
      return false;
    }

    const interventions = plainOpportunityNoticeProps.assetsForInterventions
      .filter(afi => afi.intervention)
      .map(afi => afi.intervention);
    if (!this.deleteInterventions(interventions)) {
      return false;
    }

    return true;
  }

  private hasToHandleCancel(plainOpportunityNoticeProps: IPlainOpportunityNoticeResponseProps): boolean {
    const interventions = plainOpportunityNoticeProps?.assetsForInterventions?.map(afi => afi.intervention) || [];
    if (isEmpty(interventions)) {
      return false;
    }
    return true;
  }

  private async integrateInterventionToProject(
    interventions: IEnrichedIntervention[],
    plainOpportunityNoticeProps: IPlainOpportunityNoticeResponseProps
  ): Promise<boolean> {
    let interventionIds = cloneDeep(plainOpportunityNoticeProps.project.interventionIds);
    const interventionIdsToAppend = interventions.map(intervention => {
      if (!interventionIds.includes(intervention.id)) {
        return intervention.id;
      }
    });
    interventionIds = interventionIds.concat(interventionIdsToAppend);

    try {
      await this.projectService.patchProject(
        plainOpportunityNoticeProps.project,
        { interventionIds },
        BroadcastEventException.opportunityNoticeResponseInterventionCreation
      );
      plainOpportunityNoticeProps.project.interventionIds = interventionIds;
    } catch (e) {
      this.notificationsService.showError(`Une erreur est survenue lors de la sauvegarde du projet`);
      await this.deleteInterventions(interventions);
      return false;
    }
    return true;
  }

  private async updateOpportunityNotice(
    opportunityNoticeId: string,
    plainOpportunityNoticeProps: IPlainOpportunityNoticeResponseProps,
    interventions: IEnrichedIntervention[]
  ): Promise<boolean> {
    const plainOpportunityNotice = cloneDeep(plainOpportunityNoticeProps);
    delete plainOpportunityNotice.project;
    delete plainOpportunityNotice.assetsForInterventions;

    try {
      await this.opportunityNoticeService.updateOpportunityNotice(opportunityNoticeId, plainOpportunityNotice);
    } catch (e) {
      this.notificationsService.showError(
        `Une erreur est survenue lors de la sauvegarde de la réponse de l'avis d'opportunité`
      );
      try {
        const interventionIds = interventions.map(intervention => intervention.id);
        const patchInterventionIds = plainOpportunityNoticeProps.project.interventionIds.filter(
          interventionId => !interventionIds.includes(interventionId)
        );
        await this.projectService.patchProject(plainOpportunityNoticeProps.project, {
          interventionIds: patchInterventionIds
        });
      } catch (err) {
        this.notificationsService.showError(`Une erreur est survenue lors du retrait de l'intervention au projet`);
      }
      await this.deleteInterventions(interventions);
      return false;
    }
    return true;
  }

  /**
   * Delete interventions when an error occur while creating and integrating interventions
   * It returns a boolean to manage rightfully the issue when delete fail when its required to manage it
   * @param interventions
   * @returns boolean
   */
  private async deleteInterventions(interventions: IEnrichedIntervention[]): Promise<boolean> {
    const isInterventionsDeleted: boolean[] = [];
    for (const intervention of interventions) {
      isInterventionsDeleted.push(await this.deleteIntervention(intervention.id));
    }
    return isInterventionsDeleted.some(isInterventionDeleted => !isInterventionDeleted);
  }

  private async deleteIntervention(interventionId: string): Promise<boolean> {
    try {
      await this.interventionService.deleteIntervention(interventionId);
      this.notificationsService.showWarning(`L'intervention ${interventionId} a été effacée`);
    } catch (e) {
      this.notificationsService.showError(
        `Une erreur est survenue lors de la suppression de l'intervention ${interventionId}`
      );
      return false;
    }
    return true;
  }
}

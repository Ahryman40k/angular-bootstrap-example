import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IEnrichedIntervention, InterventionStatus, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { DialogsService } from '../dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../forms/confirmation-modal/confirmation-modal.component';
import { IMenuItemConfig } from '../models/menu/menu-item-config';
import { MenuItemKey } from '../models/menu/menu-item-key';
import { IMoreOptionsMenuItem } from '../models/more-options-menu/more-options-menu-item';
import { NotificationsService } from '../notifications/notifications.service';
import { InterventionService } from './intervention.service';
import { MapDataService } from './map-data.service';
import { MapOutlet } from './map-navigation.service';
import { MapService } from './map.service';

@Injectable({
  providedIn: 'root'
})
export class InterventionMenuService {
  constructor(
    private readonly interventionsService: InterventionService,
    private readonly dialogsService: DialogsService,
    private readonly mapService: MapService,
    private readonly mapDataService: MapDataService,

    private readonly notificationsService: NotificationsService,
    private readonly router: Router
  ) {}

  public getMenuItems(intervention: IEnrichedIntervention, config?: IMenuItemConfig): IMoreOptionsMenuItem[] {
    // IMPORTANT: Menu items must have a link OR an action. Not both.
    const menuItems: IMoreOptionsMenuItem[] = [];
    if (this.interventionsService.canInteract(intervention)) {
      menuItems.push({
        label: "Modifier l'intervention",
        link: `window/interventions/edit/${intervention.id}`,
        linkNewWindow: config?.newWindow,
        permission: Permission.INTERVENTION_WRITE,
        restrictionItems: [{ entity: intervention, entityType: 'INTERVENTION' }]
      });
      if (
        !intervention.project &&
        intervention.status !== InterventionStatus.wished &&
        !intervention.decisionRequired
      ) {
        menuItems.push({
          label: 'Créer un projet',
          link: `window/projects/create/${intervention.id}`,
          linkNewWindow: config?.newWindow,
          permission: Permission.PROJECT_WRITE,
          restrictionItems: [{ entity: intervention, entityType: 'INTERVENTION' }]
        });
      }
    }
    if (!config?.hiddenMenuItems?.includes(MenuItemKey.ROAD_SECTION_ACTIVITY)) {
      menuItems.push({
        label: `Consulter l'activité des tronçons de l'intervention`,
        action: () => {
          const args = ['selection', 'interventions', intervention.id];
          void this.mapService.mapComponent.mapNavigationService.navigateTo(MapOutlet.rightPanel, args);
          this.mapService.toggleBottomPanel(true, intervention.interventionArea.geometry);
        },
        permission: Permission.ROAD_SECTION_ACTIVITY_READ
      });
    }
    if (intervention.status === InterventionStatus.wished) {
      menuItems.push({
        label: `Supprimer l'intervention`,
        action: async () => {
          const routeSplit: string[] = this.router.url.split('/');
          const deleteMessage =
            "La suppression de l'intervention entrainera la perte des données.\nÊtes-vous certain de vouloir continuer?";
          const modal = this.dialogsService.showDeleteModal("Supprimer l'intervention", deleteMessage);
          const result = await modal.result;
          if (result === ConfirmationModalCloseType.confirmed) {
            this.interventionsService.deleteIntervention(intervention.id).subscribe(
              () => {
                if (
                  (!routeSplit.includes('interventions') && !routeSplit.includes('overview')) ||
                  routeSplit.includes('map')
                ) {
                  this.mapDataService.deleteInterventions(intervention.id);
                }

                if (this.router.url !== '/map/m') {
                  void this.router.navigate(['/']);
                }

                this.notificationsService.showSuccess(`L'intervention ${intervention.id} a été effacée`);
              },
              () => {
                this.notificationsService.showError(
                  `Une erreur est survenue lors de la suppression de l'intervention ${intervention.id}`
                );
              }
            );
          }
        },
        permission: Permission.INTERVENTION_DELETE,
        restrictionItems: [{ entity: intervention, entityType: 'INTERVENTION' }]
      });
    }
    return menuItems;
  }
}

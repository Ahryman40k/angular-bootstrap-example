import { Injectable } from '@angular/core';
import { IApiError } from '@villemontreal/agir-work-planning-lib/dist/src';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable({
  providedIn: 'root'
})
export class DrmProjectErrorService {
  constructor(private readonly notificationsService: NotificationsService) {}

  public handleDrmNumberError(e: IApiError, projectIds?: string[]): void {
    switch (e.code) {
      case '400':
        this.notificationsService.showError(`La propriété, ${e.target}, de la requête est invalide`);
        break;
      case '404':
        this.notificationsService.showError(`Au moins un des projets suivant ${projectIds?.join(',')} est inexistant`);
        break;
      case '422':
        this.notificationsService.showError(`Un projet détient déjà un numéro de DRM ou un numéro de soumission`);
        break;
      default:
        this.notificationsService.showError(`Une erreur s'est produite lors de la génération du numéro de DRM`);
    }
  }
}

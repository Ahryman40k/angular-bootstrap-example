import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DocumentService } from 'src/app/shared/services/document.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { DocumentsComponent } from '../documents.component';

@Component({
  selector: 'app-documents-intervention',
  templateUrl: '../documents.component.html',
  styleUrls: ['../documents.component.scss']
})
export class DocumentsInterventionComponent extends DocumentsComponent {
  protected objectType = ObjectType.intervention;

  constructor(
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    protected readonly dialogsService: DialogsService,
    protected readonly notificationsService: NotificationsService,
    protected readonly documentService: DocumentService
  ) {
    super(windowService, activatedRoute, dialogsService, notificationsService, documentService);
  }

  public get restrictionItems(): IRestrictionItem[] {
    return this.interventionRestrictionItems;
  }
}

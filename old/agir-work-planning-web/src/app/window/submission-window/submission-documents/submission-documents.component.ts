import { Component, OnInit } from '@angular/core';
import { IEnrichedDocument, ISubmission, SubmissionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { DocumentModalComponent } from 'src/app/shared/forms/documents/document-modal/document-modal.component';
import { IEnrichedDocumentListItem } from 'src/app/shared/models/documents/enriched-document-list-item';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DocumentService } from 'src/app/shared/services/document.service';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { IDownloadingDocument } from '../../documents/documents.component';

@Component({
  selector: 'app-submission-documents',
  templateUrl: './submission-documents.component.html',
  styleUrls: ['./submission-documents.component.scss']
})
export class SubmissionDocumentsComponent extends BaseComponent implements OnInit {
  public noResultMessage: string = "Il n'y a pas de documents dans cette soumission pour l'instant.";
  public SubmissionStatus = SubmissionStatus;

  public downloadingDocuments: IDownloadingDocument[] = [];

  public get submission(): ISubmission {
    return this.windowSubmissionStoreService.submission;
  }

  public get documents(): IEnrichedDocumentListItem[] {
    return this.windowSubmissionStoreService.submission.documents;
  }

  constructor(
    private readonly windowSubmissionStoreService: WindowSubmissionStoreService,
    protected readonly dialogsService: DialogsService,
    protected readonly notificationsService: NotificationsService,
    protected readonly documentService: DocumentService
  ) {
    super();
  }

  public async openCreateModal(): Promise<void> {
    const modal = this.dialogsService.showModal(DocumentModalComponent);
    modal.componentInstance.modalTitle = 'Ajouter un document';
    modal.componentInstance.confirmLabel = 'Ajouter';
    modal.componentInstance.objectId = this.submission.submissionNumber;
    modal.componentInstance.objectType = ObjectType.submissionNumber;

    const result = await modal.result;

    if (result) {
      this.notificationsService.showSuccess('Document créé avec succès');
      this.windowSubmissionStoreService.refresh();
    }
  }

  public async editDocumentModal(document: IEnrichedDocumentListItem): Promise<void> {
    const modal = this.dialogsService.showModal(DocumentModalComponent);
    modal.componentInstance.modalTitle = 'Modifier un document';
    modal.componentInstance.confirmLabel = 'Modifier';
    modal.componentInstance.objectType = ObjectType.submissionNumber;

    modal.componentInstance.objectId = this.submission.submissionNumber;
    modal.componentInstance.document = document;

    const result = await modal.result;

    if (result) {
      this.notificationsService.showSuccess('Document modifié avec succès');
      this.windowSubmissionStoreService.refresh();
    }
  }

  public async deleteDocumentModal(document: IEnrichedDocument): Promise<void> {
    const message =
      'La suppression de ce document entrainera la perte des données.\nÊtes-vous certain de vouloir continuer?';
    const modal = this.dialogsService.showDeleteModal('Supprimer un document', message);
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      await this.deleteDocument(document);
    }
  }
  public async deleteDocument(document: IEnrichedDocument) {
    await this.documentService.deleteSubmissionDocument(this.submission.submissionNumber, document.id);
    this.notificationsService.show('Document supprimé', NotificationAlertType.success);
    this.windowSubmissionStoreService.refresh();
  }

  public async downloadDocumentFile(document: IEnrichedDocument): Promise<void> {
    const progressCallback = event => {
      if (!this.downloadingDocuments.find(d => d.document.id === document.id) || event.loaded < event.total) {
        const progress = Math.round((event.loaded / event.total) * 100);
        this.downloadingDocuments.push({ document, progress });
      }
      if (event.loaded === event.total) {
        this.downloadingDocuments.find(d => d.document.id === document.id).progress = 100;
      }
    };
    await this.documentService.downloadSubmissionDocument(
      this.submission?.submissionNumber,
      document,
      progressCallback
    );
  }

  public get restrictionItems(): IRestrictionItem[] {
    return [{ entity: this.windowSubmissionStoreService.projects, entityType: 'PROJECT' }];
  }
}

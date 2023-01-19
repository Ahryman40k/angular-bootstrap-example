import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IEnrichedDocument, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { data } from 'jquery';
import { orderBy, remove } from 'lodash';
import { combineLatest, of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { map, mergeMap, shareReplay, startWith } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { DocumentModalComponent } from 'src/app/shared/forms/documents/document-modal/document-modal.component';
import { ISortValue } from 'src/app/shared/forms/sort/sort.component';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { IEnrichedDocumentListItem } from '../../shared/models/documents/enriched-document-list-item';
import { IDocumentFilter } from '../../shared/models/filters/document-filter';
import { DocumentFilterKey } from '../../shared/models/filters/document-filter-key';
import { DocumentService } from '../../shared/services/document.service';
import { BaseDetailsComponent } from '../base-details-component';

export interface IDownloadingDocument {
  document: IEnrichedDocument;
  progress: number;
}

export abstract class DocumentsComponent extends BaseDetailsComponent implements OnInit {
  protected abstract objectType: ObjectType;
  public documents$: Observable<IEnrichedDocumentListItem[]>;
  public filters: IDocumentFilter[];

  public get noResultMessage(): string {
    return this.intervention
      ? "Il n'y a pas de documents dans cette intervention pour l'instant."
      : "Il n'y a pas de documents dans ce projet pour l'instant.";
  }

  public downloadingDocuments: IDownloadingDocument[] = [];

  // override this methode for each entity project, intervention, submission ...
  public get restrictionItems(): IRestrictionItem[] {
    return [];
  }

  public readonly sortFormControl: FormControl;
  private readonly sortDefaultValue: ISortValue = { key: DocumentFilterKey.createdAt, direction: 'desc' };
  public get hasPermissionToWrite(): string {
    return this.intervention ? Permission.INTERVENTION_DOCUMENT_WRITE : Permission.PROJECT_DOCUMENT_WRITE;
  }
  constructor(
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    protected readonly dialogsService: DialogsService,
    protected readonly notificationsService: NotificationsService,
    protected readonly documentService: DocumentService
  ) {
    super(windowService, activatedRoute);
    this.sortFormControl = new FormControl(this.sortDefaultValue);
  }

  public ngOnInit(): void {
    this.filters = this.getFilters();
    this.documents$ = this.createDocumentsObservable();
  }

  public async openCreateModal(): Promise<void> {
    const modal = this.dialogsService.showModal(DocumentModalComponent);
    modal.componentInstance.modalTitle = 'Ajouter un document';
    modal.componentInstance.confirmLabel = 'Ajouter';
    modal.componentInstance.objectType = this.objectType;

    if (this.objectType === ObjectType.intervention) {
      modal.componentInstance.objectId = this.intervention.id;
    } else {
      modal.componentInstance.objectId = this.project.id;
    }

    const result = await modal.result;

    if (result) {
      this.notificationsService.showSuccess('Document créé avec succès');
      void this.windowService.refresh();
    }
  }

  public async showDeleteModal(document: IEnrichedDocument): Promise<void> {
    const message =
      'La suppression de ce document entrainera la perte des données.\nÊtes-vous certain de vouloir continuer?';
    const modal = this.dialogsService.showDeleteModal('Supprimer un document', message);
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      await this.deleteDocument(document);
    }
  }

  public async showEditModal(document: IEnrichedDocumentListItem): Promise<void> {
    const modal = this.dialogsService.showModal(DocumentModalComponent);
    modal.componentInstance.modalTitle = 'Modifier un document';
    modal.componentInstance.confirmLabel = 'Modifier';
    modal.componentInstance.objectType = this.objectType;

    if (this.objectType === ObjectType.intervention) {
      modal.componentInstance.objectId = this.intervention.id;
    } else {
      modal.componentInstance.objectId = this.project.id;
    }
    modal.componentInstance.document = document;

    const result = await modal.result;

    if (result) {
      this.refresh();
      remove(this.downloadingDocuments, d => d.document.id === document.id);
      this.notificationsService.showSuccess('Document modifié avec succès');
    }
  }

  private async deleteDocument(document: IEnrichedDocumentListItem): Promise<void> {
    switch (this.objectType) {
      case ObjectType.intervention:
        const interventionId = this.intervention ? this.intervention.id : document.interventionId;
        await this.documentService.deleteInterventionDocument(interventionId, document.id);
        break;
      case ObjectType.project:
        await this.documentService.deleteProjectDocument(this.windowService.currentProject.id, document.id);
        break;
      default:
        throw new Error(`invalid documentable object type ${this.objectType}`);
    }
    this.refresh();
    this.notificationsService.show('Document supprimé', NotificationAlertType.success);
  }

  private refresh(): void {
    void this.windowService.refresh();
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
    switch (this.objectType) {
      case ObjectType.intervention:
        await this.documentService.downloadInterventionDocument(this.intervention?.id, document, progressCallback);
        break;
      case ObjectType.project:
        await this.documentService.downloadProjectDocument(
          this.windowService.currentProject.id,
          document,
          progressCallback
        );
        break;
      default:
        throw new Error(`invalid documentable object type ${this.objectType}`);
    }
  }

  public isDocumentDownloading(document: IEnrichedDocument): boolean {
    return this.downloadingDocuments.some(d => d.document.id === document.id);
  }

  public getDocumentDownloadProgress(document: IEnrichedDocument): number {
    return this.downloadingDocuments.find(d => d.document.id === document.id).progress;
  }

  private createDocumentsObservable(): Observable<IEnrichedDocumentListItem[]> {
    const data$ = this.windowService.createObjectsObservable(this.destroy$).pipe(
      mergeMap(x => {
        const [project, intervention] = x;
        if (intervention) {
          return of(intervention.documents);
        }
        if (project) {
          return of(this.documentService.getProjectDocuments(project));
        }
        return of([] as IEnrichedDocument[]);
      }),
      shareReplay()
    );
    return combineLatest(data$, this.sortFormControl.valueChanges.pipe(startWith(this.sortDefaultValue))).pipe(
      map(([documents, sortValue]) => orderBy(documents, sortValue.key, sortValue.direction))
    );
  }

  private getFilters(): IDocumentFilter[] {
    return [
      { key: DocumentFilterKey.createdAt, label: 'Date de création' },
      { key: DocumentFilterKey.interventionId, label: 'Identifiant' },
      { key: DocumentFilterKey.editor, label: 'Éditeur' },
      { key: DocumentFilterKey.validation, label: 'Validation' }
    ];
  }
}

import { Component, OnInit } from '@angular/core';
import { ITaxonomy, ITaxonomyList, Permission, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { includes } from 'lodash';
import { Subject } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';

import { AlertType } from '../../shared/alerts/alert/alert.component';
import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogsService } from '../../shared/dialogs/dialogs.service';
import { AlertModalComponent } from '../../shared/forms/alert-modal/alert-modal.component';
import { ConfirmationModalCloseType } from '../../shared/forms/confirmation-modal/confirmation-modal.component';
import { IMoreOptionsMenuItem } from '../../shared/models/more-options-menu/more-options-menu-item';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TaxonomiesService } from '../../shared/services/taxonomies.service';
import { NexoBookCreationModalComponent } from '../nexo-book-creation-modal/nexo-book-creation-modal.component';
import { NexoBookUpdateModalComponent } from '../nexo-book-update-modal/nexo-book-update-modal.component';

@Component({
  selector: 'app-nexo-book-correspondance',
  templateUrl: './nexo-book-correspondance.component.html',
  styleUrls: ['./nexo-book-correspondance.component.scss']
})
export class NexoBookCorrespondanceComponent extends BaseComponent implements OnInit {
  public isLoading = false;
  public nexoBooks: ITaxonomyList;
  public collapsedCodes: string[] = [];

  private readonly taxonomiesChanged$ = new Subject();

  constructor(
    private readonly taxonomyService: TaxonomiesService,
    private readonly dialogsService: DialogsService,
    private readonly notificationService: NotificationsService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initTaxonomy();
  }

  public getMenuItems(nexoBook: ITaxonomy): IMoreOptionsMenuItem[] {
    return [
      this.createUpdateTaxonomyCorrespondanceMenuItem(nexoBook),
      this.createDeleteTaxonomyCorrespondanceMenuItem(nexoBook)
    ];
  }

  public async createCorrespondance(): Promise<void> {
    const modal = this.dialogsService.showModal(NexoBookCreationModalComponent);
    const result = await modal.result;
    if (result) {
      this.notificationService.showSuccess('Correspondance ajoutée');
      this.taxonomiesChanged$.next();
    }
  }

  public toggleCodeCollapse(code: string): void {
    if (this.isCodeCollapsed(code)) {
      this.collapsedCodes = this.collapsedCodes.filter(x => x !== code);
    } else {
      this.collapsedCodes.push(code);
    }
  }

  public isCodeCollapsed(code: string): boolean {
    return includes(this.collapsedCodes, code);
  }

  private initTaxonomy(): void {
    this.taxonomiesChanged$
      .pipe(
        takeUntil(this.destroy$),
        startWith(null),
        switchMap(() => this.taxonomyService.group(TaxonomyGroup.nexoBook))
      )
      .subscribe(n => {
        this.nexoBooks = n;
      });
  }

  private createUpdateTaxonomyCorrespondanceMenuItem(nexoBook: ITaxonomy): IMoreOptionsMenuItem {
    return {
      label: "Modifier l'élément",
      action: async () => {
        const modal = this.dialogsService.showModal(NexoBookUpdateModalComponent);
        modal.componentInstance.nexoBook = nexoBook;
        const result = await modal.result;
        if (result) {
          this.notificationService.showSuccess('Correspondance modifiée');
          this.taxonomiesChanged$.next();
        }
      }
    };
  }

  private createDeleteTaxonomyCorrespondanceMenuItem(nexoBook: ITaxonomy): IMoreOptionsMenuItem {
    return {
      label: "Supprimer l'élément",
      action: async () => {
        const result = await this.showDeleteConfirmationModal();
        if (result === ConfirmationModalCloseType.confirmed) {
          await this.taxonomyService.delete(nexoBook);
          this.notificationService.showSuccess('Correspondance supprimée');
          this.taxonomiesChanged$.next();
        }
      },
      permission: Permission.TAXONOMY_WRITE
    };
  }

  private async showDeleteConfirmationModal(): Promise<any> {
    const modal = this.dialogsService.showModal(AlertModalComponent);
    modal.componentInstance.modalTitle = "Supprimer l'élément";
    modal.componentInstance.type = AlertType.warning;
    modal.componentInstance.buttonLabel = 'Annuler';
    modal.componentInstance.confirmLabel = 'Supprimer';
    modal.componentInstance.confirmButtonClass = 'btn-danger';
    modal.componentInstance.alertMessage =
      'La suppression de cette correspondance impactera l’importation NEXO. Êtes-vous certain de vouloir continuer? ';
    return modal.result;
  }
}

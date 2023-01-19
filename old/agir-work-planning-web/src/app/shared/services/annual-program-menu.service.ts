import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  AnnualProgramStatus,
  IEnrichedAnnualProgram,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { merge, Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { AnnualProgramShareModalComponent } from 'src/app/annual-program/annual-program-share-modal/annual-program-share-modal.component';

import { AnnualProgramModalComponent } from '../../annual-program/annual-program-modal/annual-program-modal.component';
import { DialogsService } from '../dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../forms/confirmation-modal/confirmation-modal.component';
import { PROGRAM_BOOK_FIELDS } from '../models/findOptions/programBookFields';
import { IMoreOptionsMenuItem } from '../models/more-options-menu/more-options-menu-item';
import { NotificationsService } from '../notifications/notifications.service';
import { AnnualProgramService } from './annual-program.service';
import { ProgramBookService } from './program-book.service';

export enum FromPage {
  ANNUAL_PROGRAM_DETAILS = 'AnnualProgramDetails',
  ANNUAL_PROGRAM_LIST = 'AnnualProgramList'
}
@Injectable({
  providedIn: 'root'
})
export class AnnualProgramMenuService {
  constructor(
    private readonly dialogsService: DialogsService,
    private readonly annualProgramService: AnnualProgramService,
    private readonly programBookService: ProgramBookService,
    private readonly notificationsService: NotificationsService
  ) {}

  public getMenuItems(
    annualProgram: IEnrichedAnnualProgram,
    until$: Observable<any>,
    fromPage?: FromPage
  ): Observable<IMoreOptionsMenuItem[]> {
    return merge(this.annualProgramService.annualProgramChanged$, this.programBookService.programBookChanged$).pipe(
      takeUntil(until$),
      startWith(null),
      map(() => {
        const menuItems: IMoreOptionsMenuItem[] = [];
        this.addEditItem(menuItems, annualProgram);
        if (annualProgram.status !== AnnualProgramStatus.new) {
          this.addShareItem(menuItems, annualProgram);
        }
        this.addDeleteItem(menuItems, annualProgram, fromPage);
        return menuItems;
      })
    );
  }

  private addEditItem(menuItems: IMoreOptionsMenuItem[], annualProgram: IEnrichedAnnualProgram): void {
    if (!this.annualProgramService.canEditAnnualProgram(annualProgram)) {
      return;
    }
    menuItems.push({
      label: 'Éditer la programmation',
      action: () => {
        const modal = this.dialogsService.showModal(AnnualProgramModalComponent);
        modal.componentInstance.buttonLabel = 'Modifier';
        modal.componentInstance.title = 'Modifier une programmation annuelle';
        modal.componentInstance.annualProgram = annualProgram;
      },
      permission: Permission.ANNUAL_PROGRAM_WRITE,
      restrictionItems: [{ entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }]
    });
  }

  private addShareItem(menuItems: IMoreOptionsMenuItem[], annualProgram: IEnrichedAnnualProgram): void {
    if (!this.annualProgramService.canShareAnnualProgram(annualProgram)) {
      return;
    }
    menuItems.push({
      label: 'Diffuser la programmation',
      action: () => {
        const modal = this.dialogsService.showModal(AnnualProgramShareModalComponent);
        modal.componentInstance.title = 'Diffuser la programmation annuelle';
        modal.componentInstance.annualProgram = annualProgram;
      },
      permission: Permission.ANNUAL_PROGRAM_WRITE,
      restrictionItems: [{ entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }]
    });
  }

  private addDeleteItem(
    menuItems: IMoreOptionsMenuItem[],
    annualProgram: IEnrichedAnnualProgram,
    fromPage?: FromPage
  ): void {
    menuItems.push({
      label: 'Supprimer la programmation',
      action: async () => {
        annualProgram.programBooks = await this.programBookService.getAnnualProgramProgramBooks(annualProgram.id, [
          PROGRAM_BOOK_FIELDS.ID
        ]);
        if (!this.annualProgramService.canDeleteAnnualProgram(annualProgram)) {
          return this.notificationsService.showError(
            `Pour supprimer une programmation annuelle, elle ne doit contenir aucun carnet`
          );
        }
        const modalTitle = 'Supprimer la programmation annuelle';
        const message =
          'La suppression de cette programmation annuelle entrainera la perte des données. Êtes-vous certain de vouloir continuer?';
        const modal = this.dialogsService.showDeleteModal(modalTitle, message);
        const result = await modal.result;
        if (result === ConfirmationModalCloseType.confirmed) {
          await this.annualProgramService.delete(annualProgram, fromPage);

          this.notificationsService.showSuccess('Programmation annuelle supprimée');
        }
      },
      permission: Permission.ANNUAL_PROGRAM_WRITE,
      restrictionItems: [{ entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }]
    });
  }
}

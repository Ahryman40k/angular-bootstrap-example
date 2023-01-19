import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {
  BaseProgramBookService,
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { get, sumBy } from 'lodash';
import { AutomaticLoadingProgrambookModalComponent } from 'src/app/program-book/automatic-loading-programbook-modal/automatic-loading-programbook-modal.component';
import { ProgramBookModalComponent } from 'src/app/program-book/program-book-modal/program-book-modal.component';
import { ProgramBookOpenComponent } from 'src/app/program-book/program-book-open/program-book-open.component';
import { ProgramBookShareModalComponent } from 'src/app/program-book/program-book-share-modal/program-book-share-modal.component';
import { ProgramBookShareFinalModalComponent } from '../../program-book/program-book-share-final-modal/program-book-share-final-modal.component';

import { DialogsService } from '../dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../forms/confirmation-modal/confirmation-modal.component';
import { IMoreOptionsMenuItem } from '../models/more-options-menu/more-options-menu-item';
import { NotificationsService } from '../notifications/notifications.service';
import { ProgramBookService } from './program-book.service';

const enum DeleteMessage {
  title = 'Supprimer le carnet',
  label = 'Supprimer le carnet',
  hasProject = 'Ce carnet contient toujours des projets, ce qui empêche sa suppression. Veuillez le vider de son contenu puis réessayer',
  hasProjectBtnLabel = 'Fermer',
  hasProjectAlertTitle = 'Impossible de supprimer le carnet.',
  confirm = 'La suppression de ce carnet entrainera la perte des données. Êtes-vous certain de vouloir continuer?',
  success = 'Carnet supprimé'
}

@Injectable({
  providedIn: 'root'
})
export class ProgramBookMenuService extends BaseProgramBookService {
  constructor(
    private readonly dialogsService: DialogsService,
    private readonly programBookService: ProgramBookService,
    private readonly notificationsService: NotificationsService,
    private readonly router: Router
  ) {
    super();
  }

  public getMenuItems(
    programBook: IEnrichedProgramBook,
    annualProgram: IEnrichedAnnualProgram
  ): IMoreOptionsMenuItem[] {
    // IMPORTANT: Menu items must have a link OR an action. Not both.
    const menuItems: IMoreOptionsMenuItem[] = [];
    menuItems.push(this.createEditProgramBookMenuItem(programBook, annualProgram));
    if (this.programBookService.canOpenProgramBook(programBook, annualProgram)) {
      menuItems.push(this.createOpenProgramBookMenuItem(programBook, annualProgram));
    }
    if (this.programBookService.canLoadProgramBook(programBook)) {
      menuItems.push(this.createAutomaticLoadingProgrambookMenuItems(programBook, annualProgram));
    }
    if (this.programBookService.canShareProgramBook(programBook)) {
      menuItems.push(this.createShareProgramBookMenuItem(programBook, annualProgram));
    }
    if (this.programBookService.canFinalShareProgramBook(programBook)) {
      menuItems.push(this.createFinalShareProgramBookMenuItem(programBook, annualProgram));
    }
    menuItems.push(this.createDeleteProgramBookMenuItem(programBook, annualProgram));
    return menuItems;
  }

  private createAutomaticLoadingProgrambookMenuItems(
    programBook: IEnrichedProgramBook,
    annualProgram: IEnrichedAnnualProgram
  ): IMoreOptionsMenuItem {
    return {
      label: 'Chargement du carnet',
      action: async () => {
        const modal = this.dialogsService.showModal(AutomaticLoadingProgrambookModalComponent);
        modal.componentInstance.programBook = programBook;
      },
      permission: Permission.PROGRAM_BOOK_LOAD,
      restrictionItems: [
        { entity: programBook, entityType: 'PROGRAM_BOOK' },
        { entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }
      ]
    };
  }

  private createEditProgramBookMenuItem(
    programBook: IEnrichedProgramBook,
    annualProgram: IEnrichedAnnualProgram
  ): IMoreOptionsMenuItem {
    return {
      label: 'Éditer le carnet',
      action: () => {
        const modal = this.dialogsService.showModal(ProgramBookModalComponent);
        modal.componentInstance.programBook = programBook;
        modal.componentInstance.title = 'Modifier le carnet de programmation';
        modal.componentInstance.buttonLabel = 'Modifier';
      },
      permission: Permission.PROGRAM_BOOK_WRITE,
      restrictionItems: [
        { entity: programBook, entityType: 'PROGRAM_BOOK' },
        { entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }
      ]
    };
  }

  private createOpenProgramBookMenuItem(
    programBook: IEnrichedProgramBook,
    annualProgram: IEnrichedAnnualProgram
  ): IMoreOptionsMenuItem {
    return {
      label: 'Ouvrir le carnet',
      action: () => {
        const modal = this.dialogsService.showModal(ProgramBookOpenComponent);
        modal.componentInstance.programBook = programBook;
      },
      permission: Permission.PROGRAM_BOOK_WRITE,
      restrictionItems: [
        { entity: programBook, entityType: 'PROGRAM_BOOK' },
        { entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }
      ]
    };
  }

  private createShareProgramBookMenuItem(
    programBook: IEnrichedProgramBook,
    annualProgram: IEnrichedAnnualProgram
  ): IMoreOptionsMenuItem {
    return {
      label: 'Diffuser le carnet',
      action: () => {
        const modal = this.dialogsService.showModal(ProgramBookShareModalComponent);
        modal.componentInstance.programBook = programBook;
      },
      permission: Permission.PROGRAM_BOOK_WRITE,
      restrictionItems: [
        { entity: programBook, entityType: 'PROGRAM_BOOK' },
        { entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }
      ]
    };
  }
  private createFinalShareProgramBookMenuItem(
    programBook: IEnrichedProgramBook,
    annualProgram: IEnrichedAnnualProgram
  ): IMoreOptionsMenuItem {
    return {
      label: 'Diffusion finale du carnet',
      action: () => {
        const modal = this.dialogsService.showModal(ProgramBookShareFinalModalComponent);
        modal.componentInstance.programBook = programBook;
      },
      permission: Permission.PROGRAM_BOOK_WRITE,
      restrictionItems: [
        { entity: programBook, entityType: 'PROGRAM_BOOK' },
        { entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }
      ]
    };
  }

  public canRemoveProgramBook(programBook: IEnrichedProgramBook): boolean {
    const projectCount = sumBy(programBook?.priorityScenarios, 'orderedProjects.paging.totalCount');
    return projectCount === 0 ? true : false;
  }

  private createDeleteProgramBookMenuItem(
    programBook: IEnrichedProgramBook,
    annualProgram: IEnrichedAnnualProgram
  ): IMoreOptionsMenuItem {
    return {
      label: DeleteMessage.label,
      action: async () => {
        const modalTitle = DeleteMessage.title;
        let modal: NgbModalRef;
        let message: string;
        if (!this.canRemoveProgramBook(programBook)) {
          message = DeleteMessage.hasProject;
          modal = this.dialogsService.showAlertModal(
            modalTitle,
            message,
            DeleteMessage.hasProjectBtnLabel,
            DeleteMessage.hasProjectAlertTitle
          );
        } else {
          message = DeleteMessage.confirm;
          modal = this.dialogsService.showDeleteModal(modalTitle, message);
        }
        const result = await modal.result;
        if (result === ConfirmationModalCloseType.confirmed) {
          await this.programBookService.delete(programBook.id);
          void this.router.navigate(['/annual-programs/', annualProgram.id]);
          this.notificationsService.showSuccess(DeleteMessage.success);
        }
      },
      permission: Permission.PROGRAM_BOOK_WRITE,
      restrictionItems: [
        { entity: programBook, entityType: 'PROGRAM_BOOK' },
        { entity: annualProgram, entityType: 'ANNUAL_PROGRAM' }
      ]
    };
  }
}

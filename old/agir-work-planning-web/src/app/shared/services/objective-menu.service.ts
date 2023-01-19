import { Injectable } from '@angular/core';
import { IEnrichedObjective, IEnrichedProgramBook, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { DialogsService } from '../dialogs/dialogs.service';
import { ObjectiveModalComponent } from '../dialogs/objective-modal/objective-modal.component';
import { ConfirmationModalCloseType } from '../forms/confirmation-modal/confirmation-modal.component';
import { IMoreOptionsMenuItem } from '../models/more-options-menu/more-options-menu-item';
import { NotificationsService } from '../notifications/notifications.service';
import { IRestrictionItem } from '../user/user-restrictions.service';
import { ObjectiveService } from './objective.service';

@Injectable({
  providedIn: 'root'
})
export class ObjectiveMenuService {
  constructor(
    private readonly dialogsService: DialogsService,
    private readonly objectiveService: ObjectiveService,
    private readonly notificationsService: NotificationsService
  ) {}

  public getMenuItems(
    objective: IEnrichedObjective,
    programBook: IEnrichedProgramBook,
    restrictionItems: IRestrictionItem[]
  ): IMoreOptionsMenuItem[] {
    return [
      this.createEditObjectiveMenuItem(objective, programBook, restrictionItems),
      this.createPinObjectiveMenuItem(objective, programBook.id, restrictionItems),
      this.createDeleteObjectiveMenuItem(objective, programBook.id, restrictionItems)
    ];
  }

  private createEditObjectiveMenuItem(
    objective: IEnrichedObjective,
    programBook: IEnrichedProgramBook,
    restrictionItems: IRestrictionItem[]
  ): IMoreOptionsMenuItem {
    return {
      label: "Modifier l'objectif",
      action: () => {
        const modal = this.dialogsService.showModal(ObjectiveModalComponent);
        modal.componentInstance.title = 'Modifier un objectif';
        modal.componentInstance.buttonLabel = 'Modifier';
        modal.componentInstance.objective = objective;
        modal.componentInstance.programBookId = programBook.id;
        modal.componentInstance.programBook = programBook;
      },
      permission: Permission.PROGRAM_BOOK_OBJECTIVE_WRITE,
      restrictionItems
    };
  }

  private createPinObjectiveMenuItem(
    objective: IEnrichedObjective,
    programBookId: string,
    restrictionItems: IRestrictionItem[]
  ): IMoreOptionsMenuItem {
    return {
      label: objective.pin ? "Retirer l'épingle de l'objectif" : `Épingler l'objectif`,
      action: () => void this.objectiveService.patch(programBookId, objective, { pin: !objective.pin }),
      permission: Permission.PROGRAM_BOOK_OBJECTIVE_WRITE,
      restrictionItems
    };
  }

  private createDeleteObjectiveMenuItem(
    objective: IEnrichedObjective,
    programBookId: string,
    restrictionItems: IRestrictionItem[]
  ): IMoreOptionsMenuItem {
    return {
      label: "Supprimer l'objectif",
      action: async () => {
        const title = "Supprimer l'objectif";
        const message =
          'La suppression de cet objectif entrainera la perte des données. Êtes-vous certain de vouloir continuer?';
        const modal = this.dialogsService.showDeleteModal(title, message);
        const result = await modal.result;
        if (result === ConfirmationModalCloseType.confirmed) {
          await this.objectiveService.delete(programBookId, objective.id);
          this.notificationsService.showSuccess('Objectif supprimé');
        }
      },
      permission: Permission.PROGRAM_BOOK_OBJECTIVE_WRITE,
      restrictionItems
    };
  }
}

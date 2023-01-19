import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { ProgramBookPriorityScenariosComponent } from 'src/app/program-book/program-book-priority-scenarios/program-book-priority-scenarios.component';

import { DialogsService } from '../dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../forms/confirmation-modal/confirmation-modal.component';
import { PriorityScenarioService } from '../services/priority-scenario.service';
import { ProgramBookService } from '../services/program-book.service';

@Injectable({
  providedIn: 'root'
})
export class PriorityScenariosGuard implements CanDeactivate<ProgramBookPriorityScenariosComponent> {
  constructor(
    public dialogsService: DialogsService,
    private readonly priorityScenarioService: PriorityScenarioService,
    private readonly programBookService: ProgramBookService
  ) {}

  public async canDeactivate(component: ProgramBookPriorityScenariosComponent): Promise<boolean> {
    if (!component.priorityLevelsChanged || component.programBookDeleted) {
      return true;
    }

    const title = `Quitter la page`;
    const message = `Quitter la page entrainera la perte des données non-sauvegardées de l'ordonnancement. Êtes-vous certain de vouloir continuer?`;
    const confirmLabel = `Quitter`;
    const modal = this.dialogsService.showDeleteModal(title, message, confirmLabel);
    const result = await modal.result;

    result === ConfirmationModalCloseType.confirmed
      ? this.priorityScenarioService.priorityScenarioUnsavedSubject.next(false)
      : this.priorityScenarioService.priorityScenarioPageReturnedSubject.next();

    return result === ConfirmationModalCloseType.confirmed;
  }
}

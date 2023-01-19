import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedProgramBook, IOrderedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { DEFAULT_SCENARIO_INDEX } from 'src/app/program-book/base-program-book-tab.component';

import { BaseComponent } from '../../components/base/base.component';
import { ConfirmationModalCloseType } from '../../forms/confirmation-modal/confirmation-modal.component';
import { IMenuItemConfig } from '../../models/menu/menu-item-config';
import { PriorityScenarioService } from '../../services/priority-scenario.service';

@Component({
  selector: 'app-consult-sequencing-notes-modal',
  templateUrl: './consult-sequencing-notes-modal.component.html',
  styleUrls: ['./consult-sequencing-notes.modal.component.scss']
})
export class ConsultSequencingNotesModalComponent extends BaseComponent {
  public orderedProject: IOrderedProject;
  public programBook: IEnrichedProgramBook;

  public get initialRank(): number {
    return Math.floor(this.orderedProject.initialRank);
  }

  public get rank(): number {
    return Math.floor(this.orderedProject.rank);
  }

  public get arePriorityScenariosOutdated(): boolean {
    return this.priorityScenarioService.arePriorityScenariosOutdated(this.programBook);
  }

  constructor(public activeModal: NgbActiveModal, private readonly priorityScenarioService: PriorityScenarioService) {
    super();
  }

  public initialize(config: IMenuItemConfig): void {
    this.orderedProject = config.orderedProject;
    this.programBook = config.programBook;
  }

  public async deleteManualRank(): Promise<void> {
    const result = await this.priorityScenarioService.deleteManualRank(this.programBook, this.orderedProject);
    if (result === ConfirmationModalCloseType.confirmed) {
      this.activeModal.close();
    }
  }

  private getAlertModalInformation(): { [key: string]: string } {
    return {
      title: `Supprimer le rang manuel`,
      alertTitle: 'Attention!',
      message: `La suppression du rang manuel entraînera la perte des données. Êtes-vous certain de vouloir continuer?`,
      cancelLabel: `Annuler`,
      confirmLabel: `Supprimer`,
      confirmButtonClass: 'btn-danger'
    };
  }

  private getRankWithDecimals(newRank: number): number {
    return this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].orderedProjects.items.find(
      p => Math.floor(p.rank) === Math.floor(newRank)
    )?.rank;
  }

  public cancel(): void {
    this.activeModal.close(true);
  }
}

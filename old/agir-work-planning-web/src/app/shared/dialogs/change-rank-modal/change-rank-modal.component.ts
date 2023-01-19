import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedProgramBook,
  IEnrichedProject,
  IOrderedProject
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { DEFAULT_SCENARIO_INDEX } from 'src/app/program-book/base-program-book-tab.component';

import { markAllAsTouched } from '../../forms/forms.utils';
import { IMenuItemConfig } from '../../models/menu/menu-item-config';
import { NotificationsService } from '../../notifications/notifications.service';
import { PriorityScenarioService } from '../../services/priority-scenario.service';

@Component({
  selector: 'app-change-rank-modal',
  templateUrl: './change-rank-modal.component.html'
})
export class ChangeRankModalModalComponent implements OnInit {
  public form: FormGroup;
  public isSubmitting = false;

  public project: IEnrichedProject;
  public orderedProject: IOrderedProject;
  public programBook: IEnrichedProgramBook;

  constructor(
    private readonly priorityScenarioService: PriorityScenarioService,
    private readonly notificationsService: NotificationsService,
    public activeModal: NgbActiveModal,
    public fb: FormBuilder
  ) {}

  public ngOnInit(): void {
    this.initForm();
  }

  public initialize(project: IEnrichedProject, config: IMenuItemConfig): void {
    this.project = project;
    this.programBook = config.programBook;
    this.orderedProject = config.orderedProject;
  }

  public initForm(): void {
    this.form = this.fb.group({
      actualRank: { value: Math.floor(this.orderedProject.rank), disabled: true },
      newRank: [null, [Validators.required, Validators.pattern('[0-9]*')]],
      note: [null, Validators.required]
    });
  }

  public async submit(): Promise<void> {
    const newRank = +this.form.value.newRank;

    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    if (!this.newRankOrderedProject(newRank) || this.areRankEquals(newRank)) {
      this.notificationsService.showError('Ce rang est invalide.');
      return;
    }
    if (this.isNewRankManuallyOrdered()) {
      this.notificationsService.showError('Ce rang est déjà assigné à un autre projet ordonné manuellement.');
      return;
    }

    await this.priorityScenarioService.updateOrderedProjectManualRank(
      this.programBook.id,
      this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].id,
      this.project.id,
      { newRank: this.getRankWithDecimals(newRank), note: this.form.value.note, isManuallyOrdered: true }
    );
    this.activeModal.close(true);
  }

  public cancel(): void {
    this.activeModal.close(true);
  }

  private isNewRankManuallyOrdered(): boolean {
    const newRank = +this.form.value.newRank;
    const orderedProject = this.newRankOrderedProject(newRank);
    return orderedProject?.isManuallyOrdered;
  }

  private newRankOrderedProject(newRank: number): IOrderedProject {
    return this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].orderedProjects.items.find(
      p => Math.floor(p.rank) === Math.floor(newRank)
    );
  }

  private areRankEquals(newRank: number): boolean {
    return Math.floor(this.orderedProject.rank) === Math.floor(newRank);
  }

  private getRankWithDecimals(newRank: number): number {
    return this.programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].orderedProjects.items.find(
      p => Math.floor(p.rank) === Math.floor(newRank)
    )?.rank;
  }
}

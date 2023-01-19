import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  IEnrichedProject,
  ISubmission,
  ITaxonomy
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject, of } from 'rxjs';
import { HiddenColumns } from 'src/app/shared/models/menu/hidden-columns';
import { IColumn, IColumnConfig, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';

import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, take, tap } from 'rxjs/operators';
import { AlertType } from 'src/app/shared/alerts/alert/alert.component';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { SortingStatus } from 'src/app/shared/directives/sort.directive';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { ProgramBookTableColumns } from 'src/app/shared/models/table/column-config-enums';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SubmissionProjectErrorService } from 'src/app/shared/services/submission-project-error.service';
import { SubmissionProjectStoreService } from 'src/app/shared/services/submission-project-store.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { IMoreOptionsMenuItem } from '../../shared/models/more-options-menu/more-options-menu-item';
import { AddProjectToSubmissionModalComponent } from '../add-project-to-submission-modal/add-project-to-submission-modal.component';

enum BorderColor {
  borderDefault = '',
  borderWhite = 'border-white'
}

@Component({
  selector: 'app-program-book-submission-table-items',
  templateUrl: './program-book-submission-table-items.component.html',
  styleUrls: ['./program-book-submission-table-items.component.scss']
})
export class ProgramBookTableSubmissionItemsComponent extends BaseComponent implements OnInit, OnDestroy {
  @Input() public annualProgram: IEnrichedAnnualProgram;
  @Input() public columnConfig: IColumnConfig;
  @Input() public index: number;
  @Input() public programBook: IEnrichedProgramBook;
  @Input() public condition: boolean;
  @Input() public programTaxonomies: ITaxonomy[];
  @Input() public boroughTaxonomies: ITaxonomy[];
  @Input() public form: FormGroup;
  @Input() public columnOptions: (project: IEnrichedProject) => IColumnOptions;
  public ProgramBookTableColumns = ProgramBookTableColumns;

  public background = 'hover-background';
  public HiddenColumns = HiddenColumns;
  public menuItemsSubject = new BehaviorSubject<IMoreOptionsMenuItem[]>(null);
  public menuItems$ = this.menuItemsSubject.asObservable();
  public myFormControlName: string;
  public disableMenu = false;

  // display checkbox classes
  public borderColor = BorderColor.borderDefault;

  constructor(
    private readonly submissionProjectStore: SubmissionProjectStoreService,
    private readonly submissionProjectService: SubmissionProjectService,
    private readonly submissionProjectErrorService: SubmissionProjectErrorService,
    private readonly projectService: ProjectService,
    private readonly notificationsService: NotificationsService,
    private dialogsService: DialogsService
  ) {
    super();
  }

  public isCheckboxDisabled(project: IEnrichedProject): boolean {
    return this.submissionProjectStore.isCheckboxDisabled(project);
  }

  public setCheckbox(value: boolean, project: IEnrichedProject) {
    if (value) {
      this.submissionProjectStore.selectProject(project);
    } else {
      this.submissionProjectStore.deselectProject(project);
    }
  }

  public columnClass(column: IColumn, project: IEnrichedProject): string {
    const projectIndex = this.submissionProjectStore.projects.findIndex(el => el.id === project.id);
    const isFirstProject = projectIndex === 0;
    const isLastProject = projectIndex === this.submissionProjectStore.projects.length - 1;
    return this.isSubmissionColumn(column) && this.isSortedBySubmission() && this.isFirstProjectWithSubmission(project)
      ? `${column.columnName} ${!isLastProject ? 'without-border-bottom' : ''} ${!isFirstProject ? 'border-top' : ''}`
      : column.columnName;
  }

  public checkboxValue(project: IEnrichedProject): boolean {
    return this.submissionProjectStore.selectedProjectsIds.includes(project.id);
  }

  public get projects(): IEnrichedProject[] {
    return this.submissionProjectStore.projects;
  }

  private addProjectToSubmissionMenuItem(project: IEnrichedProject): IMoreOptionsMenuItem {
    return {
      label: 'Ajouter le projet à une soumission existante',
      action: () => {
        const modal = this.dialogsService.showModal(AddProjectToSubmissionModalComponent);
        modal.componentInstance.project = project;
      },
      restrictionItems: [{ entity: project, entityType: 'PROJECT' }]
    };
  }

  private removeProjectFromSubmissionMenuItem(project: IEnrichedProject): IMoreOptionsMenuItem {
    return {
      label: 'Retirer le projet de la soumission',
      action: async () => {
        if (this.submissionProjectStore.isProjectHasSubmissionRequirement(project)) {
          this.dialogsService.showAlertModal(
            'Retirer le projet de la soumission',
            `Ce projet contient une ou des exigences de conception reliée(s) à un ou d'autres projets. Veuillez modifier ou supprimer ces exigences avant de continuer.`,
            'Fermer'
          );
        } else {
          await this.removeProjectFromSubmission(project);
        }
      },
      restrictionItems: [{ entity: project, entityType: 'PROJECT' }]
    };
  }

  private async removeProjectFromSubmission(project: IEnrichedProject): Promise<void> {
    const dialog = this.dialogsService.showAlertModal(
      'Retirer le projet de la soumission',
      `L’action de retirer le projet de la soumission entrainera la perte des données. Êtes-vous certain de vouloir continuer?`,
      'Annuler',
      'Attention!',
      AlertType.warning,
      'Retirer',
      'btn-danger',
      'icon-info'
    );
    const result = await dialog.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      this.submissionProjectService
        .removeProjectFromSubmission(project)
        .pipe(
          tap((submission: ISubmission) => {
            this.submissionProjectStore.updateSubmission(submission);
            this.notificationsService.showSuccess('Project retiré de la soumission avec succès');
          }),
          switchMap(() => {
            return this.projectService.getProject(project.id);
          }),
          tap(newProject => {
            const partialProject: Partial<IEnrichedProject> = {
              submissionNumber: newProject.submissionNumber
            };
            this.submissionProjectStore.patchProject(newProject.id, partialProject);
          }),
          switchMap(newProject => {
            // if precedent submission does exist in the store should get it from database
            const submissionNumberIndex = this.submissionProjectStore.submissions.findIndex(
              el => el.submissionNumber === newProject.submissionNumber
            );
            if (newProject.submissionNumber && submissionNumberIndex === -1) {
              return this.submissionProjectService.getSubmissionById(newProject.submissionNumber);
            }
            return of(null);
          }),
          take(1)
        )
        .subscribe(
          (submission: ISubmission) => {
            if (submission) {
              this.submissionProjectStore.updateSubmission(submission);
            }
            this.submissionProjectStore.sortProjects();
          },
          (err: HttpErrorResponse) => {
            this.submissionProjectErrorService.handleRemoveProjectFromSubmissionError(err);
          }
        );
    }
  }

  private canAddProjectToSubmission(project: IEnrichedProject): boolean {
    return (
      (this.submissionProjectStore.isProjectWithDrmOnly(project) ||
        this.submissionProjectStore.isProjectWithSubmissionInvalid(project)) &&
      this.submissionProjectStore.isProjectWithStatusPreliminaryOrderedOrFinalOrdered(project)
    );
  }

  public isFirstProjectWithSubmission(project: IEnrichedProject): boolean {
    return this.submissionProjectStore.isFirstProjectWithSubmission(project);
  }

  public isSortedBySubmission(): boolean {
    return (
      this.columnConfig.columns.find(el => el.sorting === SortingStatus.active)?.columnName ===
      ProgramBookTableColumns.SUBMISSION_NUMBER
    );
  }

  public isSubmissionColumn(column: IColumn): boolean {
    return column.columnName === ProgramBookTableColumns.SUBMISSION_NUMBER;
  }

  public menuItems(project: IEnrichedProject): IMoreOptionsMenuItem[] {
    const items: IMoreOptionsMenuItem[] = [];
    if (this.canAddProjectToSubmission(project)) {
      items.push(this.addProjectToSubmissionMenuItem(project));
    }

    if (this.submissionProjectStore.isProjectWithSubmissionValid(project)) {
      items.push(this.removeProjectFromSubmissionMenuItem(project));
    }

    return items;
  }
}

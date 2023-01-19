import { Injectable } from '@angular/core';
import {
  AnnualProgramExpand,
  IEnrichedAnnualProgram,
  IEnrichedProject,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { merge, Observable } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';

import { isEmpty, isNil, max, min, uniq } from 'lodash';
import { AddProjectPriorityServiceModalComponent } from '../dialogs/add-project-priority-service-modal/add-project-priority-service-modal.component';
import { ChangeRankModalModalComponent } from '../dialogs/change-rank-modal/change-rank-modal.component';
import { ConsultSequencingNotesModalComponent } from '../dialogs/consult-sequencing-notes-modal/consult-sequencing-notes-modal.component';
import { DialogsService } from '../dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../forms/confirmation-modal/confirmation-modal.component';
import { ANNUAL_PROGRAM_FIELDS, IAnnualProgramFindOptions } from '../models/findOptions/annualProgramFindOptions';
import { IMenuItemConfig } from '../models/menu/menu-item-config';
import { MenuItemKey } from '../models/menu/menu-item-key';
import { IMoreOptionsMenuItem } from '../models/more-options-menu/more-options-menu-item';
import { NotificationsService } from '../notifications/notifications.service';
import { UserService } from '../user/user.service';
import { AnnualProgramService } from './annual-program.service';
import { MapOutlet } from './map-navigation.service';
import { MapService } from './map.service';
import { PriorityScenarioService } from './priority-scenario.service';
import { ProgramBookService } from './program-book.service';
import { ProjectService } from './project.service';

export interface IProjectWithCompatibleAnnualProgramBooks {
  project: IEnrichedProject;
  annualPrograms: IEnrichedAnnualProgram[]; // ligthened annualPrograms containing only compatibles programbooks
}

@Injectable({
  providedIn: 'root'
})
export class ProjectMenuService {
  constructor(
    private readonly annualProgramService: AnnualProgramService,
    private readonly programBookService: ProgramBookService,
    private readonly userService: UserService,
    private readonly projectService: ProjectService,
    private readonly priorityScenarioService: PriorityScenarioService,
    private readonly dialogsService: DialogsService,
    private readonly notificationsService: NotificationsService,
    private readonly mapService: MapService
  ) {}

  public getMenuItems(
    project: IEnrichedProject,
    until$: Observable<unknown>,
    options: IMenuItemConfig = { newWindow: true }
  ): Observable<IMoreOptionsMenuItem[]> {
    return merge(
      this.projectService.projectChanged$.pipe(takeUntil(until$)),
      this.programBookService.programBookChanged$.pipe(takeUntil(until$)),
      this.projectService.fromYearChanged$.pipe(takeUntil(until$))
    ).pipe(
      startWith(null),
      takeUntil(until$),
      switchMap(() => this.buildMenuItems(project, options))
    );
  }

  public initAnnualProgramFindOptions(projectsWithRemainingEmptyAnnualPeriods): IAnnualProgramFindOptions {
    const annualProgramFields = [
      ANNUAL_PROGRAM_FIELDS.EXECUTOR_ID,
      ANNUAL_PROGRAM_FIELDS.YEAR,
      ANNUAL_PROGRAM_FIELDS.BUDGET_CAP,
      ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_NAME,
      ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_STATUS,
      ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_PROJECT_TYPES,
      ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_BOROUGH_IDS,
      ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_PROGRAM_TYPES
    ];
    return {
      fromYear: min(projectsWithRemainingEmptyAnnualPeriods.map(p => p.startYear)),
      toYear: max(projectsWithRemainingEmptyAnnualPeriods.map(p => p.endYear)),
      executorId: undefined,
      expand: AnnualProgramExpand.programBooks,
      fields: annualProgramFields
    };
  }

  public findProjectNotAllPeriodsFilled(projects: IEnrichedProject[]): IEnrichedProject[] {
    return projects.filter(project => {
      const annualPeriodWithoutProgramBook = project.annualDistribution.annualPeriods?.filter(annualPeriod => {
        if (isNil(annualPeriod.programBookId)) {
          return annualPeriod;
        }
      });
      if (!isEmpty(annualPeriodWithoutProgramBook)) {
        return project;
      }
    });
  }

  public getIProjectWithCompatibleAnnualProgramBooks(
    projects: IEnrichedProject[],
    projectsWithRemainingEmptyAnnualPeriods: IEnrichedProject[]
  ): IProjectWithCompatibleAnnualProgramBooks[] {
    return projects
      .filter(p => !projectsWithRemainingEmptyAnnualPeriods.map(project => project.id).includes(p.id))
      .map(nonProgrammableProject => {
        return {
          project: nonProgrammableProject,
          annualPrograms: []
        };
      });
  }
  public async getCompatibleAnnualProgramBooks(
    projects: IEnrichedProject[]
  ): Promise<IProjectWithCompatibleAnnualProgramBooks[]> {
    if (!(await this.userService.hasPermission(Permission.PROGRAM_BOOK_PROGRAM))) {
      return projects.map(project => ({
        project,
        annualPrograms: []
      }));
    }

    // find only project that do not have all annual periods filled with programbooks
    const projectsWithRemainingEmptyAnnualPeriods: IEnrichedProject[] = this.findProjectNotAllPeriodsFilled(projects);
    const annualProgramFindOptions: IAnnualProgramFindOptions = this.initAnnualProgramFindOptions(
      projectsWithRemainingEmptyAnnualPeriods
    );

    const results: IProjectWithCompatibleAnnualProgramBooks[] = this.getIProjectWithCompatibleAnnualProgramBooks(
      projects,
      projectsWithRemainingEmptyAnnualPeriods
    );

    for (const executorId of uniq(projectsWithRemainingEmptyAnnualPeriods.map(p => p.executorId))) {
      const { items: enrichedAnnualPrograms } = await this.annualProgramService.getAnnualProgramsFilterByOptions({
        ...annualProgramFindOptions,
        executorId
      });
      for (const project of projectsWithRemainingEmptyAnnualPeriods.filter(p => p.executorId === executorId)) {
        const projectResult: IProjectWithCompatibleAnnualProgramBooks = {
          project,
          annualPrograms: []
        };
        for (const annualProgram of enrichedAnnualPrograms) {
          const programBooks = await this.programBookService.getCompatibleProjectProgramBooks(annualProgram, project);
          if (!isEmpty(programBooks)) {
            projectResult.annualPrograms.push({
              ...annualProgram,
              programBooks
            });
          }
        }
        results.push(projectResult);
      }
    }
    // sort in same order as input
    const originalProjectIdsInOrder = projects.map(p => p.id);
    return results.sort((a, b) => {
      return originalProjectIdsInOrder.indexOf(a.project.id) - originalProjectIdsInOrder.indexOf(b.project.id);
    });
  }

  private async buildMenuItems(project: IEnrichedProject, config?: IMenuItemConfig): Promise<IMoreOptionsMenuItem[]> {
    // IMPORTANT: Menu items must have a link OR an action. Not both.
    const menuItems: IMoreOptionsMenuItem[] = [];
    const canInteract = this.projectService.canInteract(project);

    if (canInteract) {
      this.addChangeProjectItem(menuItems, project, config);
    }

    if (config?.changeProjectRank) {
      this.addChangeProjectRankItem(menuItems, project, config);
    }

    if (config?.consultSequencingNotes) {
      this.addConsultSequencingNotesItem(menuItems, config);
    }

    if (config?.removeProjectManualRank) {
      this.addRemoveProjectManualRankItem(menuItems, config);
    }

    if (config?.addPriorityService) {
      this.addPriorityServiceItem(menuItems, project);
    }

    if (
      !config?.hiddenMenuItems?.includes(MenuItemKey.REMOVE_PROGRAM_BOOK) &&
      project.annualDistribution?.annualPeriods[0].programBookId
    ) {
      menuItems.push(this.createRemoveProgramBookItem(project));
    }

    if (!config?.hiddenMenuItems?.includes(MenuItemKey.ROAD_SECTION_ACTIVITY)) {
      menuItems.push({
        label: `Consulter l'activité des tronçons du projet`,
        action: () => {
          const args = ['selection', 'projects', project.id, project.projectTypeId];
          void this.mapService.mapComponent.mapNavigationService.navigateTo(MapOutlet.rightPanel, args);
          this.mapService.toggleBottomPanel(true, project.geometry);
        },
        permission: Permission.ROAD_SECTION_ACTIVITY_READ
      });
    }

    if (!config?.disableAddProjectToProgramBook) {
      menuItems.push(...(await this.createAddProgramBookItems(project, config.compatibleAnnualPrograms)));
    }

    return menuItems;
  }

  private addConsultSequencingNotesItem(menuItems: IMoreOptionsMenuItem[], config?: IMenuItemConfig): void {
    menuItems.push({
      label: 'Consulter les notes de déplacement',
      action: () => {
        const modal = this.dialogsService.showModal(ConsultSequencingNotesModalComponent);
        modal.componentInstance.initialize(config);
      },
      permission: Permission.PROJECT_READ
    });
  }

  private addRemoveProjectManualRankItem(menuItems: IMoreOptionsMenuItem[], config?: IMenuItemConfig): void {
    menuItems.push({
      label: 'Retirer le déplacement manuel',
      disabled: this.programBookService?.selectedProgramBookDetails?.isAutomaticLoadingInProgress,
      action: async () => {
        await this.priorityScenarioService.deleteManualRank(config.programBook, config.orderedProject);
      },
      permission: Permission.PROGRAM_BOOK_PRIORITY_SCENARIOS_WRITE
    });
  }

  private addPriorityServiceItem(menuItems: IMoreOptionsMenuItem[], project: IEnrichedProject): void {
    const label =
      project.servicePriorities?.length > 0 ? 'Modifier une priorité service' : 'Ajouter une priorité service';
    menuItems.push({
      label,
      action: async () => {
        const modal = this.dialogsService.showModal(AddProjectPriorityServiceModalComponent);
        modal.componentInstance.initialize(project);
        const result = await modal.result;
        if (result?.confirmation === ConfirmationModalCloseType.canceled) {
          await this.projectService.patchProject(result.project, { servicePriorities: [] });
          this.notificationsService.showSuccess(`La priorité service a été réinitialisée avec succès`);
        }
      },
      permission: Permission.PROJECT_WRITE,
      restrictionItems: [{ entity: project, entityType: 'PROJECT' }]
    });
  }

  private addChangeProjectItem(
    menuItems: IMoreOptionsMenuItem[],
    project: IEnrichedProject,
    config?: IMenuItemConfig
  ): void {
    menuItems.push({
      label: 'Modifier le projet',
      link: `window/projects/edit/${project.id}`,
      linkNewWindow: config.newWindow,
      permission: Permission.PROJECT_WRITE,
      restrictionItems: [{ entity: project, entityType: 'PROJECT' }]
    });
  }

  private addChangeProjectRankItem(
    menuItems: IMoreOptionsMenuItem[],
    project: IEnrichedProject,
    config: IMenuItemConfig
  ): void {
    menuItems.push({
      label: 'Modifier le rang du projet',
      disabled: this.programBookService?.selectedProgramBookDetails?.isAutomaticLoadingInProgress,
      action: () => {
        const modal = this.dialogsService.showModal(ChangeRankModalModalComponent);
        modal.componentInstance.initialize(project, config);
      },
      permission: Permission.PROGRAM_BOOK_PRIORITY_SCENARIOS_WRITE,
      restrictionItems: [
        { entity: config.annualProgram, entityType: 'ANNUAL_PROGRAM' },
        { entity: config.programBook, entityType: 'PROGRAM_BOOK' }
      ]
    });
  }

  private createRemoveProgramBookItem(project: IEnrichedProject): IMoreOptionsMenuItem {
    return {
      label: "Retirer une période annuelle d'un carnet",
      disabled: this.programBookService?.selectedProgramBookDetails?.isAutomaticLoadingInProgress,
      action: () => this.programBookService.removeProjectFromProgramBook(project),
      permission: Permission.PROJECT_DECISION_REMOVE_FROM_PROGRAM_BOOK_CREATE,
      restrictionItems: [{ entity: project, entityType: 'PROJECT' }]
    };
  }

  /**
   *
   * @param project
   * @param compatibleAnnualPrograms used to avoid to request again to get annualProgram/programbooks compatible with project to be programmed in
   */
  private async createAddProgramBookItems(
    project: IEnrichedProject,
    compatibleAnnualPrograms: IEnrichedAnnualProgram[]
  ): Promise<IMoreOptionsMenuItem[]> {
    if (!(await this.userService.hasPermission(Permission.PROGRAM_BOOK_PROGRAM))) {
      return [];
    }
    let annualPrograms = compatibleAnnualPrograms;
    if (isNil(annualPrograms)) {
      annualPrograms = (await this.getCompatibleAnnualProgramBooks([project])).find(p => p.project.id === project.id)
        .annualPrograms;
    }

    const listAnnualPrograms: IMoreOptionsMenuItem[] = [];
    for (const annualProgram of annualPrograms) {
      for (const programBook of annualProgram.programBooks) {
        listAnnualPrograms.push({
          label: `Ajouter au carnet ${programBook.name}`,
          action: () => this.programBookService.addProjectToProgramBook(programBook, project.id, annualProgram),
          permission: Permission.PROGRAM_BOOK_PROGRAM,
          restrictionItems: [
            { entity: programBook, entityType: 'PROGRAM_BOOK' },
            { entity: project, entityType: 'PROJECT' }
          ]
        });
      }
    }

    return listAnnualPrograms;
  }
}

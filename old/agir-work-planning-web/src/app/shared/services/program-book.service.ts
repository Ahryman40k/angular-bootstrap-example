import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ANNUAL_PROGRAM_STATUSES_CAN_CHANGE_PROGRAM_BOOKS,
  AnnualProgramStatus,
  BoroughCode,
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedPaginatedProgramBooks,
  IEnrichedProgramBook,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IPlainProgramBook,
  IProjectDecision,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, max, min, range } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

import { DialogsService } from '../dialogs/dialogs.service';
import {
  ConfirmationModalCloseType,
  ConfirmationModalComponent
} from '../forms/confirmation-modal/confirmation-modal.component';
import { YearSelectionModalComponent } from '../forms/year-selection-modal/year-selection-modal.component';
import { buildHttpParams } from '../http/params-builder';
import { NotificationsService } from '../notifications/notifications.service';
import { enumValues } from '../utils/utils';
import { BroadcastEvent, WindowBroadcastService } from '../window/window-broadcast.service';
import { AnnualDistributionService } from './annual-distribution.service';
import { ProjectService } from './project.service';
import { SubmissionProjectService } from './submission-project.service';

@Injectable({
  providedIn: 'root'
})
export class ProgramBookService {
  public readonly programBookChangedSubject = new Subject<void>();
  public programBookChanged$ = this.programBookChangedSubject.asObservable();
  private readonly programBookSelectedSubject = new Subject<void>();
  public programBookSelected$ = this.programBookSelectedSubject.asObservable();
  private readonly programBookDeletedSubject = new Subject<void>();
  public programBookDeleted$ = this.programBookDeletedSubject.asObservable();
  private readonly selectedProgramBookDetailsSubject = new BehaviorSubject<IEnrichedProgramBook>(null);
  public selectedProgramBookDetails$ = this.selectedProgramBookDetailsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly notificationsService: NotificationsService,
    private readonly dialogsService: DialogsService,
    private readonly broadcastService: WindowBroadcastService,
    private readonly projectService: ProjectService,
    private readonly annualDistributionService: AnnualDistributionService,
    private readonly submissionProjectService: SubmissionProjectService
  ) {}

  public setSelectedProgramBooksDetails(programBook: IEnrichedProgramBook) {
    this.selectedProgramBookDetailsSubject.next(programBook);
  }

  public get selectedProgramBookDetails(): IEnrichedProgramBook {
    return this.selectedProgramBookDetailsSubject.getValue();
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.selectedProgramBookDetails.isAutomaticLoadingInProgress;
  }

  public async createProgramBook(id: string, programBook: IPlainProgramBook): Promise<void> {
    await this.http
      .post<IEnrichedProgramBook>(`${environment.apis.planning.annualPrograms}/${id}/programBooks`, programBook)
      .toPromise();
    this.programBookChangedSubject.next();
  }

  public programBookSelected(): void {
    this.programBookSelectedSubject.next();
  }

  public async getAnnualProgramProgramBooks(
    annualProgramId: string,
    fields?: string[]
  ): Promise<IEnrichedProgramBook[]> {
    const params = buildHttpParams({ fields });

    const programBooks = await this.http
      .get<IEnrichedProgramBook[]>(`${environment.apis.planning.annualPrograms}/${annualProgramId}/programBooks`, {
        params
      })
      .toPromise();
    return programBooks;
  }

  public getProgramBookById(id: string, expands?: ProgramBookExpand[]): Promise<IEnrichedProgramBook> {
    const params = buildHttpParams({ expand: expands });
    return this.http
      .get<IEnrichedProgramBook>(`${environment.apis.planning.programBooks}/${id}`, { params })
      .toPromise();
  }

  public getProgramBooks(ids: string[], fields: string[]): Promise<IEnrichedPaginatedProgramBooks> {
    const params = buildHttpParams({ id: ids.join(','), fields, limit: ids.length, offset: 0 });
    return this.http
      .get<IEnrichedPaginatedProgramBooks>(`${environment.apis.planning.programBooks}`, { params })
      .toPromise();
  }

  public getProgramBookProjects(programBookId: string): Promise<IEnrichedProject[]> {
    return this.http
      .get<IEnrichedProject[]>(`${environment.apis.planning.programBooks}/${programBookId}/projects`)
      .toPromise();
  }

  public executeProgrambookAutomaticLoading(programBookId: string): Observable<void> {
    return this.http.post<void>(`${environment.apis.planning.programBooks}/${programBookId}/load`, {});
  }

  public async update(programBookId: string, programBook: IPlainProgramBook): Promise<void> {
    await this.http
      .put<IPlainProgramBook>(`${environment.apis.planning.programBooks}/${programBookId}`, programBook)
      .toPromise();
    this.programBookChangedSubject.next();
  }

  public async patch(programBook: IEnrichedProgramBook, input: Partial<IPlainProgramBook>): Promise<void> {
    const plainProgramBook: IPlainProgramBook = {
      name: programBook.name,
      projectTypes: programBook.projectTypes,
      programTypes: programBook.programTypes,
      boroughIds: programBook.boroughIds,
      inCharge: programBook.inCharge,
      sharedRoles: programBook.sharedRoles,
      status: programBook.status
    };
    Object.assign(plainProgramBook, input);

    await this.http
      .put<IPlainProgramBook>(`${environment.apis.planning.programBooks}/${programBook.id}`, plainProgramBook)
      .toPromise();
    this.programBookChangedSubject.next();
  }

  public canInteract(programBook: IEnrichedProgramBook, annualProgram: IEnrichedAnnualProgram): boolean {
    const statuses = ANNUAL_PROGRAM_STATUSES_CAN_CHANGE_PROGRAM_BOOKS.map(s => s as string);
    return statuses.includes(annualProgram.status) && statuses.includes(programBook.status);
  }

  public canOpenProgramBook(programBook: IEnrichedProgramBook, annualProgram: IEnrichedAnnualProgram): boolean {
    return (
      this.canInteract(programBook, annualProgram) &&
      programBook.status === ProgramBookStatus.new &&
      [AnnualProgramStatus.new, AnnualProgramStatus.programming].includes(annualProgram.status as AnnualProgramStatus)
    );
  }

  public canShareProgramBook(programBook: IEnrichedProgramBook): boolean {
    const validStatuses: string[] = [ProgramBookStatus.programming, ProgramBookStatus.submittedPreliminary];
    return validStatuses.includes(programBook.status);
  }

  public canFinalShareProgramBook(programBook: IEnrichedProgramBook): boolean {
    return programBook.status === ProgramBookStatus.submittedPreliminary;
  }

  public canLoadProgramBook(programBook: IEnrichedProgramBook): boolean {
    const validStatuses: string[] = [ProgramBookStatus.programming, ProgramBookStatus.submittedPreliminary];
    return validStatuses.includes(programBook.status);
  }

  public async addProjectToProgramBook(
    programBook: IEnrichedProgramBook,
    projectId: string,
    annualProgram: IEnrichedAnnualProgram
  ): Promise<void> {
    const project = await this.projectService.getFullProject(projectId);

    const annualPeriod = await this.showProgramAnnualPeriodModal(project, programBook);
    if (!annualPeriod) {
      return;
    }

    if (annualPeriod.year !== annualProgram.year) {
      this.notificationsService.showError(
        'Le carnet de programmation doit être de la même année que la période annuelle'
      );
      return;
    }

    if (!this.annualDistributionService.canProgramAnnualPeriod(annualPeriod, project)) {
      this.notificationsService.showError(
        'Les années précédentes doivent être programmées afin de programmer celle-ci'
      );
      return;
    }

    if (!(await this.confirmNoEstimates(project, programBook))) {
      return;
    }

    if (!(await this.confirmGlobalBudget(project, annualProgram, programBook))) {
      return;
    }

    await this.programProject(programBook.id, projectId, annualPeriod.year);
    this.notificationsService.showSuccess('Projet ajouté au carnet de programmation');
  }

  private async programProject(programBookId: string, projectId: string, annualPeriodYear: number): Promise<void> {
    await this.http
      .post<IEnrichedProject>(`${environment.apis.planning.programBooks}/${programBookId}/projects`, {
        projectId,
        annualPeriodYear
      })
      .toPromise();
    this.broadcastService.publish(BroadcastEvent.projectUpdated);
    this.programBookChangedSubject.next();
  }

  public async openProgramBook(programBook: IEnrichedProgramBook): Promise<void> {
    return this.patch(programBook, { status: ProgramBookStatus.programming });
  }

  public async removeProjectFromProgramBook(project: IEnrichedProject): Promise<void> {
    if (project.submissionNumber) {
      const submission = await this.submissionProjectService.getSubmissionById(project.submissionNumber).toPromise();
      if (submission.status === SubmissionStatus.VALID) {
        this.dialogsService.showAlertModal(
          'Retirer une période annuelle',
          `Le retrait d'une période annuelle est impossible car ce projet fait déjà parti d'une soumission valide. Le projet doit être retiré de la soumission pour continuer.`,
          'Fermer'
        );
        return;
      }
    }

    const annualPeriod = await this.showRemoveAnnualPeriodModal(project);
    if (!annualPeriod) {
      return;
    }

    if (!this.annualDistributionService.canDeprogramAnnualPeriod(annualPeriod, project)) {
      this.notificationsService.showError(
        'Les années suivantes ne doivent pas être programmées afin de dé-programmer celle-ci'
      );
      return;
    }

    const programBook = await this.getProgramBookById(annualPeriod.programBookId);
    const title = `Retirer du carnet`;
    const message = `La période annuelle ${annualPeriod.year} sera retirée du carnet ${programBook.name}, voulez-vous confirmer la décision de planification?`;
    const confirmLabel = 'Retirer';
    const accept = await this.confirmationModal(title, message, confirmLabel);
    if (!accept) {
      return;
    }
    const projectDecision: IProjectDecision = {
      typeId: 'removeFromProgramBook',
      text: message
    };
    await this.http
      .post<IProjectDecision>(`${environment.apis.planning.projects}/${project.id}/decisions`, {
        decision: projectDecision,
        annualPeriodYear: annualPeriod.year
      })
      .toPromise();
    this.programBookChangedSubject.next();
    this.broadcastService.publish(BroadcastEvent.projectUpdated);
    this.notificationsService.showSuccess('Période annuelle retirée du carnet de programmation');
  }

  private async confirmationModal(title: string, message: string, confirmLabel: string): Promise<boolean> {
    const modal = this.dialogsService.showModal(ConfirmationModalComponent);
    modal.componentInstance.title = title;
    modal.componentInstance.message = message;
    modal.componentInstance.confirmLabel = confirmLabel;

    const result: ConfirmationModalCloseType = await modal.result;
    return result === ConfirmationModalCloseType.confirmed;
  }

  private async showProgramAnnualPeriodModal(
    project: IEnrichedProject,
    programBook: IEnrichedProgramBook
  ): Promise<IEnrichedProjectAnnualPeriod> {
    const nonProgrammedAnnualPeriods = project.annualDistribution.annualPeriods.filter(period => !period.programBookId);
    const annualPeriodYears = nonProgrammedAnnualPeriods.map(period => period.year);

    const modal = this.dialogsService.showModal(YearSelectionModalComponent);
    modal.componentInstance.title = `Ajouter au carnet ${programBook.name}`;
    modal.componentInstance.buttonLabel = 'Ajouter';
    modal.componentInstance.project = project;
    modal.componentInstance.formMessage = 'Année à programmer';
    modal.componentInstance.years = range(min(annualPeriodYears), max(annualPeriodYears) + 1);

    const result: number = await modal.result;
    if (result) {
      return project.annualDistribution.annualPeriods.find(period => result === period.year);
    }
    return null;
  }

  private async showRemoveAnnualPeriodModal(project: IEnrichedProject): Promise<IEnrichedProjectAnnualPeriod> {
    const programmedAnnualPeriods = project.annualDistribution.annualPeriods.filter(period => period.programBookId);
    const annualPeriodYears = programmedAnnualPeriods.map(period => period.year);
    const modal = this.dialogsService.showModal(YearSelectionModalComponent);
    modal.componentInstance.title = `Sélectionner une année`;
    modal.componentInstance.buttonLabel = 'Retirer';
    modal.componentInstance.formMessage = 'Année à dé-programmer';
    modal.componentInstance.project = project;
    modal.componentInstance.years = annualPeriodYears;

    const result: number = await modal.result;
    if (result) {
      return project.annualDistribution.annualPeriods.find(period => result === period.year);
    }
    return null;
  }

  private async confirmNoEstimates(project: IEnrichedProject, programBook: IEnrichedProgramBook): Promise<boolean> {
    if (await this.interventionsContainEstimates(project.interventions)) {
      return true;
    }
    const title = `Ajouter au carnet ${programBook.name}`;
    const message = `Le budget est absent dans une ou plusieurs interventions de ce projet. Voulez-vous tout de même ajouter ce projet au carnet ${programBook.name}?`;
    const confirmLabel = 'Ajouter au carnet';
    return this.confirmationModal(title, message, confirmLabel);
  }

  private async confirmGlobalBudget(
    project: IEnrichedProject,
    annualProgram: IEnrichedAnnualProgram,
    programBook: IEnrichedProgramBook
  ): Promise<boolean> {
    if (!(project.globalBudget.allowance > annualProgram.budgetCap)) {
      return true;
    }
    const title = `Ajouter au carnet ${programBook.name}`;
    const message = `Ce projet dépasse le seuil budgétaire annuel maximum du carnet. Voulez-vous tout de même programmer ce projet au carnet ${programBook.name}?`;
    const confirmLabel = 'Programmer au carnet';
    return this.confirmationModal(title, message, confirmLabel);
  }

  private async interventionsContainEstimates(interventions: IEnrichedIntervention[]): Promise<boolean> {
    for (const i of interventions) {
      if (!i.estimate?.allowance) {
        return false;
      }
    }
    return true;
  }

  public async getCompatibleProjectProgramBooks(
    annualProgram: IEnrichedAnnualProgram,
    project: IEnrichedProject
  ): Promise<IEnrichedProgramBook[]> {
    if (!annualProgram.programBooks) {
      return [];
    }
    const compatibleProgramBooks: IEnrichedProgramBook[] = [];
    // every the first intervention.
    const projectProgram = project?.interventions && project.interventions[0]?.programId;
    for (const programBook of annualProgram.programBooks) {
      /**
       * The following conditions allow you to add a project in a program book:
       * 1) ProgramBook status should be [ProgramBookStatus.programming, ProgramBookStatus.submittedPreliminary, ProgramBookStatus.submittedFinal]
       * 2) Project type id should be included in the programBook.projectTypes.
       * 3) Project status must be different than ProjectStatus = canceled.
       * 4) Project should not be assigned to a programBook if it's already assigned.
       * 5) Project borough Id should be compatible with the boroughIds program book.
       * 6) If programbook has a projectProgram for the same year of the annual program,
       *    then the intervention project should have the same projectProgram.
       */

      if (
        programBook.projectTypes.includes(project.projectTypeId) &&
        this.isStatusCompatibleInProgramBook(
          programBook.status,
          enumValues<string>(ProgramBookStatus).filter(s => s !== ProgramBookStatus.new)
        ) &&
        project.status !== ProjectStatus.canceled &&
        this.isProjectBoroughIdCompatibleWithProgramBook(programBook.boroughIds, project.boroughId) &&
        project.startYear <= annualProgram.year &&
        project.endYear >= annualProgram.year &&
        !project.annualDistribution.annualPeriods.find(p => p.programBookId === programBook.id) &&
        project.annualDistribution.annualPeriods
          .filter(p => !p.programBookId)
          .some(p => p.year === annualProgram.year) &&
        this.isProjectProgramCompatibleWithProgramBook(projectProgram, programBook)
      ) {
        compatibleProgramBooks.push(programBook);
      }
    }
    return compatibleProgramBooks;
  }

  public async delete(programBookId: string): Promise<void> {
    await this.http
      .delete<IEnrichedProgramBook>(`${environment.apis.planning.programBooks}/${programBookId}`)
      .toPromise();
    this.programBookDeletedSubject.next();
  }

  private isProjectProgramCompatibleWithProgramBook(
    projectProgram: string,
    programBook: IEnrichedProgramBook
  ): boolean {
    if (isEmpty(programBook.programTypes)) {
      return true;
    }
    return programBook.programTypes.includes(projectProgram);
  }

  public filterByStatusNotNew(programBooks: IEnrichedProgramBook[]): IEnrichedProgramBook[] {
    const statuses = enumValues<string>(ProgramBookStatus).filter(s => s !== ProgramBookStatus.new);
    return this.filterByStatus(programBooks, statuses);
  }

  public filterByStatus(programBooks: IEnrichedProgramBook[], statuses: string[]): IEnrichedProgramBook[] {
    return programBooks.filter(pb => statuses.includes(pb.status));
  }

  private isStatusCompatibleInProgramBook(programBookStatus: string, statuses: string[]): boolean {
    return statuses.includes(programBookStatus);
  }

  private isProjectBoroughIdCompatibleWithProgramBook(
    programBookboroughIds: string[],
    projectBoroughId: string
  ): boolean {
    if (!programBookboroughIds?.length || programBookboroughIds.includes(BoroughCode.MTL)) {
      return true;
    }

    return programBookboroughIds.includes(projectBoroughId);
  }
}

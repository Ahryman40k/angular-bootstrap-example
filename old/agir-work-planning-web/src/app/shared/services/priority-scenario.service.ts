import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IEnrichedProgramBook,
  IOrderedProject,
  IPlainPriorityLevel,
  IPriorityLevelSortCriteria,
  IPriorityScenario,
  ProgramBookPriorityLevelSort
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DEFAULT_SCENARIO_INDEX } from 'src/app/program-book/base-program-book-tab.component';
import { environment } from 'src/environments/environment';

import { AlertType } from '../alerts/alert/alert.component';
import { DialogsService } from '../dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../forms/confirmation-modal/confirmation-modal.component';
import { buildHttpParams } from '../http/params-builder';

@Injectable({
  providedIn: 'root'
})
export class PriorityScenarioService {
  public readonly priorityScenarioUnsavedSubject = new BehaviorSubject(false);
  public priorityScenarioUnsaved$ = this.priorityScenarioUnsavedSubject.asObservable();

  private readonly priorityScenarioChangedSubject = new Subject();
  public priorityScenarioChanged$ = this.priorityScenarioChangedSubject.asObservable();

  public readonly priorityScenarioSubmittedSubject = new Subject<boolean>();
  public priorityScenarioSubmitted$ = this.priorityScenarioSubmittedSubject.asObservable();

  public readonly priorityScenarioPageReturnedSubject = new Subject();
  public priorityScenarioPageReturned$ = this.priorityScenarioPageReturnedSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly dialogsService: DialogsService) {}

  public async update(
    programBookId: string,
    priorityScenarioId: string,
    priorityLevels: IPlainPriorityLevel[]
  ): Promise<void> {
    await this.http
      .put<IPriorityScenario>(
        `${environment.apis.planning.programBooks}/${programBookId}/priorityScenarios/${priorityScenarioId}/priorityLevels`,
        priorityLevels
      )
      .toPromise();
  }

  public getOrderedProjects(
    programBookId: string,
    priorityScenarioId: string,
    limit: number,
    offset: number
  ): Observable<IEnrichedProgramBook> {
    const params = { projectLimit: limit, projectOffset: offset };
    const httpParams = buildHttpParams(params);
    return this.http.get<IEnrichedProgramBook>(
      `${environment.apis.planning.programBooks}/${programBookId}/priorityScenarios/${priorityScenarioId}/orderedProjects`,
      { params: httpParams }
    );
  }

  public calculatePriorityScenario(
    programBookId: string,
    priorityScenarioId: string
  ): Observable<IEnrichedProgramBook> {
    return this.http
      .post<IEnrichedProgramBook>(
        `${environment.apis.planning.programBooks}/${programBookId}/priorityScenarios/${priorityScenarioId}/calculations`,
        {}
      )
      .pipe(tap(() => this.priorityScenarioChangedSubject.next()));
  }

  public async updateOrderedProjectManualRank(
    programBookId: string,
    priorityScenarioId: string,
    projectId: string,
    body: { newRank: number; note: string; isManuallyOrdered: boolean }
  ): Promise<void> {
    await this.http
      .put<IEnrichedProgramBook>(
        `${environment.apis.planning.programBooks}/${programBookId}/priorityScenarios/${priorityScenarioId}/orderedProjects/${projectId}/ranks`,
        body
      )
      .toPromise();

    this.priorityScenarioChangedSubject.next();
  }

  public async deleteManualRank(
    programBook: IEnrichedProgramBook,
    orderedProject: IOrderedProject
  ): Promise<ConfirmationModalCloseType> {
    const alertModal = {
      title: `Supprimer le rang manuel`,
      alertTitle: 'Attention!',
      message: `La suppression du rang manuel entraînera la perte des données. Êtes-vous certain de vouloir continuer?`,
      cancelLabel: `Annuler`,
      confirmLabel: `Supprimer`,
      confirmButtonClass: 'btn-danger'
    };

    const modalRef = this.dialogsService.showAlertModal(
      alertModal.title,
      alertModal.message,
      alertModal.cancelLabel,
      alertModal.alertTitle,
      AlertType.warning,
      alertModal.confirmLabel,
      alertModal.confirmButtonClass
    );

    const result = await modalRef.result;
    if (result !== ConfirmationModalCloseType.confirmed) {
      return ConfirmationModalCloseType.canceled;
    }

    await this.updateOrderedProjectManualRank(
      programBook.id,
      programBook.priorityScenarios[DEFAULT_SCENARIO_INDEX].id,
      orderedProject.projectId,
      { newRank: orderedProject.rank, note: null, isManuallyOrdered: false }
    );

    modalRef.close();

    return ConfirmationModalCloseType.confirmed;
  }

  public arePriorityScenariosOutdated(programBook: IEnrichedProgramBook): boolean {
    return programBook.priorityScenarios.some(priorityScenario => priorityScenario.isOutdated);
  }

  public getDefaultSortCriterias(): IPriorityLevelSortCriteria[] {
    return [
      {
        name: ProgramBookPriorityLevelSort.NUMBER_OF_INTERVENTIONS_PER_PROJECT,
        rank: 1
      },
      {
        name: ProgramBookPriorityLevelSort.NUMBER_OF_CONTRIBUTIONS_TO_THRESHOLD,
        rank: 2
      },
      {
        name: ProgramBookPriorityLevelSort.ROAD_NETWORK_TYPE,
        rank: 3
      },
      {
        name: ProgramBookPriorityLevelSort.PROJECT_BUDGET,
        rank: 4
      },
      {
        name: ProgramBookPriorityLevelSort.PROJECT_ID,
        rank: 5
      }
    ];
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IRequirement, IRequirementSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { buildHttpParams } from '../http/params-builder';
import { IPaginatedResults } from '../models/paginated-results';
import { NotificationAlertType } from '../notifications/notification-alert';
import { NotificationsService } from '../notifications/notifications.service';

export enum RequirementMessages {
  addSuccess = 'Exigence créée avec succès.',
  addError = "Erreur lors de la création de l'exigence",
  updateSuccess = 'Exigence modifiée avec succès.',
  updateError = "Erreur lors de la modification de l'exigence",
  deleteSuccess = 'Exigence supprimé',
  deleteError = "Erreur lors de la suppression de l'exigence"
}
@Injectable({
  providedIn: 'root'
})
export class RequirementService {
  private readonly creationFormStatus = new BehaviorSubject<boolean>(false);
  public currentCreationFormStatus$ = this.creationFormStatus.asObservable();

  private readonly requirementChangedSubject = new Subject<void>();
  public requirementChanged$ = this.requirementChangedSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly notificationsService: NotificationsService) {}

  public setCreationFormStatus(val: boolean): void {
    this.creationFormStatus.next(val);
  }
  public getRequirementCreationFormStatus(): boolean {
    return this.creationFormStatus.getValue();
  }

  public addRequirement(requirement: IRequirement): Observable<IRequirement> {
    return this.http
      .post<IRequirement>(`${environment.apis.planning.requirements}`, requirement)
      .pipe(tap(() => this.requirementChangedSubject.next()));
  }
  public updateRequirement(requirement: IRequirement, id: string): Observable<IRequirement> {
    return this.http
      .put<IRequirement>(`${environment.apis.planning.requirements}/${id}`, requirement)
      .pipe(tap(() => this.requirementChangedSubject.next()));
  }
  public getRequirements(
    requirementSearchRequest: IRequirementSearchRequest
  ): Observable<IPaginatedResults<IRequirement>> {
    const httpParams = buildHttpParams(requirementSearchRequest);
    return this.http.get<IPaginatedResults<IRequirement>>(`${environment.apis.planning.requirements}`, {
      params: httpParams
    });
  }
  public deleteRequirement(requirement: IRequirement): void {
    this.http
      .delete<IRequirement>(`${environment.apis.planning.requirements}/${requirement.id}`)
      .pipe(take(1))
      .subscribe(
        () => {
          this.requirementChangedSubject.next();
          this.notificationsService.show(RequirementMessages.deleteSuccess, NotificationAlertType.success);
        },
        error => {
          this.notificationsService.show(RequirementMessages.deleteError, NotificationAlertType.danger);
        }
      );
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IDrmProject, IInputDrmProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Dictionary } from 'lodash';
import { BehaviorSubject, Subject } from 'rxjs';
import { IProjectOrderProps } from 'src/app/program-book/shared/models/submission-drm-columns';

import { environment } from '../../../environments/environment';
import { AlertType } from '../alerts/alert/alert.component';
import { DialogsService } from '../dialogs/dialogs.service';
import { AlertModalComponent } from '../forms/alert-modal/alert-modal.component';

@Injectable({
  providedIn: 'root'
})
export class DrmProjectService {
  public readonly drmProjectDictionarySubject = new BehaviorSubject<Dictionary<IProjectOrderProps[]>>(null);
  public drmProjectDictionary$ = this.drmProjectDictionarySubject.asObservable();

  // call when we should reload projects
  public readonly projectsDrmChangedSubject = new Subject<boolean>();
  public readonly projectsDrmChanged$ = this.projectsDrmChangedSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly dialogsService: DialogsService) {}

  public postDrmNumber(drmProjectInput: IInputDrmProject): Promise<IDrmProject[]> {
    return this.http.post<IDrmProject[]>(environment.apis.planning.drmNumber, drmProjectInput).toPromise();
  }

  public deleteDrmNumber(projectIds: string[]): Promise<void> {
    const params = new HttpParams().set('id', projectIds.join(','));
    return this.http
      .delete<void>(`${environment.apis.planning.projects}/drmNumber`, { params })
      .toPromise();
  }

  public async showDeleteConfirmationModal(title: string, alertMessage: string): Promise<any> {
    const modal = this.dialogsService.showModal(AlertModalComponent);
    modal.componentInstance.modalTitle = title;
    modal.componentInstance.alertTitle = 'Attention!';
    modal.componentInstance.type = AlertType.warning;
    modal.componentInstance.buttonLabel = 'Annuler';
    modal.componentInstance.confirmLabel = 'Supprimer';
    modal.componentInstance.confirmButtonClass = 'btn-danger';
    modal.componentInstance.alertMessage = alertMessage;
    return modal.result;
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IInterventionExtractSearchRequest,
  IProjectExtractSearchRequest
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { environment } from 'src/environments/environment';
import { Utils } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  constructor(private http: HttpClient) {}

  public async exportInterventions(searchRequest: IInterventionExtractSearchRequest): Promise<boolean> {
    try {
      const response: any = await this.http
        .post(`${environment.apis.planning.interventions}/extract`, searchRequest)
        .toPromise();

      Utils.createAndDownloadBlobFile(response);
      return true;
    } catch (e) {
      return false;
    }
  }

  public async exportProjects(searchRequest: IProjectExtractSearchRequest): Promise<boolean> {
    try {
      const response: any = await this.http
        .post(`${environment.apis.planning.projects}/extract`, searchRequest)
        .toPromise();

      Utils.createAndDownloadBlobFile(response);
      return true;
    } catch (e) {
      return false;
    }
  }
}

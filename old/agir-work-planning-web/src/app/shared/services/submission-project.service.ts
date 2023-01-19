import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ICountBy,
  IEnrichedProject,
  ISubmission,
  ISubmissionCreateRequest,
  ISubmissionPatchRequest,
  ISubmissionsSearchRequest,
  SubmissionProgressStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { environment } from 'src/environments/environment';
import { buildHttpParams } from '../http/params-builder';

export const invalidProgressStatus = [
  SubmissionProgressStatus.CALL_FOR_TENDER.toString(),
  SubmissionProgressStatus.GRANTED.toString(),
  SubmissionProgressStatus.REALIZATION.toString(),
  SubmissionProgressStatus.CLOSING.toString()
];

@Injectable({
  providedIn: 'root'
})
export class SubmissionProjectService {
  constructor(private readonly http: HttpClient) {}

  public submissionPostSearch(searchRequest: ISubmissionsSearchRequest): Observable<IPaginatedResults<ISubmission>> {
    return this.http.post<IPaginatedResults<ISubmission>>(
      `${environment.apis.planning.submissionNumber}/search`,
      searchRequest
    );
  }

  public createSubmissionProject(submission: ISubmissionCreateRequest): Observable<ISubmission> {
    return this.http.post<ISubmission>(environment.apis.planning.submissionNumber, submission);
  }

  public addProjectToSubmission(submissionNumber: string, projectId: string): Observable<ISubmission> {
    return this.http.post<ISubmission>(
      `${environment.apis.planning.submissionNumber}/${submissionNumber}/add/project/${projectId}`,
      {}
    );
  }

  public removeProjectFromSubmission(project: IEnrichedProject): Observable<ISubmission> {
    return this.http.post<ISubmission>(
      `${environment.apis.planning.submissionNumber}/${project.submissionNumber}/remove/project/${project.id}`,
      {}
    );
  }

  public patchSubmission(submissionNumber: string, submissionPatch: ISubmissionPatchRequest): Observable<ISubmission> {
    return this.http.patch<ISubmission>(
      `${environment.apis.planning.submissionNumber}/${submissionNumber}`,
      submissionPatch
    );
  }

  public getSubmissionById(submissionNumber: string): Observable<ISubmission> {
    return this.http.get<ISubmission>(`${environment.apis.planning.submissionNumber}/${submissionNumber}`);
  }

  public getSubmissionCountBy(searchRequest: any): Observable<ICountBy[]> {
    const params = buildHttpParams(searchRequest);
    return this.http.get<ICountBy[]>(`${environment.apis.planning.submissionNumber}/countBy`, { params });
  }
}

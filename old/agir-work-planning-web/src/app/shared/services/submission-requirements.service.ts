import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ISubmissionRequirement, SubmissionProgressStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable({
  providedIn: 'root'
})
export class SubmissionRequirementsService {
  constructor(private readonly http: HttpClient) {}

  public isValidSubmissionProgressStatus(submission): boolean {
    const validProgressStatus = [
      SubmissionProgressStatus.PRELIMINARY_DRAFT,
      SubmissionProgressStatus.DESIGN,
      SubmissionProgressStatus.CALL_FOR_TENDER,
      SubmissionProgressStatus.GRANTED
    ];
    return validProgressStatus.includes(submission.progressStatus as SubmissionProgressStatus);
  }

  public addSubmissionRequirement(
    submissionNumber: string,
    requirement: ISubmissionRequirement
  ): Observable<ISubmissionRequirement> {
    return this.http.post<ISubmissionRequirement>(
      `${environment.apis.planning.submissionNumber}/${submissionNumber}/requirements`,
      requirement
    );
  }

  public updateSubmissionRequirement(
    submissionNumber: string,
    requirement: ISubmissionRequirement,
    requirementId: string
  ): Observable<ISubmissionRequirement> {
    return this.http.put<ISubmissionRequirement>(
      `${environment.apis.planning.submissionNumber}/${submissionNumber}/requirements/${requirementId}`,
      requirement
    );
  }

  public deleteSubmissionRequirement(submissionNumber: string, requirementId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apis.planning.submissionNumber}/${submissionNumber}/requirements/${requirementId}`
    );
  }

  public patchSubmissionRequirement(
    submissionNumber: string,
    requirementId: string,
    submissionRequirementPatch: any
  ): Observable<ISubmissionRequirement> {
    return this.http.patch<ISubmissionRequirement>(
      `${environment.apis.planning.submissionNumber}/${submissionNumber}/requirements/${requirementId}`,
      submissionRequirementPatch
    );
  }
}
